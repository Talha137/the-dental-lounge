import { Router } from "express";
import { z } from "zod";

import { pool } from "../config/db.js";
import { auth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const r = Router();

r.use(auth);


/* =========================================================
   VALIDATION
========================================================= */

const patientSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Patient name must contain at least 2 characters.")
    .max(200, "Patient name is too long."),

  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .nullable(),

  cnic: z
    .string()
    .trim()
    .max(30)
    .optional()
    .nullable(),

  gender: z
    .string()
    .trim()
    .max(20)
    .optional()
    .nullable(),

  date_of_birth: z
    .string()
    .optional()
    .nullable(),

  address: z
    .string()
    .trim()
    .optional()
    .nullable(),

  medical_history: z
    .string()
    .trim()
    .optional()
    .nullable(),

  allergies: z
    .string()
    .trim()
    .optional()
    .nullable(),

  notes: z
    .string()
    .trim()
    .optional()
    .nullable(),
});


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


/*
 * Every clinic-level operation requires a clinic.
 *
 * Even super_admin uses the clinic_id inside the JWT while
 * working inside The Dental Lounge.
 *
 * Later, when we build the Super Admin Clinics screen,
 * cross-clinic access will use separate admin-only routes.
 */
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
   GET PATIENTS / SEARCH / PAGINATION

   SECURITY:
   Only patients belonging to logged-in clinic are returned.

   Query params:
   - q: search name / phone / patient code / CNIC
   - page: 1-based page number
   - limit: records per page (max 100)
   - sort: created_at | full_name | patient_code
   - order: asc | desc

   RESPONSE:
   - Backward compatible:
     Without pagination params, returns the legacy array response.
   - Paginated:
     When page/limit/sort/order is supplied, returns:
     { data, pagination }
========================================================= */

r.get(
  "/",
  asyncHandler(async (req, res) => {
    const clinicId = getClinicId(req, res);

    if (!clinicId) {
      return;
    }

    const search = String(req.query.q || "").trim();

    const hasPaginationParams =
      req.query.page !== undefined ||
      req.query.limit !== undefined ||
      req.query.sort !== undefined ||
      req.query.order !== undefined;

    const parsedPage = Number.parseInt(String(req.query.page || "1"), 10);
    const parsedLimit = Number.parseInt(String(req.query.limit || "25"), 10);

    const page =
      Number.isFinite(parsedPage) && parsedPage > 0
        ? parsedPage
        : 1;

    const limit =
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 100)
        : 25;

    const offset = (page - 1) * limit;

    const allowedSorts = {
      created_at: "p.created_at",
      full_name: "p.full_name",
      patient_code: "p.patient_code",
    };

    const requestedSort = String(
      req.query.sort || "created_at"
    ).toLowerCase();

    const sortColumn =
      allowedSorts[requestedSort] ||
      allowedSorts.created_at;

    const order =
      String(req.query.order || "desc").toLowerCase() === "asc"
        ? "ASC"
        : "DESC";

    const values = [clinicId];

    let searchSql = "";

    if (search) {
      values.push(`%${search}%`);

      searchSql = `
        AND (
          COALESCE(p.full_name, '') ILIKE $2
          OR COALESCE(p.phone, '') ILIKE $2
          OR COALESCE(p.patient_code, '') ILIKE $2
          OR COALESCE(p.cnic, '') ILIKE $2
        )
      `;
    }

    const countResult = await pool.query(
      `
        SELECT COUNT(*)::int AS total

        FROM patients p

        WHERE p.clinic_id = $1
        ${searchSql}
      `,
      values
    );

    const total = Number(countResult.rows[0]?.total || 0);
    const totalPages =
      total === 0 ? 0 : Math.ceil(total / limit);

    const dataValues = [...values];

    dataValues.push(limit);
    const limitParam = `$${dataValues.length}`;

    dataValues.push(offset);
    const offsetParam = `$${dataValues.length}`;

    const { rows } = await pool.query(
      `
        SELECT
          p.*,

          CASE
            WHEN p.date_of_birth IS NULL
              THEN NULL

            ELSE
              DATE_PART(
                'year',
                AGE(
                  CURRENT_DATE,
                  p.date_of_birth
                )
              )::int
          END AS calculated_age

        FROM patients p

        WHERE p.clinic_id = $1
        ${searchSql}

        ORDER BY
          ${sortColumn} ${order} NULLS LAST,
          p.id DESC

        LIMIT ${limitParam}
        OFFSET ${offsetParam}
      `,
      dataValues
    );

    /*
     * Compatibility mode:
     *
     * Existing frontend currently expects GET /patients
     * to return an array. Keep that behavior until the
     * frontend Patients page is migrated to pagination.
     *
     * Search without page/limit also remains compatible,
     * but is capped to 100 records for browser safety.
     */
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
      sort: requestedSort in allowedSorts
        ? requestedSort
        : "created_at",
      order: order.toLowerCase(),
    });
  })
);


/* =========================================================
   SINGLE PATIENT + SUMMARY

   SECURITY:
   Patient must belong to logged-in clinic.
========================================================= */

r.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const clinicId = getClinicId(req, res);

    if (!clinicId) {
      return;
    }

    const patientResult = await pool.query(
      `
        SELECT
          p.*,

          CASE
            WHEN p.date_of_birth IS NULL
              THEN NULL

            ELSE
              DATE_PART(
                'year',
                AGE(
                  CURRENT_DATE,
                  p.date_of_birth
                )
              )::int
          END AS calculated_age

        FROM patients p

        WHERE
          p.id = $1
          AND p.clinic_id = $2

        LIMIT 1
      `,
      [
        req.params.id,
        clinicId,
      ]
    );

    const patient = patientResult.rows[0];

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found.",
      });
    }


    /*
     * Counts are also clinic-scoped.
     *
     * This prevents another clinic's records from ever
     * appearing in the patient's summary.
     */

    const [
      appointments,
      treatments,
      invoices,
    ] = await Promise.all([
      pool.query(
        `
          SELECT COUNT(*) AS count

          FROM appointments

          WHERE patient_id = $1
            AND clinic_id = $2
        `,
        [
          patient.id,
          clinicId,
        ]
      ),

      pool.query(
        `
          SELECT COUNT(*) AS count

          FROM treatments

          WHERE patient_id = $1
            AND clinic_id = $2
        `,
        [
          patient.id,
          clinicId,
        ]
      ),

      pool.query(
        `
          SELECT COUNT(*) AS count

          FROM invoices

          WHERE patient_id = $1
            AND clinic_id = $2
        `,
        [
          patient.id,
          clinicId,
        ]
      ),
    ]);


    res.json({
      ...patient,

      summary: {
        appointments: Number(
          appointments.rows[0].count
        ),

        treatments: Number(
          treatments.rows[0].count
        ),

        invoices: Number(
          invoices.rows[0].count
        ),
      },
    });
  })
);


/* =========================================================
   CREATE PATIENT

   IMPORTANT:
   clinic_id is NEVER accepted from frontend.

   It always comes from logged-in JWT.
========================================================= */

r.post(
  "/",
  asyncHandler(async (req, res) => {
    const clinicId = getClinicId(req, res);

    if (!clinicId) {
      return;
    }

    const parsed = patientSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message:
          parsed.error.issues[0]?.message ||
          "Please check patient information.",
      });
    }

    const p = parsed.data;


    /*
     * Patient code:
     *
     * TDL-XXXXXXXX
     *
     * For now we retain your existing patient-code format.
     * Later clinic-specific prefixes can come from clinics.
     */

    let patientCode;

    let exists = true;

    while (exists) {
      patientCode =
        "TDL-" +
        Math.floor(
          10000000 +
          Math.random() * 90000000
        );

      const check = await pool.query(
        `
          SELECT id

          FROM patients

          WHERE patient_code = $1

          LIMIT 1
        `,
        [patientCode]
      );

      exists = check.rows.length > 0;
    }


    const { rows } = await pool.query(
      `
        INSERT INTO patients (
          clinic_id,
          patient_code,
          full_name,
          phone,
          cnic,
          gender,
          date_of_birth,
          address,
          medical_history,
          allergies,
          notes
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
          $11
        )

        RETURNING *
      `,
      [
        clinicId,
        patientCode,
        p.full_name.trim(),
        clean(p.phone),
        clean(p.cnic),
        clean(p.gender),
        clean(p.date_of_birth),
        clean(p.address),
        clean(p.medical_history),
        clean(p.allergies),
        clean(p.notes),
      ]
    );


    res.status(201).json({
      message:
        "Patient registered successfully.",

      patient: rows[0],
    });
  })
);


/* =========================================================
   UPDATE PATIENT

   SECURITY:
   Both ID and clinic_id must match.
========================================================= */

r.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const clinicId = getClinicId(req, res);

    if (!clinicId) {
      return;
    }

    const parsed = patientSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message:
          parsed.error.issues[0]?.message ||
          "Please check patient information.",
      });
    }

    const p = parsed.data;


    const { rows } = await pool.query(
      `
        UPDATE patients

        SET
          full_name = $1,
          phone = $2,
          cnic = $3,
          gender = $4,
          date_of_birth = $5,
          address = $6,
          medical_history = $7,
          allergies = $8,
          notes = $9,
          updated_at = NOW()

        WHERE id = $10
          AND clinic_id = $11

        RETURNING *
      `,
      [
        p.full_name.trim(),
        clean(p.phone),
        clean(p.cnic),
        clean(p.gender),
        clean(p.date_of_birth),
        clean(p.address),
        clean(p.medical_history),
        clean(p.allergies),
        clean(p.notes),
        req.params.id,
        clinicId,
      ]
    );


    if (!rows[0]) {
      return res.status(404).json({
        message: "Patient not found.",
      });
    }


    res.json({
      message:
        "Patient information updated successfully.",

      patient: rows[0],
    });
  })
);


/* =========================================================
   DELETE PATIENT

   IMPORTANT:
   This is permanent deletion.

   SECURITY:
   Patient MUST belong to logged-in clinic.

   Order:
   payments
   prescriptions
   invoices
   treatments
   appointments
   patient

   Everything happens inside ONE transaction.
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


      /*
       * Lock only a patient belonging
       * to the logged-in clinic.
       */

      const patientResult = await client.query(
        `
          SELECT
            id,
            full_name,
            patient_code

          FROM patients

          WHERE id = $1
            AND clinic_id = $2

          FOR UPDATE
        `,
        [
          req.params.id,
          clinicId,
        ]
      );


      const patient = patientResult.rows[0];


      if (!patient) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message:
            "Patient not found. It may already have been deleted.",
        });
      }


      /* =====================================================
         PAYMENTS
      ===================================================== */

      await client.query(
        `
          DELETE FROM payments

          WHERE patient_id = $1
            AND clinic_id = $2
        `,
        [
          patient.id,
          clinicId,
        ]
      );


      /* =====================================================
         PRESCRIPTIONS

         Prescriptions table is legacy and currently does not
         have clinic_id, therefore ownership is established
         through the already verified patient/treatment.
      ===================================================== */

      await client.query(
        `
          DELETE FROM prescriptions

          WHERE patient_id = $1

             OR treatment_id IN (
               SELECT id

               FROM treatments

               WHERE patient_id = $1
                 AND clinic_id = $2
             )
        `,
        [
          patient.id,
          clinicId,
        ]
      );


      /* =====================================================
         INVOICES
      ===================================================== */

      await client.query(
        `
          DELETE FROM invoices

          WHERE patient_id = $1
            AND clinic_id = $2
        `,
        [
          patient.id,
          clinicId,
        ]
      );


      /* =====================================================
         TREATMENTS
      ===================================================== */

      await client.query(
        `
          DELETE FROM treatments

          WHERE patient_id = $1
            AND clinic_id = $2
        `,
        [
          patient.id,
          clinicId,
        ]
      );


      /* =====================================================
         APPOINTMENTS
      ===================================================== */

      await client.query(
        `
          DELETE FROM appointments

          WHERE patient_id = $1
            AND clinic_id = $2
        `,
        [
          patient.id,
          clinicId,
        ]
      );


      /* =====================================================
         PATIENT
      ===================================================== */

      const deletedPatient = await client.query(
        `
          DELETE FROM patients

          WHERE id = $1
            AND clinic_id = $2

          RETURNING id
        `,
        [
          patient.id,
          clinicId,
        ]
      );


      /*
       * Defensive check.
       * The patient was locked above, so normally this
       * should always return exactly one row.
       */

      if (!deletedPatient.rows[0]) {
        throw new Error(
          "Patient could not be deleted."
        );
      }


      await client.query("COMMIT");


      res.json({
        message:
          `${patient.full_name} (${patient.patient_code}) permanently deleted successfully.`,
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