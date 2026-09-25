import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { pool } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { auth } from "../middleware/auth.js";

const r = Router();

/* =========================================================
   HELPERS
========================================================= */

/*
 * Convert the joined database row into the exact clinic
 * object used by the frontend.
 *
 * IMPORTANT:
 * We keep real database field names such as:
 * clinic_name
 * clinic_code
 *
 * This prevents the frontend from falling back to
 * "The Dental Lounge".
 */
function buildClinic(u) {
  if (!u?.clinic_id) {
    return null;
  }

  return {
    id: u.clinic_id,

    /* Clinic identity */
    clinic_name: u.clinic_name,
    clinic_code: u.clinic_code,
    owner_name: u.owner_name,
    email: u.clinic_email,
    phone: u.clinic_phone,
    address: u.clinic_address,
    website: u.website,
    registration_no: u.registration_no,

    /* Logo */
    logo_url: u.logo_url,

    /* =====================================================
       MAIN BRANDING
    ===================================================== */

    primary_color:
      u.primary_color || "#0e7f86",

    secondary_color:
      u.secondary_color || "#7edbd7",

    accent_color:
      u.accent_color || "#14a3a8",

    /* =====================================================
       GENERAL TEXT
    ===================================================== */

    text_color:
      u.text_color || "#172033",

    muted_text_color:
      u.muted_text_color || "#64748b",

    /* =====================================================
       SIDEBAR
    ===================================================== */

    sidebar_color:
      u.sidebar_color || "#071f25",

    sidebar_active_color:
      u.sidebar_active_color || "#7edbd7",

    sidebar_text_color:
      u.sidebar_text_color || "#ffffff",

    sidebar_active_text_color:
      u.sidebar_active_text_color || "#071f25",

    /* =====================================================
       PAGE / SURFACES
    ===================================================== */

    page_background_color:
      u.page_background_color || "#f4fafb",

    card_background_color:
      u.card_background_color || "#ffffff",

    table_header_color:
      u.table_header_color || "#f8fafc",

    /* =====================================================
       BUTTONS
    ===================================================== */

    primary_button_color:
      u.primary_button_color || "#0e7f86",

    secondary_button_color:
      u.secondary_button_color || "#ffffff",

    danger_button_color:
      u.danger_button_color || "#dc2626",

    primary_button_text_color:
      u.primary_button_text_color || "#ffffff",

    secondary_button_text_color:
      u.secondary_button_text_color || "#172033",

    danger_button_text_color:
      u.danger_button_text_color || "#ffffff",

    /* =====================================================
       ALERTS / NOTIFICATIONS
    ===================================================== */

    success_color:
      u.success_color || "#16a34a",

    warning_color:
      u.warning_color || "#d97706",

    error_color:
      u.error_color || "#dc2626",

    info_color:
      u.info_color || "#0284c7",

    success_text_color:
      u.success_text_color || "#ffffff",

    warning_text_color:
      u.warning_text_color || "#ffffff",

    error_text_color:
      u.error_text_color || "#ffffff",

    info_text_color:
      u.info_text_color || "#ffffff",

    /* =====================================================
       BILLING STATUSES
    ===================================================== */

    paid_color:
      u.paid_color || "#16a34a",

    partial_color:
      u.partial_color || "#d97706",

    unpaid_color:
      u.unpaid_color || "#dc2626",

    paid_text_color:
      u.paid_text_color || "#ffffff",

    partial_text_color:
      u.partial_text_color || "#ffffff",

    unpaid_text_color:
      u.unpaid_text_color || "#ffffff",

    /* =====================================================
       APPOINTMENT STATUSES
    ===================================================== */

    scheduled_color:
      u.scheduled_color || "#64748b",

    confirmed_color:
      u.confirmed_color || "#0284c7",

    completed_color:
      u.completed_color || "#16a34a",

    cancelled_color:
      u.cancelled_color || "#dc2626",

    no_show_color:
      u.no_show_color || "#7c3aed",

    scheduled_text_color:
      u.scheduled_text_color || "#ffffff",

    confirmed_text_color:
      u.confirmed_text_color || "#ffffff",

    completed_text_color:
      u.completed_text_color || "#ffffff",

    cancelled_text_color:
      u.cancelled_text_color || "#ffffff",

    no_show_text_color:
      u.no_show_text_color || "#ffffff",

    /* =====================================================
       FORMS / MODALS
    ===================================================== */

    input_focus_color:
      u.input_focus_color || "#14a3a8",

    modal_accent_color:
      u.modal_accent_color || "#0e7f86",

    /* =====================================================
       WELCOME BANNER
    ===================================================== */

    welcome_gradient_start:
      u.welcome_gradient_start || "#071f25",

    welcome_gradient_end:
      u.welcome_gradient_end || "#14a3a8",

    welcome_text_color:
      u.welcome_text_color || "#ffffff",

    /* =====================================================
       REGIONAL
    ===================================================== */

    currency:
      u.currency || "PKR",

    timezone:
      u.timezone || "Asia/Karachi",

    /* =====================================================
       PRINTING
    ===================================================== */

    receipt_footer:
      u.receipt_footer,

    prescription_footer:
      u.prescription_footer,

    /* =====================================================
       SUBSCRIPTION
    ===================================================== */

    plan:
      u.plan,

    subscription_status:
      u.subscription_status,

    active:
      u.clinic_active,
  };
}

/* =========================================================
   COMMON USER + CLINIC SELECT

   Used by both login and /me so both endpoints always
   return exactly the same clinic branding information.
========================================================= */

const USER_CLINIC_SELECT = `
  SELECT
    u.id,
    u.full_name,
    u.email,
    u.password_hash,
    u.role,
    u.system_role,
    u.job_role,
    u.clinic_id,
    u.active,
    u.last_login_at,

    c.clinic_name,
    c.clinic_code,

    c.owner_name,

    c.email AS clinic_email,
    c.phone AS clinic_phone,
    c.address AS clinic_address,

    c.website,
    c.registration_no,

    c.logo_url,

    /* Main branding */
    c.primary_color,
    c.secondary_color,
    c.accent_color,

    /* General text */
    c.text_color,
    c.muted_text_color,

    /* Sidebar */
    c.sidebar_color,
    c.sidebar_active_color,
    c.sidebar_text_color,
    c.sidebar_active_text_color,

    /* Page / surfaces */
    c.page_background_color,
    c.card_background_color,
    c.table_header_color,

    /* Buttons */
    c.primary_button_color,
    c.secondary_button_color,
    c.danger_button_color,
    c.primary_button_text_color,
    c.secondary_button_text_color,
    c.danger_button_text_color,

    /* Alerts / notifications */
    c.success_color,
    c.warning_color,
    c.error_color,
    c.info_color,
    c.success_text_color,
    c.warning_text_color,
    c.error_text_color,
    c.info_text_color,

    /* Billing statuses */
    c.paid_color,
    c.partial_color,
    c.unpaid_color,
    c.paid_text_color,
    c.partial_text_color,
    c.unpaid_text_color,

    /* Appointment statuses */
    c.scheduled_color,
    c.confirmed_color,
    c.completed_color,
    c.cancelled_color,
    c.no_show_color,
    c.scheduled_text_color,
    c.confirmed_text_color,
    c.completed_text_color,
    c.cancelled_text_color,
    c.no_show_text_color,

    /* Forms / modal */
    c.input_focus_color,
    c.modal_accent_color,

    /* Welcome banner */
    c.welcome_gradient_start,
    c.welcome_gradient_end,
    c.welcome_text_color,

    /* Regional */
    c.currency,
    c.timezone,

    /* Printing */
    c.receipt_footer,
    c.prescription_footer,

    /* Subscription */
    c.plan,
    c.subscription_status,

    c.active AS clinic_active

  FROM users u

  LEFT JOIN clinics c
    ON c.id = u.clinic_id
`;

/* =========================================================
   LOGIN
========================================================= */

r.post(
  "/login",

  asyncHandler(async (req, res) => {
    const p = z
      .object({
        email: z
          .string()
          .trim()
          .email(),

        password: z
          .string()
          .min(8),
      })
      .parse(req.body);

    const { rows } =
      await pool.query(
        `
          ${USER_CLINIC_SELECT}

          WHERE LOWER(u.email) = LOWER($1)

            AND u.active = TRUE

          LIMIT 1
        `,
        [p.email.trim()]
      );

    const u = rows[0];

    /* =====================================================
       CHECK USER + PASSWORD
    ===================================================== */

    if (
      !u ||
      !(await bcrypt.compare(
        p.password,
        u.password_hash
      ))
    ) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    /* =====================================================
       CHECK CLINIC

       Every normal clinic user must:
       - belong to a clinic
       - have an active clinic
       - have an active subscription

       Super Admin remains allowed according to the
       existing SaaS architecture.
    ===================================================== */

    if (
      u.system_role !== "super_admin"
    ) {
      if (!u.clinic_id) {
        return res.status(403).json({
          message:
            "No clinic is assigned to this account",
        });
      }

      if (!u.clinic_active) {
        return res.status(403).json({
          message:
            "Your clinic account is inactive",
        });
      }

      if (
        u.subscription_status &&
        u.subscription_status !==
          "active"
      ) {
        return res.status(403).json({
          message:
            "Clinic subscription is not active",
        });
      }
    }

    /* =====================================================
       UPDATE LAST LOGIN
    ===================================================== */

    await pool.query(
      `
        UPDATE users

        SET
          last_login_at = NOW(),
          updated_at = NOW()

        WHERE id = $1
      `,
      [u.id]
    );

    /* =====================================================
       JWT
    ===================================================== */

    const token = jwt.sign(
      {
        id: u.id,

        name: u.full_name,

        email: u.email,

        /*
         * Legacy role retained because some existing
         * frontend/backend code may still use it.
         */
        role: u.role,

        /*
         * SaaS permissions.
         */
        system_role:
          u.system_role,

        job_role:
          u.job_role,

        /*
         * Tenant ID comes only from database/JWT.
         * Frontend cannot choose another clinic.
         */
        clinic_id:
          u.clinic_id,
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "8h",
      }
    );

    const clinic =
      buildClinic(u);

    /* =====================================================
       LOGIN RESPONSE

       Clinic is nested inside user.

       We also return top-level clinic for compatibility
       with any existing frontend code that still reads
       data.clinic.
    ===================================================== */

    res.json({
      token,

      user: {
        id: u.id,

        name: u.full_name,

        full_name:
          u.full_name,

        email: u.email,

        role: u.role,

        system_role:
          u.system_role,

        job_role:
          u.job_role,

        clinic_id:
          u.clinic_id,

        clinic,
      },

      clinic,
    });
  })
);

/* =========================================================
   CURRENT LOGGED-IN USER
========================================================= */

r.get(
  "/me",

  auth,

  asyncHandler(async (req, res) => {
    const { rows } =
      await pool.query(
        `
          ${USER_CLINIC_SELECT}

          WHERE u.id = $1

            AND u.active = TRUE

          LIMIT 1
        `,
        [req.user.id]
      );

    const u = rows[0];

    if (!u) {
      return res.status(401).json({
        message:
          "User not found or inactive",
      });
    }

    /* =====================================================
       RECHECK CLINIC STATUS

       This means a clinic that is disabled by Super Admin
       cannot continue using an old session indefinitely.
    ===================================================== */

    if (
      u.system_role !== "super_admin"
    ) {
      if (!u.clinic_id) {
        return res.status(403).json({
          message:
            "No clinic is assigned to this account",
        });
      }

      if (!u.clinic_active) {
        return res.status(403).json({
          message:
            "Your clinic account is inactive",
        });
      }

      if (
        u.subscription_status &&
        u.subscription_status !==
          "active"
      ) {
        return res.status(403).json({
          message:
            "Clinic subscription is not active",
        });
      }
    }

    const clinic =
      buildClinic(u);

    /*
     * Keep /me compatible with both response styles:
     *
     * data.name
     * data.clinic
     *
     * AND
     *
     * data.user.name
     * data.user.clinic
     */
    const user = {
      id: u.id,

      name: u.full_name,

      full_name:
        u.full_name,

      email: u.email,

      role: u.role,

      system_role:
        u.system_role,

      job_role:
        u.job_role,

      clinic_id:
        u.clinic_id,

      last_login_at:
        u.last_login_at,

      clinic,
    };

    res.json({
      ...user,

      user,

      clinic,
    });
  })
);
/* =========================================================
   CHANGE PASSWORD
========================================================= */

r.put(
  "/change-password",

  auth,

  asyncHandler(async (req, res) => {
    const p = z
      .object({
        current_password: z
          .string()
          .min(8, "Current password is required"),

        new_password: z
          .string()
          .min(8, "New password must be at least 8 characters"),

        confirm_password: z
          .string()
          .min(8, "Confirm password is required"),
      })
      .refine(
        (data) =>
          data.new_password === data.confirm_password,
        {
          message: "New passwords do not match",
          path: ["confirm_password"],
        }
      )
      .refine(
        (data) =>
          data.current_password !== data.new_password,
        {
          message:
            "New password must be different from current password",
          path: ["new_password"],
        }
      )
      .parse(req.body);

    const { rows } = await pool.query(
      `
        SELECT
          id,
          password_hash,
          active
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [req.user.id]
    );

    const user = rows[0];

    if (!user || !user.active) {
      return res.status(401).json({
        message: "User not found or inactive",
      });
    }

    const currentPasswordCorrect =
      await bcrypt.compare(
        p.current_password,
        user.password_hash
      );

    if (!currentPasswordCorrect) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    const newPasswordHash =
      await bcrypt.hash(
        p.new_password,
        12
      );

    await pool.query(
      `
        UPDATE users
        SET
          password_hash = $1,
          updated_at = NOW()
        WHERE id = $2
      `,
      [
        newPasswordHash,
        req.user.id,
      ]
    );

    return res.json({
      message: "Password changed successfully",
    });
  })
);

export default r;
