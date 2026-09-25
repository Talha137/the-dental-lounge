import { Router } from "express";
import { pool } from "../config/db.js";
import { auth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const r = Router();

r.use(auth);

/* =========================================================
   HELPERS
========================================================= */

function clean(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const text = String(value).trim();

  return text === "" ? null : text;
}

function getClinicId(req, res) {
  const clinicId = req.user?.clinic_id;

  if (!clinicId) {
    res.status(403).json({
      message: "No clinic is assigned to this account.",
    });

    return null;
  }

  return clinicId;
}

/* =========================================================
   REFRESH INVOICE STATUS

   IMPORTANT:
   Invoice and payments are both restricted to clinic_id.
========================================================= */

async function refreshInvoiceStatus(
  client,
  invoiceId,
  clinicId
) {
  const result = await client.query(
    `
    SELECT
      i.id,
      i.total,
      COALESCE(i.discount, 0) AS discount,
      COALESCE(SUM(p.amount), 0) AS paid

    FROM invoices i

    LEFT JOIN payments p
      ON p.invoice_id = i.id
     AND p.clinic_id = i.clinic_id

    WHERE i.id = $1
      AND i.clinic_id = $2

    GROUP BY i.id
    `,
    [
      invoiceId,
      clinicId,
    ]
  );

  const invoice = result.rows[0];

  if (!invoice) {
    return;
  }

  const net =
    Number(invoice.total || 0) -
    Number(invoice.discount || 0);

  const paid =
    Number(invoice.paid || 0);

  let status = "unpaid";

  if (paid >= net && net > 0) {
    status = "paid";
  } else if (paid > 0) {
    status = "partial";
  }

  await client.query(
    `
    UPDATE invoices

    SET status = $1

    WHERE id = $2
      AND clinic_id = $3
    `,
    [
      status,
      invoiceId,
      clinicId,
    ]
  );
}

/* =========================================================
   GET ALL INVOICES

   SECURITY:
   Only invoices belonging to logged-in clinic.
========================================================= */

r.get(
  "/",
  asyncHandler(async (req, res) => {
    const clinicId = getClinicId(req, res);

    if (!clinicId) {
      return;
    }

    const { rows } = await pool.query(
      `
      SELECT
        i.*,

        p.full_name AS patient_name,
        p.patient_code,
        p.phone AS patient_phone,

        COALESCE(
          SUM(py.amount),
          0
        ) AS paid,

        GREATEST(
          i.total
          - COALESCE(i.discount, 0)
          - COALESCE(SUM(py.amount), 0),
          0
        ) AS balance

      FROM invoices i

      JOIN patients p
        ON p.id = i.patient_id
       AND p.clinic_id = i.clinic_id

      LEFT JOIN payments py
        ON py.invoice_id = i.id
       AND py.clinic_id = i.clinic_id

      WHERE i.clinic_id = $1

      GROUP BY
        i.id,
        p.id

      ORDER BY
        i.created_at DESC
      `,
      [clinicId]
    );

    res.json(rows);
  })
);

/* =========================================================
   GET PAYMENTS

   SECURITY:
   Only payment history for logged-in clinic.
========================================================= */

r.get(
  "/payments",
  asyncHandler(async (req, res) => {
    const clinicId = getClinicId(req, res);

    if (!clinicId) {
      return;
    }

    const { rows } = await pool.query(
      `
      SELECT
        py.*,
        i.invoice_no,
        p.full_name AS patient_name,
        p.patient_code

      FROM payments py

      JOIN invoices i
        ON i.id = py.invoice_id
       AND i.clinic_id = py.clinic_id

      JOIN patients p
        ON p.id = py.patient_id
       AND p.clinic_id = py.clinic_id

      WHERE py.clinic_id = $1

      ORDER BY
        py.paid_at DESC
      `,
      [clinicId]
    );

    res.json(rows);
  })
);

/* =========================================================
   CREATE INVOICE

   SECURITY:
   - clinic_id comes from JWT
   - patient must belong to clinic
   - treatment, if selected, must belong to same patient
     and same clinic
========================================================= */

r.post(
  "/invoice",
  asyncHandler(async (req, res) => {
    const clinicId = getClinicId(req, res);

    if (!clinicId) {
      return;
    }

    const {
      patient_id,
      treatment_id,
      total,
      discount,
      notes,
    } = req.body;

    if (!patient_id) {
      return res.status(400).json({
        message: "Please select a patient.",
      });
    }

    const amount = Number(total);
    const discountAmount =
      Number(discount || 0);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        message:
          "Invoice amount must be greater than zero.",
      });
    }

    if (
      !Number.isFinite(discountAmount) ||
      discountAmount < 0
    ) {
      return res.status(400).json({
        message:
          "Discount cannot be negative.",
      });
    }

    if (discountAmount > amount) {
      return res.status(400).json({
        message:
          "Discount cannot be greater than invoice amount.",
      });
    }

    /* =====================================================
       VERIFY PATIENT
    ===================================================== */

    const patientResult = await pool.query(
      `
      SELECT
        id,
        full_name

      FROM patients

      WHERE id = $1
        AND clinic_id = $2

      LIMIT 1
      `,
      [
        patient_id,
        clinicId,
      ]
    );

    if (!patientResult.rows[0]) {
      return res.status(404).json({
        message:
          "Selected patient no longer exists in your clinic.",
      });
    }

    /* =====================================================
       VERIFY OPTIONAL TREATMENT
    ===================================================== */

    if (treatment_id) {
      const treatmentResult =
        await pool.query(
          `
          SELECT id

          FROM treatments

          WHERE id = $1
            AND patient_id = $2
            AND clinic_id = $3

          LIMIT 1
          `,
          [
            treatment_id,
            patient_id,
            clinicId,
          ]
        );

      if (!treatmentResult.rows[0]) {
        return res.status(400).json({
          message:
            "Selected treatment does not belong to this patient or clinic.",
        });
      }
    }

    /* =====================================================
       GENERATE INVOICE NUMBER
    ===================================================== */

    const invoiceNo =
      "INV-" +
      Date.now()
        .toString()
        .slice(-9);

    /* =====================================================
       CREATE INVOICE
    ===================================================== */

    const { rows } = await pool.query(
      `
      INSERT INTO invoices (
        clinic_id,
        invoice_no,
        patient_id,
        treatment_id,
        total,
        discount,
        status,
        notes
      )

      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        'unpaid',
        $7
      )

      RETURNING *
      `,
      [
        clinicId,
        invoiceNo,
        patient_id,
        treatment_id || null,
        amount,
        discountAmount,
        clean(notes),
      ]
    );

    res.status(201).json({
      message:
        "Invoice created successfully.",

      invoice: rows[0],
    });
  })
);

/* =========================================================
   UPDATE INVOICE

   Invoice with received payment cannot have its net total
   reduced below amount already paid.

   SECURITY:
   Invoice + payments must belong to logged-in clinic.
========================================================= */

r.put(
  "/invoice/:id",
  asyncHandler(async (req, res) => {
    const clinicId = getClinicId(req, res);

    if (!clinicId) {
      return;
    }

    const invoiceId =
      req.params.id;

    const total =
      Number(req.body.total);

    const discount =
      Number(req.body.discount || 0);

    if (
      !Number.isFinite(total) ||
      total <= 0
    ) {
      return res.status(400).json({
        message:
          "Invoice amount must be greater than zero.",
      });
    }

    if (
      !Number.isFinite(discount) ||
      discount < 0 ||
      discount > total
    ) {
      return res.status(400).json({
        message:
          "Please enter a valid discount.",
      });
    }

    /* =====================================================
       GET EXISTING PAYMENT TOTAL
    ===================================================== */

    const existing =
      await pool.query(
        `
        SELECT
          i.id,

          COALESCE(
            SUM(p.amount),
            0
          ) AS paid

        FROM invoices i

        LEFT JOIN payments p
          ON p.invoice_id = i.id
         AND p.clinic_id = i.clinic_id

        WHERE i.id = $1
          AND i.clinic_id = $2

        GROUP BY i.id
        `,
        [
          invoiceId,
          clinicId,
        ]
      );

    if (!existing.rows[0]) {
      return res.status(404).json({
        message: "Invoice not found.",
      });
    }

    const paid =
      Number(existing.rows[0].paid);

    const net =
      total - discount;

    if (net < paid) {
      return res.status(400).json({
        message:
          `Invoice balance cannot be reduced below already received payment of PKR ${paid.toLocaleString()}.`,
      });
    }

    /* =====================================================
       UPDATE INVOICE
    ===================================================== */

    const { rows } =
      await pool.query(
        `
        UPDATE invoices

        SET
          total = $1,
          discount = $2,
          notes = $3

        WHERE id = $4
          AND clinic_id = $5

        RETURNING *
        `,
        [
          total,
          discount,
          clean(req.body.notes),
          invoiceId,
          clinicId,
        ]
      );

    if (!rows[0]) {
      return res.status(404).json({
        message: "Invoice not found.",
      });
    }

    await refreshInvoiceStatus(
      pool,
      invoiceId,
      clinicId
    );

    res.json({
      message:
        "Invoice updated successfully.",

      invoice: rows[0],
    });
  })
);

/* =========================================================
   RECEIVE PAYMENT

   SECURITY:
   - invoice must belong to clinic
   - payment clinic_id comes from JWT
   - patient_id comes from verified invoice
   - prevents overpayment
   - invoice is locked during payment
========================================================= */

r.post(
  "/payment",
  asyncHandler(async (req, res) => {
    const clinicId = getClinicId(req, res);

    if (!clinicId) {
      return;
    }

    const client =
      await pool.connect();

    try {
      await client.query("BEGIN");

      const {
        invoice_id,
        method,
        reference,
      } = req.body;

      const amount =
        Number(req.body.amount);

      if (!invoice_id) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message:
            "Please select an outstanding invoice.",
        });
      }

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message:
            "Payment amount must be greater than zero.",
        });
      }

      /* ===================================================
         LOCK INVOICE

         Prevents simultaneous payments causing overpayment.
      =================================================== */

      const invoiceResult =
        await client.query(
          `
          SELECT
            id,
            patient_id,
            total,
            COALESCE(discount, 0) AS discount

          FROM invoices

          WHERE id = $1
            AND clinic_id = $2

          FOR UPDATE
          `,
          [
            invoice_id,
            clinicId,
          ]
        );

      const invoice =
        invoiceResult.rows[0];

      if (!invoice) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message:
            "Invoice not found.",
        });
      }

      /* ===================================================
         CALCULATE ALREADY PAID
      =================================================== */

      const paidResult =
        await client.query(
          `
          SELECT
            COALESCE(
              SUM(amount),
              0
            ) AS paid

          FROM payments

          WHERE invoice_id = $1
            AND clinic_id = $2
          `,
          [
            invoice_id,
            clinicId,
          ]
        );

      const alreadyPaid =
        Number(
          paidResult.rows[0].paid
        );

      const invoiceAmount =
        Number(invoice.total) -
        Number(invoice.discount);

      const balance =
        invoiceAmount -
        alreadyPaid;

      if (balance <= 0) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message:
            "This invoice is already fully paid.",
        });
      }

      if (amount > balance) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message:
            `Payment cannot exceed the outstanding balance of PKR ${balance.toLocaleString()}.`,
        });
      }

      /* ===================================================
         CREATE PAYMENT
      =================================================== */

      const paymentResult =
        await client.query(
          `
          INSERT INTO payments (
            clinic_id,
            invoice_id,
            patient_id,
            amount,
            method,
            reference,
            received_by,
            paid_at
          )

          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            NOW()
          )

          RETURNING *
          `,
          [
            clinicId,
            invoice_id,
            invoice.patient_id,
            amount,
            clean(method) || "cash",
            clean(reference),
            req.user.id,
          ]
        );

      await refreshInvoiceStatus(
        client,
        invoice_id,
        clinicId
      );

      await client.query("COMMIT");

      res.status(201).json({
        message:
          "Payment received successfully.",

        payment:
          paymentResult.rows[0],
      });

    } catch (error) {
      await client.query("ROLLBACK");

      throw error;

    } finally {
      client.release();
    }
  })
);

/* =========================================================
   DELETE PAYMENT

   If payment was entered incorrectly:
   - payment can be deleted
   - invoice status recalculates automatically

   SECURITY:
   Payment must belong to logged-in clinic.
========================================================= */

r.delete(
  "/payment/:id",
  asyncHandler(async (req, res) => {
    const clinicId = getClinicId(req, res);

    if (!clinicId) {
      return;
    }

    const client =
      await pool.connect();

    try {
      await client.query("BEGIN");

      /* ===================================================
         FIND + DELETE PAYMENT
      =================================================== */

      const result =
        await client.query(
          `
          DELETE FROM payments

          WHERE id = $1
            AND clinic_id = $2

          RETURNING
            id,
            invoice_id,
            amount
          `,
          [
            req.params.id,
            clinicId,
          ]
        );

      const payment =
        result.rows[0];

      if (!payment) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message:
            "Payment record not found.",
        });
      }

      /* ===================================================
         RECALCULATE INVOICE STATUS
      =================================================== */

      await refreshInvoiceStatus(
        client,
        payment.invoice_id,
        clinicId
      );

      await client.query("COMMIT");

      res.json({
        message:
          "Payment deleted successfully.",
      });

    } catch (error) {
      await client.query("ROLLBACK");

      throw error;

    } finally {
      client.release();
    }
  })
);

/* =========================================================
   DELETE INVOICE

   Payments belonging to invoice are deleted first.
   Invoice is then deleted.

   Patient remains safe.

   SECURITY:
   Invoice and payments must belong to logged-in clinic.
========================================================= */

r.delete(
  "/invoice/:id",
  asyncHandler(async (req, res) => {
    const clinicId = getClinicId(req, res);

    if (!clinicId) {
      return;
    }

    const client =
      await pool.connect();

    try {
      await client.query("BEGIN");

      /* ===================================================
         FIND + LOCK INVOICE
      =================================================== */

      const invoiceResult =
        await client.query(
          `
          SELECT
            id,
            invoice_no

          FROM invoices

          WHERE id = $1
            AND clinic_id = $2

          FOR UPDATE
          `,
          [
            req.params.id,
            clinicId,
          ]
        );

      const invoice =
        invoiceResult.rows[0];

      if (!invoice) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message:
            "Invoice not found. It may already have been deleted.",
        });
      }

      /* ===================================================
         DELETE PAYMENTS
      =================================================== */

      await client.query(
        `
        DELETE FROM payments

        WHERE invoice_id = $1
          AND clinic_id = $2
        `,
        [
          invoice.id,
          clinicId,
        ]
      );

      /* ===================================================
         DELETE INVOICE
      =================================================== */

      const deleted =
        await client.query(
          `
          DELETE FROM invoices

          WHERE id = $1
            AND clinic_id = $2

          RETURNING id
          `,
          [
            invoice.id,
            clinicId,
          ]
        );

      if (!deleted.rows[0]) {
        throw new Error(
          "Invoice could not be deleted."
        );
      }

      await client.query("COMMIT");

      res.json({
        message:
          `${invoice.invoice_no} deleted successfully.`,
      });

    } catch (error) {
      await client.query("ROLLBACK");

      throw error;

    } finally {
      client.release();
    }
  })
);

export default r;