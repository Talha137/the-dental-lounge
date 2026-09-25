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
   GET ALL APPOINTMENTS

   Only appointments belonging to logged-in clinic.
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

      ORDER BY
        a.appointment_at DESC

      LIMIT 500
      `,
      [clinicId]
    );

    res.json(rows);
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