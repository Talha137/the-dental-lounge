import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { pool } from "../config/db.js";
import {
  auth,
  requireSuperAdmin,
} from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const r = Router();

/* =========================================================
   SECURITY
========================================================= */

r.use(auth);
r.use(requireSuperAdmin);

/* =========================================================
   HELPERS
========================================================= */

function clean(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const result = String(value).trim();

  return result === "" ? null : result;
}

function normalizeClinicCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "");
}

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

const hexColor = z
  .string()
  .trim()
  .regex(
    /^#[0-9A-Fa-f]{6}$/,
    "Color must be a valid hex color like #0e7f86"
  );

const optionalHexColor = hexColor
  .optional()
  .nullable();

/* =========================================================
   CLINIC VALIDATION
========================================================= */

const clinicSchema = z.object({
  clinic_name: z
    .string()
    .trim()
    .min(2, "Clinic name is required")
    .max(200),

  clinic_code: z
    .string()
    .trim()
    .min(2, "Clinic code is required")
    .max(50),

  owner_name: z
    .string()
    .trim()
    .max(150)
    .optional()
    .nullable(),

  email: z
    .union([
      z.string().trim().email(),
      z.literal(""),
      z.null(),
    ])
    .optional(),

  phone: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable(),

  address: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .nullable(),

  logo_url: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .nullable(),

  primary_color: optionalHexColor,
  secondary_color: optionalHexColor,
  accent_color: optionalHexColor,

  currency: z
    .string()
    .trim()
    .max(10)
    .optional()
    .nullable(),

  timezone: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable(),

  plan: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable(),

  subscription_status: z
    .enum([
      "active",
      "inactive",
      "trial",
      "suspended",
    ])
    .optional(),

  active: z.boolean().optional(),
});

/* =========================================================
   CLINIC CONFIGURATION / THEME STUDIO VALIDATION
========================================================= */

const clinicConfigurationSchema = z.object({
  /* -------------------------
     Clinic identity
  ------------------------- */

  clinic_name: z
    .string()
    .trim()
    .min(2, "Clinic name is required")
    .max(200),

  owner_name: z
    .string()
    .trim()
    .max(150)
    .optional()
    .nullable(),

  email: z
    .union([
      z
        .string()
        .trim()
        .email("Valid clinic email is required"),
      z.literal(""),
      z.null(),
    ])
    .optional(),

  phone: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable(),

  address: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .nullable(),

  website: z
    .string()
    .trim()
    .max(255)
    .optional()
    .nullable(),

  registration_no: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable(),

  logo_url: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .nullable(),

  /* -------------------------
     Main brand colors
  ------------------------- */

  primary_color: optionalHexColor,
  secondary_color: optionalHexColor,
  accent_color: optionalHexColor,

  /* -------------------------
     General text
  ------------------------- */

  text_color: optionalHexColor,
  muted_text_color: optionalHexColor,

  /* -------------------------
     Sidebar
  ------------------------- */

  sidebar_color: optionalHexColor,
  sidebar_active_color: optionalHexColor,

  sidebar_text_color: optionalHexColor,
  sidebar_active_text_color: optionalHexColor,

  /* -------------------------
     Page / cards / tables
  ------------------------- */

  page_background_color: optionalHexColor,
  card_background_color: optionalHexColor,
  table_header_color: optionalHexColor,

  /* -------------------------
     Buttons
  ------------------------- */

  primary_button_color: optionalHexColor,
  secondary_button_color: optionalHexColor,
  danger_button_color: optionalHexColor,

  primary_button_text_color: optionalHexColor,
  secondary_button_text_color: optionalHexColor,
  danger_button_text_color: optionalHexColor,

  /* -------------------------
     Notifications
  ------------------------- */

  success_color: optionalHexColor,
  warning_color: optionalHexColor,
  error_color: optionalHexColor,
  info_color: optionalHexColor,

  success_text_color: optionalHexColor,
  warning_text_color: optionalHexColor,
  error_text_color: optionalHexColor,
  info_text_color: optionalHexColor,

  /* -------------------------
     Billing status
  ------------------------- */

  paid_color: optionalHexColor,
  partial_color: optionalHexColor,
  unpaid_color: optionalHexColor,

  paid_text_color: optionalHexColor,
  partial_text_color: optionalHexColor,
  unpaid_text_color: optionalHexColor,

  /* -------------------------
     Appointment / workflow
  ------------------------- */

  scheduled_color: optionalHexColor,
  confirmed_color: optionalHexColor,
  completed_color: optionalHexColor,
  cancelled_color: optionalHexColor,
  no_show_color: optionalHexColor,

  scheduled_text_color: optionalHexColor,
  confirmed_text_color: optionalHexColor,
  completed_text_color: optionalHexColor,
  cancelled_text_color: optionalHexColor,
  no_show_text_color: optionalHexColor,

  /* -------------------------
     Inputs / modals
  ------------------------- */

  input_focus_color: optionalHexColor,
  modal_accent_color: optionalHexColor,

  /* -------------------------
     Welcome banner
  ------------------------- */

  welcome_gradient_start: optionalHexColor,
  welcome_gradient_end: optionalHexColor,
  welcome_text_color: optionalHexColor,

  /* -------------------------
     Regional settings
  ------------------------- */

  currency: z
    .string()
    .trim()
    .min(2)
    .max(10),

  timezone: z
    .string()
    .trim()
    .min(2)
    .max(100),

  /* -------------------------
     Document settings
  ------------------------- */

  receipt_footer: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .nullable(),

  prescription_footer: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .nullable(),
});

/* =========================================================
   USER VALIDATION
========================================================= */

const userSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Full name is required")
    .max(150),

  email: z
    .string()
    .trim()
    .email("Valid email is required")
    .max(150),

  password: z
    .string()
    .min(
      8,
      "Password must be at least 8 characters"
    )
    .max(200),

  system_role: z
    .enum([
      "clinic_admin",
      "staff",
    ])
    .default("staff"),

  job_role: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable(),

  phone: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable(),

  active: z.boolean().optional(),
});

const userUpdateSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2)
    .max(150)
    .optional(),

  email: z
    .string()
    .trim()
    .email()
    .max(150)
    .optional(),

  password: z
    .string()
    .min(8)
    .max(200)
    .optional(),

  system_role: z
    .enum([
      "clinic_admin",
      "staff",
    ])
    .optional(),

  job_role: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable(),

  phone: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable(),

  active: z.boolean().optional(),
});

/* =========================================================
   END OF PART 1
   PART 2 CONTINUES DIRECTLY BELOW THIS LINE
========================================================= */
/* =========================================================
   ADMIN DASHBOARD SUMMARY
========================================================= */

r.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const [
      clinics,
      activeClinics,
      users,
      patients,
    ] = await Promise.all([
      pool.query(`
        SELECT COUNT(*) AS n
        FROM clinics
      `),

      pool.query(`
        SELECT COUNT(*) AS n
        FROM clinics
        WHERE active = TRUE
      `),

      pool.query(`
        SELECT COUNT(*) AS n
        FROM users
      `),

      pool.query(`
        SELECT COUNT(*) AS n
        FROM patients
      `),
    ]);

    res.json({
      clinics: Number(
        clinics.rows[0]?.n || 0
      ),

      activeClinics: Number(
        activeClinics.rows[0]?.n || 0
      ),

      users: Number(
        users.rows[0]?.n || 0
      ),

      patients: Number(
        patients.rows[0]?.n || 0
      ),
    });
  })
);

/* =========================================================
   GET ALL CLINICS
========================================================= */

r.get(
  "/clinics",
  asyncHandler(async (req, res) => {
    const search = String(
      req.query.search || ""
    ).trim();

    const { rows } = await pool.query(
      `
        SELECT
          c.*,

          (
            SELECT COUNT(*)
            FROM users u
            WHERE u.clinic_id = c.id
          )::int AS users_count,

          (
            SELECT COUNT(*)
            FROM patients p
            WHERE p.clinic_id = c.id
          )::int AS patients_count,

          (
            SELECT COUNT(*)
            FROM appointments a
            WHERE a.clinic_id = c.id
          )::int AS appointments_count

        FROM clinics c

        WHERE (
          $1 = ''

          OR c.clinic_name
            ILIKE '%' || $1 || '%'

          OR c.clinic_code
            ILIKE '%' || $1 || '%'

          OR COALESCE(
            c.owner_name,
            ''
          ) ILIKE '%' || $1 || '%'

          OR COALESCE(
            c.email,
            ''
          ) ILIKE '%' || $1 || '%'

          OR COALESCE(
            c.phone,
            ''
          ) ILIKE '%' || $1 || '%'
        )

        ORDER BY
          c.created_at DESC,
          c.clinic_name ASC
      `,
      [search]
    );

    res.json(rows);
  })
);

/* =========================================================
   GET ONE CLINIC
========================================================= */

r.get(
  "/clinics/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const clinicResult =
      await pool.query(
        `
          SELECT
            c.*,

            (
              SELECT COUNT(*)
              FROM users u
              WHERE u.clinic_id = c.id
            )::int AS users_count,

            (
              SELECT COUNT(*)
              FROM patients p
              WHERE p.clinic_id = c.id
            )::int AS patients_count,

            (
              SELECT COUNT(*)
              FROM appointments a
              WHERE a.clinic_id = c.id
            )::int AS appointments_count,

            (
              SELECT COUNT(*)
              FROM treatments t
              WHERE t.clinic_id = c.id
            )::int AS treatments_count,

            (
              SELECT COUNT(*)
              FROM invoices i
              WHERE i.clinic_id = c.id
            )::int AS invoices_count,

            (
              SELECT
                COALESCE(
                  SUM(py.amount),
                  0
                )
              FROM payments py
              WHERE py.clinic_id = c.id
            ) AS total_revenue

          FROM clinics c

          WHERE c.id = $1

          LIMIT 1
        `,
        [id]
      );

    if (!clinicResult.rows[0]) {
      return res.status(404).json({
        message: "Clinic not found",
      });
    }

    const usersResult =
      await pool.query(
        `
          SELECT
            id,
            full_name,
            email,
            role,
            system_role,
            job_role,
            phone,
            active,
            last_login_at,
            created_at,
            updated_at

          FROM users

          WHERE clinic_id = $1

          ORDER BY
            created_at ASC,
            full_name ASC
        `,
        [id]
      );

    res.json({
      clinic: clinicResult.rows[0],
      users: usersResult.rows,
    });
  })
);

/* =========================================================
   CREATE CLINIC
========================================================= */

r.post(
  "/clinics",
  asyncHandler(async (req, res) => {
    const data =
      clinicSchema.parse(req.body);

    const clinicCode =
      normalizeClinicCode(
        data.clinic_code
      );

    if (!clinicCode) {
      return res.status(400).json({
        message:
          "Valid clinic code is required",
      });
    }

    const duplicate =
      await pool.query(
        `
          SELECT id

          FROM clinics

          WHERE LOWER(clinic_code)
            = LOWER($1)

          LIMIT 1
        `,
        [clinicCode]
      );

    if (duplicate.rows[0]) {
      return res.status(409).json({
        message:
          "This clinic code is already in use.",
      });
    }

    const { rows } =
      await pool.query(
        `
          INSERT INTO clinics (
            clinic_name,
            clinic_code,
            owner_name,
            email,
            phone,
            address,
            logo_url,
            primary_color,
            secondary_color,
            accent_color,
            currency,
            timezone,
            plan,
            subscription_status,
            active
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
            $13,
            $14,
            $15
          )

          RETURNING *
        `,
        [
          data.clinic_name.trim(),

          clinicCode,

          clean(data.owner_name),

          clean(data.email)
            ?.toLowerCase() ||
            null,

          clean(data.phone),

          clean(data.address),

          clean(data.logo_url),

          clean(data.primary_color) ||
            "#0e7f86",

          clean(data.secondary_color) ||
            "#7edbd7",

          clean(data.accent_color) ||
            "#14a3a8",

          clean(data.currency) ||
            "PKR",

          clean(data.timezone) ||
            "Asia/Karachi",

          clean(data.plan) ||
            "standard",

          data.subscription_status ||
            "active",

          data.active ?? true,
        ]
      );

    res.status(201).json({
      message:
        "Clinic created successfully.",

      clinic: rows[0],
    });
  })
);

/* =========================================================
   UPDATE CLINIC
========================================================= */

r.put(
  "/clinics/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const data =
      clinicSchema.parse(req.body);

    const clinicCode =
      normalizeClinicCode(
        data.clinic_code
      );

    if (!clinicCode) {
      return res.status(400).json({
        message:
          "Valid clinic code is required",
      });
    }

    const duplicate =
      await pool.query(
        `
          SELECT id

          FROM clinics

          WHERE LOWER(clinic_code)
            = LOWER($1)

            AND id <> $2

          LIMIT 1
        `,
        [clinicCode, id]
      );

    if (duplicate.rows[0]) {
      return res.status(409).json({
        message:
          "This clinic code is already in use.",
      });
    }

    const { rows } =
      await pool.query(
        `
          UPDATE clinics

          SET
            clinic_name = $1,
            clinic_code = $2,
            owner_name = $3,
            email = $4,
            phone = $5,
            address = $6,
            logo_url = $7,

            primary_color =
              COALESCE(
                $8,
                primary_color
              ),

            secondary_color =
              COALESCE(
                $9,
                secondary_color
              ),

            accent_color =
              COALESCE(
                $10,
                accent_color
              ),

            currency = $11,
            timezone = $12,
            plan = $13,
            subscription_status = $14,
            active = $15,
            updated_at = NOW()

          WHERE id = $16

          RETURNING *
        `,
        [
          data.clinic_name.trim(),

          clinicCode,

          clean(data.owner_name),

          clean(data.email)
            ?.toLowerCase() ||
            null,

          clean(data.phone),

          clean(data.address),

          clean(data.logo_url),

          clean(data.primary_color),

          clean(data.secondary_color),

          clean(data.accent_color),

          clean(data.currency) ||
            "PKR",

          clean(data.timezone) ||
            "Asia/Karachi",

          clean(data.plan) ||
            "standard",

          data.subscription_status ||
            "active",

          data.active ?? true,

          id,
        ]
      );

    if (!rows[0]) {
      return res.status(404).json({
        message: "Clinic not found",
      });
    }

    res.json({
      message:
        "Clinic updated successfully.",

      clinic: rows[0],
    });
  })
);

/* =========================================================
   END OF PART 2
   PART 3 CONTINUES DIRECTLY BELOW THIS LINE
========================================================= */
/* =========================================================
   UPDATE CLINIC CONFIGURATION / THEME STUDIO

   Super Admin only.

   Supports:
   - Identity
   - Logo
   - Main brand colors
   - General text colors
   - Sidebar background + text colors
   - Page/card/table colors
   - Button background + text colors
   - Notification background + text colors
   - Billing status background + text colors
   - Appointment status background + text colors
   - Input/modal colors
   - Welcome gradient + text color
   - Currency/timezone
   - Receipt/prescription footers
========================================================= */

r.put(
  "/clinics/:id/configuration",

  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const data =
      clinicConfigurationSchema.parse(
        req.body
      );

    const existingResult =
      await pool.query(
        `
          SELECT *

          FROM clinics

          WHERE id = $1

          LIMIT 1
        `,
        [id]
      );

    const existing =
      existingResult.rows[0];

    if (!existing) {
      return res.status(404).json({
        message: "Clinic not found",
      });
    }

    /*
     * If frontend does not send a Theme Studio field,
     * keep the clinic's current database value.
     */
    const value = (
      field,
      fallback
    ) => {
      if (
        data[field] === undefined ||
        data[field] === null ||
        data[field] === ""
      ) {
        return (
          existing[field] ??
          fallback
        );
      }

      return data[field];
    };

    const { rows } =
      await pool.query(
        `
          UPDATE clinics

          SET
            clinic_name = $1,
            owner_name = $2,
            email = $3,
            phone = $4,
            address = $5,
            website = $6,
            registration_no = $7,
            logo_url = $8,

            /* Main brand */
            primary_color = $9,
            secondary_color = $10,
            accent_color = $11,

            /* Sidebar backgrounds */
            sidebar_color = $12,
            sidebar_active_color = $13,

            /* Page / cards / tables */
            page_background_color = $14,
            card_background_color = $15,
            table_header_color = $16,

            /* Button backgrounds */
            primary_button_color = $17,
            secondary_button_color = $18,
            danger_button_color = $19,

            /* Notifications backgrounds */
            success_color = $20,
            warning_color = $21,
            error_color = $22,
            info_color = $23,

            /* Billing backgrounds */
            paid_color = $24,
            partial_color = $25,
            unpaid_color = $26,

            /* Appointment backgrounds */
            scheduled_color = $27,
            confirmed_color = $28,
            completed_color = $29,
            cancelled_color = $30,
            no_show_color = $31,

            /* Inputs / modals */
            input_focus_color = $32,
            modal_accent_color = $33,

            /* Welcome gradient */
            welcome_gradient_start = $34,
            welcome_gradient_end = $35,

            /* General text */
            text_color = $36,
            muted_text_color = $37,

            /* Sidebar text */
            sidebar_text_color = $38,
            sidebar_active_text_color = $39,

            /* Button text */
            primary_button_text_color = $40,
            secondary_button_text_color = $41,
            danger_button_text_color = $42,

            /* Notification text */
            success_text_color = $43,
            warning_text_color = $44,
            error_text_color = $45,
            info_text_color = $46,

            /* Billing text */
            paid_text_color = $47,
            partial_text_color = $48,
            unpaid_text_color = $49,

            /* Appointment text */
            scheduled_text_color = $50,
            confirmed_text_color = $51,
            completed_text_color = $52,
            cancelled_text_color = $53,
            no_show_text_color = $54,

            /* Welcome text */
            welcome_text_color = $55,

            /* Regional */
            currency = $56,
            timezone = $57,

            /* Documents */
            receipt_footer = $58,
            prescription_footer = $59,

            updated_at = NOW()

          WHERE id = $60

          RETURNING *
        `,
        [
          /* $1 */
          data.clinic_name.trim(),

          /* $2 */
          clean(data.owner_name),

          /* $3 */
          clean(data.email)
            ?.toLowerCase() ||
            null,

          /* $4 */
          clean(data.phone),

          /* $5 */
          clean(data.address),

          /* $6 */
          clean(data.website),

          /* $7 */
          clean(
            data.registration_no
          ),

          /* $8 */
          clean(data.logo_url),

          /* $9 */
          value(
            "primary_color",
            "#0e7f86"
          ),

          /* $10 */
          value(
            "secondary_color",
            "#7edbd7"
          ),

          /* $11 */
          value(
            "accent_color",
            "#14a3a8"
          ),

          /* $12 */
          value(
            "sidebar_color",
            "#071f25"
          ),

          /* $13 */
          value(
            "sidebar_active_color",
            "#7edbd7"
          ),

          /* $14 */
          value(
            "page_background_color",
            "#f4fafb"
          ),

          /* $15 */
          value(
            "card_background_color",
            "#ffffff"
          ),

          /* $16 */
          value(
            "table_header_color",
            "#f8fafc"
          ),

          /* $17 */
          value(
            "primary_button_color",
            "#0e7f86"
          ),

          /* $18 */
          value(
            "secondary_button_color",
            "#ffffff"
          ),

          /* $19 */
          value(
            "danger_button_color",
            "#dc2626"
          ),

          /* $20 */
          value(
            "success_color",
            "#16a34a"
          ),

          /* $21 */
          value(
            "warning_color",
            "#d97706"
          ),

          /* $22 */
          value(
            "error_color",
            "#dc2626"
          ),

          /* $23 */
          value(
            "info_color",
            "#0284c7"
          ),

          /* $24 */
          value(
            "paid_color",
            "#16a34a"
          ),

          /* $25 */
          value(
            "partial_color",
            "#d97706"
          ),

          /* $26 */
          value(
            "unpaid_color",
            "#dc2626"
          ),

          /* $27 */
          value(
            "scheduled_color",
            "#64748b"
          ),

          /* $28 */
          value(
            "confirmed_color",
            "#0284c7"
          ),

          /* $29 */
          value(
            "completed_color",
            "#16a34a"
          ),

          /* $30 */
          value(
            "cancelled_color",
            "#dc2626"
          ),

          /* $31 */
          value(
            "no_show_color",
            "#7c3aed"
          ),

          /* $32 */
          value(
            "input_focus_color",
            "#14a3a8"
          ),

          /* $33 */
          value(
            "modal_accent_color",
            "#0e7f86"
          ),

          /* $34 */
          value(
            "welcome_gradient_start",
            "#071f25"
          ),

          /* $35 */
          value(
            "welcome_gradient_end",
            "#14a3a8"
          ),

          /* $36 */
          value(
            "text_color",
            "#172033"
          ),

          /* $37 */
          value(
            "muted_text_color",
            "#64748b"
          ),

          /* $38 */
          value(
            "sidebar_text_color",
            "#ffffff"
          ),

          /* $39 */
          value(
            "sidebar_active_text_color",
            "#071f25"
          ),

          /* $40 */
          value(
            "primary_button_text_color",
            "#ffffff"
          ),

          /* $41 */
          value(
            "secondary_button_text_color",
            "#172033"
          ),

          /* $42 */
          value(
            "danger_button_text_color",
            "#ffffff"
          ),

          /* $43 */
          value(
            "success_text_color",
            "#ffffff"
          ),

          /* $44 */
          value(
            "warning_text_color",
            "#ffffff"
          ),

          /* $45 */
          value(
            "error_text_color",
            "#ffffff"
          ),

          /* $46 */
          value(
            "info_text_color",
            "#ffffff"
          ),

          /* $47 */
          value(
            "paid_text_color",
            "#ffffff"
          ),

          /* $48 */
          value(
            "partial_text_color",
            "#ffffff"
          ),

          /* $49 */
          value(
            "unpaid_text_color",
            "#ffffff"
          ),

          /* $50 */
          value(
            "scheduled_text_color",
            "#ffffff"
          ),

          /* $51 */
          value(
            "confirmed_text_color",
            "#ffffff"
          ),

          /* $52 */
          value(
            "completed_text_color",
            "#ffffff"
          ),

          /* $53 */
          value(
            "cancelled_text_color",
            "#ffffff"
          ),

          /* $54 */
          value(
            "no_show_text_color",
            "#ffffff"
          ),

          /* $55 */
          value(
            "welcome_text_color",
            "#ffffff"
          ),

          /* $56 */
          data.currency
            .trim()
            .toUpperCase(),

          /* $57 */
          data.timezone.trim(),

          /* $58 */
          clean(
            data.receipt_footer
          ),

          /* $59 */
          clean(
            data.prescription_footer
          ),

          /* $60 */
          id,
        ]
      );

    res.json({
      message:
        "Clinic configuration and theme saved successfully.",

      clinic: rows[0],
    });
  })
);

/* =========================================================
   END OF PART 3
   PART 4 CONTINUES DIRECTLY BELOW THIS LINE
========================================================= */
/* =========================================================
   ACTIVATE / DEACTIVATE CLINIC
========================================================= */

r.patch(
  "/clinics/:id/status",

  asyncHandler(async (req, res) => {
    const schema = z.object({
      active: z.boolean(),
    });

    const { active } =
      schema.parse(req.body);

    const { rows } =
      await pool.query(
        `
          UPDATE clinics

          SET
            active = $1,
            updated_at = NOW()

          WHERE id = $2

          RETURNING *
        `,
        [
          active,
          req.params.id,
        ]
      );

    if (!rows[0]) {
      return res.status(404).json({
        message: "Clinic not found",
      });
    }

    res.json({
      message: active
        ? "Clinic activated successfully."
        : "Clinic deactivated successfully.",

      clinic: rows[0],
    });
  })
);

/* =========================================================
   GET ALL USERS

   Optional:
   ?clinic_id=<uuid>
   ?search=<text>
========================================================= */

r.get(
  "/users",

  asyncHandler(async (req, res) => {
    const clinicId = String(
      req.query.clinic_id || ""
    ).trim();

    const search = String(
      req.query.search || ""
    ).trim();

    const { rows } =
      await pool.query(
        `
          SELECT
            u.id,
            u.full_name,
            u.email,
            u.role,
            u.system_role,
            u.job_role,
            u.phone,
            u.active,
            u.last_login_at,
            u.created_at,
            u.updated_at,
            u.clinic_id,

            c.clinic_name,
            c.clinic_code

          FROM users u

          LEFT JOIN clinics c
            ON c.id = u.clinic_id

          WHERE (
            $1 = ''
            OR u.clinic_id::text = $1
          )

          AND (
            $2 = ''

            OR u.full_name
              ILIKE '%' || $2 || '%'

            OR u.email
              ILIKE '%' || $2 || '%'

            OR COALESCE(
              u.phone,
              ''
            ) ILIKE '%' || $2 || '%'

            OR COALESCE(
              c.clinic_name,
              ''
            ) ILIKE '%' || $2 || '%'
          )

          ORDER BY
            c.clinic_name ASC NULLS LAST,
            u.full_name ASC
        `,
        [
          clinicId,
          search,
        ]
      );

    res.json(rows);
  })
);

/* =========================================================
   CREATE USER FOR A CLINIC

   Super Admin cannot be created here.
========================================================= */

r.post(
  "/clinics/:clinicId/users",

  asyncHandler(async (req, res) => {
    const { clinicId } =
      req.params;

    const data =
      userSchema.parse(req.body);

    const clinicResult =
      await pool.query(
        `
          SELECT
            id,
            clinic_name,
            active

          FROM clinics

          WHERE id = $1

          LIMIT 1
        `,
        [clinicId]
      );

    const clinic =
      clinicResult.rows[0];

    if (!clinic) {
      return res.status(404).json({
        message: "Clinic not found",
      });
    }

    const email =
      normalizeEmail(data.email);

    const existingUser =
      await pool.query(
        `
          SELECT id

          FROM users

          WHERE LOWER(email)
            = LOWER($1)

          LIMIT 1
        `,
        [email]
      );

    if (existingUser.rows[0]) {
      return res.status(409).json({
        message:
          "A user with this email already exists.",
      });
    }

    const passwordHash =
      await bcrypt.hash(
        data.password,
        12
      );

    const { rows } =
      await pool.query(
        `
          INSERT INTO users (
            full_name,
            email,
            password_hash,
            role,
            active,
            clinic_id,
            system_role,
            job_role,
            phone
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
            $9
          )

          RETURNING
            id,
            full_name,
            email,
            role,
            active,
            clinic_id,
            system_role,
            job_role,
            phone,
            created_at,
            updated_at
        `,
        [
          data.full_name.trim(),

          email,

          passwordHash,

          data.system_role ===
          "clinic_admin"
            ? "admin"
            : "staff",

          data.active ?? true,

          clinicId,

          data.system_role,

          clean(data.job_role),

          clean(data.phone),
        ]
      );

    res.status(201).json({
      message:
        "Clinic user created successfully.",

      user: {
        ...rows[0],

        clinic_name:
          clinic.clinic_name,
      },
    });
  })
);

/* =========================================================
   UPDATE USER
========================================================= */

r.put(
  "/users/:id",

  asyncHandler(async (req, res) => {
    const data =
      userUpdateSchema.parse(
        req.body
      );

    const userResult =
      await pool.query(
        `
          SELECT
            id,
            system_role,
            clinic_id

          FROM users

          WHERE id = $1

          LIMIT 1
        `,
        [req.params.id]
      );

    const existing =
      userResult.rows[0];

    if (!existing) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    /*
     * Permanent Super Admin protection
     */
    if (
      existing.system_role ===
      "super_admin"
    ) {
      return res.status(403).json({
        message:
          "The Super Admin account cannot be modified from this route.",
      });
    }

    let email = null;

    if (
      data.email !== undefined
    ) {
      email =
        normalizeEmail(data.email);

      const duplicate =
        await pool.query(
          `
            SELECT id

            FROM users

            WHERE LOWER(email)
              = LOWER($1)

              AND id <> $2

            LIMIT 1
          `,
          [
            email,
            req.params.id,
          ]
        );

      if (duplicate.rows[0]) {
        return res.status(409).json({
          message:
            "A user with this email already exists.",
        });
      }
    }

    let passwordHash = null;

    if (data.password) {
      passwordHash =
        await bcrypt.hash(
          data.password,
          12
        );
    }

    const newSystemRole =
      data.system_role ||
      existing.system_role;

    const legacyRole =
      newSystemRole ===
      "clinic_admin"
        ? "admin"
        : "staff";

    const { rows } =
      await pool.query(
        `
          UPDATE users

          SET
            full_name =
              COALESCE(
                $1,
                full_name
              ),

            email =
              COALESCE(
                $2,
                email
              ),

            password_hash =
              COALESCE(
                $3,
                password_hash
              ),

            system_role =
              COALESCE(
                $4,
                system_role
              ),

            role = $5,

            job_role =
              CASE
                WHEN $6::boolean = TRUE
                THEN $7
                ELSE job_role
              END,

            phone =
              CASE
                WHEN $8::boolean = TRUE
                THEN $9
                ELSE phone
              END,

            active =
              COALESCE(
                $10,
                active
              ),

            updated_at = NOW()

          WHERE id = $11

          RETURNING
            id,
            full_name,
            email,
            role,
            active,
            clinic_id,
            system_role,
            job_role,
            phone,
            last_login_at,
            created_at,
            updated_at
        `,
        [
          data.full_name ??
            null,

          email,

          passwordHash,

          data.system_role ??
            null,

          legacyRole,

          data.job_role !==
            undefined,

          clean(data.job_role),

          data.phone !==
            undefined,

          clean(data.phone),

          data.active ??
            null,

          req.params.id,
        ]
      );

    res.json({
      message:
        "User updated successfully.",

      user: rows[0],
    });
  })
);

/* =========================================================
   END OF PART 4
   PART 5 CONTINUES DIRECTLY BELOW THIS LINE
========================================================= */
/* =========================================================
   ACTIVATE / DEACTIVATE USER
========================================================= */

r.patch(
  "/users/:id/status",

  asyncHandler(async (req, res) => {
    const schema = z.object({
      active: z.boolean(),
    });

    const { active } =
      schema.parse(req.body);

    const existing =
      await pool.query(
        `
          SELECT
            id,
            system_role

          FROM users

          WHERE id = $1

          LIMIT 1
        `,
        [req.params.id]
      );

    if (!existing.rows[0]) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    /*
     * Permanent Super Admin protection
     */
    if (
      existing.rows[0]
        .system_role ===
      "super_admin"
    ) {
      return res.status(403).json({
        message:
          "The Super Admin account cannot be disabled from this route.",
      });
    }

    const { rows } =
      await pool.query(
        `
          UPDATE users

          SET
            active = $1,
            updated_at = NOW()

          WHERE id = $2

          RETURNING
            id,
            full_name,
            email,
            active,
            system_role,
            job_role,
            clinic_id
        `,
        [
          active,
          req.params.id,
        ]
      );

    res.json({
      message: active
        ? "User activated successfully."
        : "User deactivated successfully.",

      user: rows[0],
    });
  })
);

/* =========================================================
   END
========================================================= */

export default r;