import { Router } from "express";
import { pool } from "../config/db.js";
import { auth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const r = Router();

r.use(auth);

/* =========================================================
   ALLOWED APPOINTMENT STATUSES
========================================================= */

const allowedStatuses = [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no-show",
];

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

function validDate(value) {
  if (!value) {
    return false;
  }

  return !Number.isNaN(new Date(value).getTime());
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
   GET APPOINTMENTS / SEARCH / PAGINATION

   Query:
   q, page, limit, status, from, to, sort, order

   Backward compatibility:
   Without pagination/filter params, returns an array.
========================================================= */

r.get(
  "/",
  asyncHandler(async (req, res) => {
    const clinicId = getClinicId(req, res);
    if (!clinicId) return;

    const search = String(req.query.q || "").trim();
    const status = String(req.query.status || "").trim().toLowerCase();
    const from = String(req.query.from || "").trim();
    const to = String(req.query.to || "").trim();

    const hasPaginationParams =
      req.query.page !== undefined ||
      req.query.limit !== undefined ||
      req.query.sort !== undefined ||
      req.query.order !== undefined ||
      req.query.status !== undefined ||
      req.query.from !== undefined ||
      req.query.to !== undefined;

    const rawPage = Number.parseInt(String(req.query.page || "1"), 10);
    const rawLimit = Number.parseInt(String(req.query.limit || "25"), 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.min(rawLimit, 100)
        : 25;
    const offset = (page - 1) * limit;

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid appointment status." });
    }

    const allowedSorts = {
      appointment_at: "a.appointment_at",
      created_at: "a.created_at",
      patient_name: "p.full_name",
      status: "a.status",
    };
    const requestedSort = String(req.query.sort || "appointment_at").toLowerCase();
    const sortColumn = allowedSorts[requestedSort] || allowedSorts.appointment_at;
    const order =
      String(req.query.order || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";

    const values = [clinicId];
    const filters = [];

    if (search) {
      values.push(`%${search}%`);
      const n = values.length;
      filters.push(`(
        COALESCE(p.full_name, '') ILIKE $${n}
        OR COALESCE(p.patient_code, '') ILIKE $${n}
        OR COALESCE(p.phone, '') ILIKE $${n}
        OR COALESCE(a.reason, '') ILIKE $${n}
      )`);
    }

    if (status) {
      values.push(status);
      filters.push(`a.status = $${values.length}`);
    }

    if (from) {
      values.push(from);
      filters.push(`a.appointment_at >= $${values.length}::timestamptz`);
    }

    if (to) {
      values.push(to);
      filters.push(`a.appointment_at <= $${values.length}::timestamptz`);
    }

    const whereExtra = filters.length ? `AND ${filters.join(" AND ")}` : "";

    const countResult = await pool.query(
      `
        SELECT COUNT(*)::int AS total
        FROM appointments a
        JOIN patients p
          ON p.id = a.patient_id
         AND p.clinic_id = a.clinic_id
        WHERE a.clinic_id = $1
        ${whereExtra}
      `,
      values
    );

    const total = Number(countResult.rows[0]?.total || 0);
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    const dataValues = [...values, limit, offset];
    const limitParam = `$${dataValues.length - 1}`;
    const offsetParam = `$${dataValues.length}`;

    const { rows } = await pool.query(
      `
        SELECT
          a.*,
          p.full_name AS patient_name,
          p.patient_code,
          p.phone AS patient_phone,
          p.gender AS patient_gender
        FROM appointments a
        JOIN patients p
          ON p.id = a.patient_id
         AND p.clinic_id = a.clinic_id
        WHERE a.clinic_id = $1
        ${whereExtra}
        ORDER BY ${sortColumn} ${order} NULLS LAST, a.id DESC
        LIMIT ${limitParam}
        OFFSET ${offsetParam}
      `,
      dataValues
    );

    if (!hasPaginationParams) {
      return res.json(rows.slice(0, 100));
    }

    res.json({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_previous_page: page > 1,
        has_next_page: page < totalPages,
      },
      search,
      status: status || null,
      sort: Object.prototype.hasOwnProperty.call(allowedSorts, requestedSort)
        ? requestedSort
        : "appointment_at",
      order: order.toLowerCase(),
    });
  })
);

/* =========================================================
   GET SINGLE APPOINTMENT
========================================================= */

r.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const clinicId = getClinicId(req, res);

    if (!clinicId) {
      return;
    }

    const { rows } = await pool.query(
      `
      SELECT
        a.*,
        p.full_name AS patient_name,
        p.patient_code,
        p.phone AS patient_phone,
        p.gender AS patient_gender

      FROM appointments a

      JOIN patients p
        ON p.id = a.patient_id
       AND p.clinic_id = a.clinic_id

      WHERE a.id = $1
        AND a.clinic_id = $2

      LIMIT 1
      `,
      [
        req.params.id,
        clinicId,
      ]
    );

    if (!rows[0]) {
      return res.status(404).json({
        message: "Appointment not found.",
      });
    }

    res.json(rows[0]);
  })
);

/* =========================================================
   CREATE APPOINTMENT

   clinic_id always comes from authenticated user.
   Patient must belong to the same clinic.
========================================================= */

r.post(
  "/",
  asyncHandler(async (req, res) => {
    const clinicId = getClinicId(req, res);

    if (!clinicId) {
      return;
    }

    const {
      patient_id,
      appointment_at,
      reason,
      notes,
    } = req.body;

    if (!patient_id) {
      return res.status(400).json({
        message: "Please select a patient.",
      });
    }

    if (!appointment_at) {
      return res.status(400).json({
        message: "Please select appointment date and time.",
      });
    }

    if (!validDate(appointment_at)) {
      return res.status(400).json({
        message: "Appointment date or time is invalid.",
      });
    }

    /* =====================================================
       VERIFY PATIENT BELONGS TO THIS CLINIC
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
        message: "Selected patient does not exist in your clinic.",
      });
    }

    /* =====================================================
       CREATE APPOINTMENT
    ===================================================== */

    const { rows } = await pool.query(
      `
      INSERT INTO appointments (
        clinic_id,
        patient_id,
        appointment_at,
        reason,
        notes,
        status
      )

      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        'scheduled'
      )

      RETURNING *
      `,
      [
        clinicId,
        patient_id,
        appointment_at,
        clean(reason),
        clean(notes),
      ]
    );

    res.status(201).json({
      message: "Appointment booked successfully.",
      appointment: rows[0],
    });
  })
);

/* =========================================================
   UPDATE APPOINTMENT

   Allows:
   - Change patient
   - Change date/time
   - Change reason
   - Change notes
   - Change status

   Appointment and patient must belong to same clinic.
========================================================= */

r.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const clinicId = getClinicId(req, res);

    if (!clinicId) {
      return;
    }

    const {
      patient_id,
      appointment_at,
      reason,
      notes,
      status,
    } = req.body;

    if (!patient_id) {
      return res.status(400).json({
        message: "Please select a patient.",
      });
    }

    if (!appointment_at) {
      return res.status(400).json({
        message: "Appointment date and time are required.",
      });
    }

    if (!validDate(appointment_at)) {
      return res.status(400).json({
        message: "Appointment date or time is invalid.",
      });
    }

    const finalStatus = String(status || "scheduled")
      .trim()
      .toLowerCase();

    if (!allowedStatuses.includes(finalStatus)) {
      return res.status(400).json({
        message: "Invalid appointment status.",
      });
    }

    /* =====================================================
       VERIFY PATIENT BELONGS TO THIS CLINIC
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
        message: "Selected patient does not exist in your clinic.",
      });
    }

    /* =====================================================
       UPDATE APPOINTMENT
    ===================================================== */

    const { rows } = await pool.query(
      `
      UPDATE appointments

      SET
        patient_id = $1,
        appointment_at = $2,
        reason = $3,
        notes = $4,
        status = $5

      WHERE id = $6
        AND clinic_id = $7

      RETURNING *
      `,
      [
        patient_id,
        appointment_at,
        clean(reason),
        clean(notes),
        finalStatus,
        req.params.id,
        clinicId,
      ]
    );

    if (!rows[0]) {
      return res.status(404).json({
        message: "Appointment not found.",
      });
    }

    res.json({
      message: "Appointment updated successfully.",
      appointment: rows[0],
    });
  })
);

/* =========================================================
   QUICK STATUS CHANGE
========================================================= */

r.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const clinicId = getClinicId(req, res);

    if (!clinicId) {
      return;
    }

    const status = String(req.body.status || "")
      .trim()
      .toLowerCase();

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Please select a valid appointment status.",
      });
    }

    const { rows } = await pool.query(
      `
      UPDATE appointments

      SET status = $1

      WHERE id = $2
        AND clinic_id = $3

      RETURNING *
      `,
      [
        status,
        req.params.id,
        clinicId,
      ]
    );

    if (!rows[0]) {
      return res.status(404).json({
        message: "Appointment not found.",
      });
    }

    res.json({
      message: `Appointment marked as ${status}.`,
      appointment: rows[0],
    });
  })
);

/* =========================================================
   DELETE APPOINTMENT

   Treatment records are NOT deleted.

   If treatment is linked to appointment:
   appointment_id becomes NULL.

   Everything is restricted to logged-in clinic.
========================================================= */

r.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const clinicId = getClinicId(req, res);

    if (!clinicId) {
      return;
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      /* ===================================================
         FIND + LOCK APPOINTMENT
      =================================================== */

      const result = await client.query(
        `
        SELECT
          a.id,
          a.appointment_at,
          p.full_name AS patient_name

        FROM appointments a

        JOIN patients p
          ON p.id = a.patient_id
         AND p.clinic_id = a.clinic_id

        WHERE a.id = $1
          AND a.clinic_id = $2

        FOR UPDATE OF a
        `,
        [
          req.params.id,
          clinicId,
        ]
      );

      const appointment = result.rows[0];

      if (!appointment) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message:
            "Appointment not found. It may already have been deleted.",
        });
      }

      /* ===================================================
         DETACH RELATED TREATMENTS

         Treatment history remains saved.
      =================================================== */

      await client.query(
        `
        UPDATE treatments

        SET appointment_id = NULL

        WHERE appointment_id = $1
          AND clinic_id = $2
        `,
        [
          appointment.id,
          clinicId,
        ]
      );

      /* ===================================================
         DELETE APPOINTMENT
      =================================================== */

      const deleted = await client.query(
        `
        DELETE FROM appointments

        WHERE id = $1
          AND clinic_id = $2

        RETURNING id
        `,
        [
          appointment.id,
          clinicId,
        ]
      );

      if (!deleted.rows[0]) {
        throw new Error(
          "Appointment could not be deleted."
        );
      }

      await client.query("COMMIT");

      res.json({
        message: `${appointment.patient_name}'s appointment deleted successfully.`,
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