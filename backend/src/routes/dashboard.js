import { Router } from "express";
import { pool } from "../config/db.js";
import { auth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const r = Router();

r.use(auth);

/* =========================================================
   HELPER
========================================================= */

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
   DASHBOARD SUMMARY

   SECURITY:
   Every value is restricted to logged-in clinic.

   CARDS:
   - Total Patients
   - Today's Appointments
   - Total Revenue
   - Outstanding Balance
========================================================= */

r.get(
  "/",
  asyncHandler(async (req, res) => {
    const clinicId = getClinicId(req, res);

    if (!clinicId) {
      return;
    }

    const [
      patientsResult,
      appointmentsResult,
      revenueResult,
      outstandingResult,
    ] = await Promise.all([
      /* ===================================================
         TOTAL PATIENTS
      =================================================== */

      pool.query(
        `
        SELECT
          COUNT(*) AS n

        FROM patients

        WHERE clinic_id = $1
        `,
        [clinicId]
      ),

      /* ===================================================
         TODAY'S APPOINTMENTS

         Uses appointment_at and Pakistan timezone.
         Cancelled appointments are not counted.
      =================================================== */

      pool.query(
        `
        SELECT
          COUNT(*) AS n

        FROM appointments

        WHERE clinic_id = $1

          AND (
            appointment_at
            AT TIME ZONE 'Asia/Karachi'
          )::date =
          (
            NOW()
            AT TIME ZONE 'Asia/Karachi'
          )::date

          AND LOWER(
            COALESCE(status, 'scheduled')
          ) <> 'cancelled'
        `,
        [clinicId]
      ),

      /* ===================================================
         TOTAL REVENUE

         All-time money actually received.

         IMPORTANT:
         This uses PAYMENTS, not invoice totals.
         Therefore unpaid invoices are not counted
         as revenue.
      =================================================== */

      pool.query(
        `
        SELECT
          COALESCE(
            SUM(amount),
            0
          ) AS n

        FROM payments

        WHERE clinic_id = $1
        `,
        [clinicId]
      ),

      /* ===================================================
         OUTSTANDING BALANCE

         Formula:
         Invoice Total
         - Discount
         - Payments Received

         Cancelled invoices are excluded.
      =================================================== */

      pool.query(
        `
        SELECT
          COALESCE(
            SUM(
              GREATEST(
                i.total
                - COALESCE(i.discount, 0)
                - COALESCE(p.paid, 0),
                0
              )
            ),
            0
          ) AS n

        FROM invoices i

        LEFT JOIN (
          SELECT
            invoice_id,
            clinic_id,
            SUM(amount) AS paid

          FROM payments

          WHERE clinic_id = $1

          GROUP BY
            invoice_id,
            clinic_id
        ) p
          ON p.invoice_id = i.id
         AND p.clinic_id = i.clinic_id

        WHERE i.clinic_id = $1

          AND LOWER(
            COALESCE(i.status, 'unpaid')
          ) <> 'cancelled'
        `,
        [clinicId]
      ),
    ]);

    /* =====================================================
       CONVERT DATABASE VALUES TO NUMBERS
    ===================================================== */

    const patients =
      Number(patientsResult.rows[0]?.n || 0);

    const todayAppointments =
      Number(appointmentsResult.rows[0]?.n || 0);

    const totalRevenue =
      Number(revenueResult.rows[0]?.n || 0);

    const outstanding =
      Number(outstandingResult.rows[0]?.n || 0);

    /* =====================================================
       RESPONSE

       "todayRevenue" is also returned for compatibility
       with the existing frontend.

       This now represents TOTAL REVENUE.
    ===================================================== */

    res.json({
      patients,
      todayAppointments,

      todayRevenue: totalRevenue,

      totalRevenue,

      outstanding,
    });
  })
);

export default r;