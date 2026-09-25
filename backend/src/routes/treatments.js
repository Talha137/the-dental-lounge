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

function validateTreatment(body) {
  if (!body.patient_id) {
    return "Please select a patient.";
  }

  if (
    !body.procedure ||
    !String(body.procedure).trim()
  ) {
    return "Treatment / procedure is required.";
  }

  if (
    body.patient_age !== undefined &&
    body.patient_age !== null &&
    body.patient_age !== ""
  ) {
    const age = Number(body.patient_age);

    if (
      !Number.isInteger(age) ||
      age < 0 ||
      age > 120
    ) {
      return "Please enter a valid patient age between 0 and 120.";
    }
  }

  if (
    body.fee !== undefined &&
    body.fee !== null &&
    body.fee !== ""
  ) {
    const fee = Number(body.fee);

    if (
      !Number.isFinite(fee) ||
      fee < 0
    ) {
      return "Treatment fee cannot be negative.";
    }
  }

  return null;
}

/* =========================================================
   GET ALL TREATMENTS

   SECURITY:
   Only treatments belonging to logged-in clinic.
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
        t.*,

        p.full_name AS patient_name,
        p.patient_code,
        p.phone AS patient_phone,
        p.gender AS patient_gender,
        p.date_of_birth AS patient_date_of_birth,
        p.allergies,
        p.medical_history,

        COALESCE(
          NULLIF(t.doctor_name_manual, ''),
          u.full_name
        ) AS doctor_name

      FROM treatments t

      JOIN patients p
        ON p.id = t.patient_id
       AND p.clinic_id = t.clinic_id

      LEFT JOIN users u
        ON u.id = t.doctor_id
       AND u.clinic_id = t.clinic_id

      WHERE t.clinic_id = $1

      ORDER BY
        t.treatment_date DESC,
        t.created_at DESC

      LIMIT 500
      `,
      [clinicId]
    );

    res.json(rows);
  })
);

/* =========================================================
   GET SINGLE TREATMENT

   SECURITY:
   Treatment must belong to logged-in clinic.
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
        t.*,

        p.full_name AS patient_name,
        p.patient_code,
        p.phone AS patient_phone,
        p.gender AS patient_gender,
        p.date_of_birth AS patient_date_of_birth,
        p.address AS patient_address,
        p.allergies,
        p.medical_history,

        COALESCE(
          NULLIF(t.doctor_name_manual, ''),
          u.full_name
        ) AS doctor_name

      FROM treatments t

      JOIN patients p
        ON p.id = t.patient_id
       AND p.clinic_id = t.clinic_id

      LEFT JOIN users u
        ON u.id = t.doctor_id
       AND u.clinic_id = t.clinic_id

      WHERE t.id = $1
        AND t.clinic_id = $2

      LIMIT 1
      `,
      [
        req.params.id,
        clinicId,
      ]
    );

    if (!rows[0]) {
      return res.status(404).json({
        message: "Treatment record not found.",
      });
    }

    res.json(rows[0]);
  })
);

/* =========================================================
   CREATE TREATMENT

   SECURITY:
   - clinic_id comes from authenticated JWT
   - patient must belong to same clinic
   - optional appointment must belong to same clinic
   - optional appointment must belong to selected patient
========================================================= */

r.post(
  "/",
  asyncHandler(async (req, res) => {
    const clinicId = getClinicId(req, res);

    if (!clinicId) {
      return;
    }

    const error = validateTreatment(req.body);

    if (error) {
      return res.status(400).json({
        message: error,
      });
    }

    const x = req.body;

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
        x.patient_id,
        clinicId,
      ]
    );

    if (!patientResult.rows[0]) {
      return res.status(404).json({
        message:
          "Selected patient does not exist in your clinic.",
      });
    }

    /* =====================================================
       VERIFY OPTIONAL APPOINTMENT
    ===================================================== */

    if (x.appointment_id) {
      const appointmentResult =
        await pool.query(
          `
          SELECT id

          FROM appointments

          WHERE id = $1
            AND patient_id = $2
            AND clinic_id = $3

          LIMIT 1
          `,
          [
            x.appointment_id,
            x.patient_id,
            clinicId,
          ]
        );

      if (!appointmentResult.rows[0]) {
        return res.status(400).json({
          message:
            "Selected appointment does not belong to this patient or clinic.",
        });
      }
    }

    /* =====================================================
       NORMALIZE VALUES
    ===================================================== */

    const patientAge =
      x.patient_age === "" ||
      x.patient_age === undefined ||
      x.patient_age === null
        ? null
        : Number(x.patient_age);

    const fee =
      x.fee === "" ||
      x.fee === undefined ||
      x.fee === null
        ? 0
        : Number(x.fee);

    /* =====================================================
       CREATE TREATMENT
    ===================================================== */

    const { rows } = await pool.query(
      `
      INSERT INTO treatments (
        clinic_id,
        patient_id,
        doctor_id,
        appointment_id,
        treatment_date,
        patient_age,
        doctor_name_manual,
        tooth_no,
        diagnosis,
        procedure,
        prescription,
        clinical_notes,
        fee
      )

      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13
      )

      RETURNING *
      `,
      [
        clinicId,
        x.patient_id,

        /*
         * Logged-in user remains stored internally
         * as the creator/doctor reference.
         *
         * Manual doctor name remains available separately.
         */
        req.user.id,

        x.appointment_id || null,

        x.treatment_date || new Date(),

        patientAge,

        clean(
          x.doctor_name ||
          x.doctor_name_manual
        ),

        clean(x.tooth_no),

        clean(x.diagnosis),

        String(x.procedure).trim(),

        clean(x.prescription),

        clean(x.clinical_notes),

        fee,
      ]
    );

    res.status(201).json({
      message:
        "Treatment record saved successfully.",

      treatment: rows[0],
    });
  })
);

/* =========================================================
   UPDATE TREATMENT

   SECURITY:
   - treatment must belong to logged-in clinic
   - patient must belong to same clinic
   - appointment must belong to same patient + clinic
========================================================= */

r.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const clinicId = getClinicId(req, res);

    if (!clinicId) {
      return;
    }

    const error = validateTreatment(req.body);

    if (error) {
      return res.status(400).json({
        message: error,
      });
    }

    const x = req.body;

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
        x.patient_id,
        clinicId,
      ]
    );

    if (!patientResult.rows[0]) {
      return res.status(404).json({
        message:
          "Selected patient does not exist in your clinic.",
      });
    }

    /* =====================================================
       VERIFY OPTIONAL APPOINTMENT
    ===================================================== */

    if (x.appointment_id) {
      const appointmentResult =
        await pool.query(
          `
          SELECT id

          FROM appointments

          WHERE id = $1
            AND patient_id = $2
            AND clinic_id = $3

          LIMIT 1
          `,
          [
            x.appointment_id,
            x.patient_id,
            clinicId,
          ]
        );

      if (!appointmentResult.rows[0]) {
        return res.status(400).json({
          message:
            "Selected appointment does not belong to this patient or clinic.",
        });
      }
    }

    /* =====================================================
       NORMALIZE VALUES
    ===================================================== */

    const patientAge =
      x.patient_age === "" ||
      x.patient_age === undefined ||
      x.patient_age === null
        ? null
        : Number(x.patient_age);

    const fee =
      x.fee === "" ||
      x.fee === undefined ||
      x.fee === null
        ? 0
        : Number(x.fee);

    /* =====================================================
       UPDATE TREATMENT
    ===================================================== */

    const { rows } = await pool.query(
      `
      UPDATE treatments

      SET
        patient_id = $1,
        appointment_id = $2,
        treatment_date = $3,
        patient_age = $4,
        doctor_name_manual = $5,
        tooth_no = $6,
        diagnosis = $7,
        procedure = $8,
        prescription = $9,
        clinical_notes = $10,
        fee = $11

      WHERE id = $12
        AND clinic_id = $13

      RETURNING *
      `,
      [
        x.patient_id,

        x.appointment_id || null,

        x.treatment_date || new Date(),

        patientAge,

        clean(
          x.doctor_name ||
          x.doctor_name_manual
        ),

        clean(x.tooth_no),

        clean(x.diagnosis),

        String(x.procedure).trim(),

        clean(x.prescription),

        clean(x.clinical_notes),

        fee,

        req.params.id,

        clinicId,
      ]
    );

    if (!rows[0]) {
      return res.status(404).json({
        message: "Treatment record not found.",
      });
    }

    res.json({
      message:
        "Treatment record updated successfully.",

      treatment: rows[0],
    });
  })
);

/* =========================================================
   DELETE TREATMENT

   IMPORTANT:
   - Patient remains untouched.
   - Invoice remains untouched.
   - Invoice is only detached from treatment.
   - Legacy prescription rows for treatment are removed.
   - Everything is clinic scoped.
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
         FIND + LOCK TREATMENT
      =================================================== */

      const result = await client.query(
        `
        SELECT
          t.id,
          t.procedure,
          t.patient_id,
          p.full_name AS patient_name

        FROM treatments t

        JOIN patients p
          ON p.id = t.patient_id
         AND p.clinic_id = t.clinic_id

        WHERE t.id = $1
          AND t.clinic_id = $2

        FOR UPDATE OF t
        `,
        [
          req.params.id,
          clinicId,
        ]
      );

      const treatment = result.rows[0];

      if (!treatment) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message:
            "Treatment record not found. It may already have been deleted.",
        });
      }

      /* ===================================================
         DETACH INVOICES

         Invoice itself remains preserved.
      =================================================== */

      await client.query(
        `
        UPDATE invoices

        SET treatment_id = NULL

        WHERE treatment_id = $1
          AND clinic_id = $2
        `,
        [
          treatment.id,
          clinicId,
        ]
      );

      /* ===================================================
         REMOVE LEGACY PRESCRIPTIONS

         prescriptions currently does not have clinic_id,
         therefore ownership is established through the
         already clinic-verified treatment.
      =================================================== */

      await client.query(
        `
        DELETE FROM prescriptions

        WHERE treatment_id = $1
      `,
        [treatment.id]
      );

      /* ===================================================
         DELETE TREATMENT
      =================================================== */

      const deleted = await client.query(
        `
        DELETE FROM treatments

        WHERE id = $1
          AND clinic_id = $2

        RETURNING id
        `,
        [
          treatment.id,
          clinicId,
        ]
      );

      if (!deleted.rows[0]) {
        throw new Error(
          "Treatment record could not be deleted."
        );
      }

      await client.query("COMMIT");

      res.json({
        message: `${treatment.patient_name}'s treatment record deleted successfully.`,
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