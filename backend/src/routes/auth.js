import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { z } from "zod";

import { pool } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { auth } from "../middleware/auth.js";

const r = Router();

/* =========================================================
   HELPERS
========================================================= */

function buildClinic(u) {
  if (!u?.clinic_id) {
    return null;
  }

  return {
    id: u.clinic_id,

    clinic_name: u.clinic_name,
    clinic_code: u.clinic_code,
    owner_name: u.owner_name,
    email: u.clinic_email,
    phone: u.clinic_phone,
    address: u.clinic_address,
    website: u.website,
    registration_no: u.registration_no,

    logo_url: u.logo_url,

    primary_color:
      u.primary_color || "#0e7f86",

    secondary_color:
      u.secondary_color || "#7edbd7",

    accent_color:
      u.accent_color || "#14a3a8",

    text_color:
      u.text_color || "#172033",

    muted_text_color:
      u.muted_text_color || "#64748b",

    sidebar_color:
      u.sidebar_color || "#071f25",

    sidebar_active_color:
      u.sidebar_active_color || "#7edbd7",

    sidebar_text_color:
      u.sidebar_text_color || "#ffffff",

    sidebar_active_text_color:
      u.sidebar_active_text_color || "#071f25",

    page_background_color:
      u.page_background_color || "#f4fafb",

    card_background_color:
      u.card_background_color || "#ffffff",

    table_header_color:
      u.table_header_color || "#f8fafc",

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

    input_focus_color:
      u.input_focus_color || "#14a3a8",

    modal_accent_color:
      u.modal_accent_color || "#0e7f86",

    welcome_gradient_start:
      u.welcome_gradient_start || "#071f25",

    welcome_gradient_end:
      u.welcome_gradient_end || "#14a3a8",

    welcome_text_color:
      u.welcome_text_color || "#ffffff",

    currency:
      u.currency || "PKR",

    timezone:
      u.timezone || "Asia/Karachi",

    receipt_footer:
      u.receipt_footer,

    prescription_footer:
      u.prescription_footer,

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

    u.recovery_email,
    u.recovery_email_verified_at,

    c.clinic_name,
    c.clinic_code,

    c.owner_name,

    c.email AS clinic_email,
    c.phone AS clinic_phone,
    c.address AS clinic_address,

    c.website,
    c.registration_no,

    c.logo_url,

    c.primary_color,
    c.secondary_color,
    c.accent_color,

    c.text_color,
    c.muted_text_color,

    c.sidebar_color,
    c.sidebar_active_color,
    c.sidebar_text_color,
    c.sidebar_active_text_color,

    c.page_background_color,
    c.card_background_color,
    c.table_header_color,

    c.primary_button_color,
    c.secondary_button_color,
    c.danger_button_color,

    c.primary_button_text_color,
    c.secondary_button_text_color,
    c.danger_button_text_color,

    c.success_color,
    c.warning_color,
    c.error_color,
    c.info_color,

    c.success_text_color,
    c.warning_text_color,
    c.error_text_color,
    c.info_text_color,

    c.paid_color,
    c.partial_color,
    c.unpaid_color,

    c.paid_text_color,
    c.partial_text_color,
    c.unpaid_text_color,

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

    c.input_focus_color,
    c.modal_accent_color,

    c.welcome_gradient_start,
    c.welcome_gradient_end,
    c.welcome_text_color,

    c.currency,
    c.timezone,

    c.receipt_footer,
    c.prescription_footer,

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

    const token = jwt.sign(
      {
        id: u.id,

        name: u.full_name,

        email: u.email,

        role: u.role,

        system_role:
          u.system_role,

        job_role:
          u.job_role,

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

        recovery_email:
          u.recovery_email,

        recovery_email_verified_at:
          u.recovery_email_verified_at,

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

      recovery_email:
        u.recovery_email,

      recovery_email_verified_at:
        u.recovery_email_verified_at,

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
   SECURITY EMAIL + PASSWORD HELPERS
========================================================= */

const TOKEN_MINUTES = 15;

function getAppUrl() {
  return (
    process.env.APP_URL ||
    process.env.FRONTEND_URL ||
    "http://localhost:5173"
  ).replace(/\/+$/, "");
}

function createTokenPair() {
  const raw =
    crypto
      .randomBytes(32)
      .toString("hex");

  const hash =
    crypto
      .createHash("sha256")
      .update(raw)
      .digest("hex");

  return {
    raw,
    hash,
  };
}

function hashToken(raw) {
  return crypto
    .createHash("sha256")
    .update(raw)
    .digest("hex");
}

async function getSecurityUser(id) {
  const { rows } =
    await pool.query(
      `
        SELECT
          id,
          full_name,
          email,
          password_hash,
          clinic_id,
          active,
          recovery_email,
          recovery_email_verified_at

        FROM users

        WHERE id = $1

        LIMIT 1
      `,
      [id]
    );

  return rows[0];
}

/* =========================================================
   RESEND EMAIL
========================================================= */

async function sendMail(
  to,
  subject,
  html
) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error(
      "RESEND_API_KEY is not configured"
    );
  }

  const response =
    await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${process.env.RESEND_API_KEY}`,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          from:
            process.env.EMAIL_FROM ||
            "The Dental Lounge <onboarding@resend.dev>",

          to: [to],

          subject,

          html,
        }),
      }
    );

  if (!response.ok) {
    const errorBody =
      await response.text();

    console.error(
      "Resend email error:",
      errorBody
    );

    throw new Error(
      "Verification email could not be sent"
    );
  }
}

function verificationEmail(
  title,
  message,
  buttonText,
  url
) {
  return `
    <div
      style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: auto;
        padding: 24px;
        color: #172033;
      "
    >
      <h2 style="color:#0e7f86;">
        ${title}
      </h2>

      <p>
        ${message}
      </p>

      <p style="margin:28px 0;">
        <a
          href="${url}"
          style="
            background:#0e7f86;
            color:#ffffff;
            padding:12px 20px;
            border-radius:8px;
            text-decoration:none;
            display:inline-block;
          "
        >
          ${buttonText}
        </a>
      </p>

      <p>
        This is a one-time confirmation link.
        It expires in ${TOKEN_MINUTES} minutes.
      </p>

      <p>
        If you did not request this action,
        ignore this email.
      </p>

      <p>
        The Dental Lounge
      </p>
    </div>
  `;
}

/* =========================================================
   SECURITY EMAIL STATUS
========================================================= */

r.get(
  "/security-email",

  auth,

  asyncHandler(async (req, res) => {
    const user =
      await getSecurityUser(
        req.user.id
      );

    if (
      !user ||
      !user.active
    ) {
      return res
        .status(401)
        .json({
          message:
            "User not found or inactive",
        });
    }

    return res.json({
      recovery_email:
        user.recovery_email || null,

      verified:
        Boolean(
          user.recovery_email &&
          user.recovery_email_verified_at
        ),

      recovery_email_verified_at:
        user.recovery_email_verified_at ||
        null,
    });
  })
);

/* =========================================================
   FIRST TIME SECURITY EMAIL
========================================================= */

r.post(
  "/security-email/request-add",

  auth,

  asyncHandler(async (req, res) => {
    const p = z
      .object({
        email: z
          .string()
          .trim()
          .email(),
      })
      .parse(req.body);

    const user =
      await getSecurityUser(
        req.user.id
      );

    if (
      !user ||
      !user.active
    ) {
      return res
        .status(401)
        .json({
          message:
            "User not found or inactive",
        });
    }

    /*
     * If an already verified security email
     * exists, user cannot simply overwrite it.
     *
     * Old email must approve removal first.
     */
    if (
      user.recovery_email &&
      user.recovery_email_verified_at
    ) {
      return res
        .status(400)
        .json({
          message:
            "Security email is already verified. Verify removal before adding a new email.",
        });
    }

    const token =
      createTokenPair();

    /*
     * Remove previous unused add-email requests.
     */
    await pool.query(
      `
        DELETE FROM security_email_requests

        WHERE user_id = $1

          AND action = 'add_email'

          AND confirmed_at IS NULL
      `,
      [user.id]
    );

    /*
     * Only the SHA-256 token hash is stored.
     * Raw token only exists in the email link.
     */
    await pool.query(
      `
        INSERT INTO security_email_requests
        (
          user_id,
          action,
          new_email,
          token_hash,
          expires_at
        )

        VALUES
        (
          $1,
          'add_email',
          $2,
          $3,
          NOW() + INTERVAL '15 minutes'
        )
      `,
      [
        user.id,
        p.email.toLowerCase(),
        token.hash,
      ]
    );

    const url =
      `${getAppUrl()}` +
      `/api/auth/security-email/confirm-add` +
      `?token=${encodeURIComponent(token.raw)}`;

    await sendMail(
      p.email.toLowerCase(),

      "Verify your security email",

      verificationEmail(
        "Verify Security Email",

        "Confirm this email address to protect password changes on your account.",

        "Verify Security Email",

        url
      )
    );

    return res.json({
      message:
        "Verification email sent. Confirm it to activate your security email.",
    });
  })
);

/* =========================================================
   CONFIRM FIRST TIME / NEW SECURITY EMAIL
========================================================= */

r.get(
  "/security-email/confirm-add",

  asyncHandler(async (req, res) => {
    const rawToken = z
      .string()
      .min(20)
      .parse(req.query.token);

    const tokenHash =
      hashToken(rawToken);

    const client =
      await pool.connect();

    try {
      await client.query(
        "BEGIN"
      );

      const { rows } =
        await client.query(
          `
            SELECT
              id,
              user_id,
              new_email

            FROM security_email_requests

            WHERE token_hash = $1

              AND action = 'add_email'

              AND confirmed_at IS NULL

              AND expires_at > NOW()

            FOR UPDATE
          `,
          [tokenHash]
        );

      const request =
        rows[0];

      if (!request) {
        await client.query(
          "ROLLBACK"
        );

        return res
          .status(400)
          .send(
            "This verification link is invalid or expired."
          );
      }

      const updated =
        await client.query(
          `
            UPDATE users

            SET
              recovery_email = $1,

              recovery_email_verified_at =
                NOW(),

              updated_at = NOW()

            WHERE id = $2

              AND active = TRUE

            RETURNING id
          `,
          [
            request.new_email
              .toLowerCase(),

            request.user_id,
          ]
        );

      if (!updated.rows[0]) {
        await client.query(
          "ROLLBACK"
        );

        return res
          .status(400)
          .send(
            "This user account is no longer active."
          );
      }

      await client.query(
        `
          UPDATE security_email_requests

          SET
            confirmed_at = NOW()

          WHERE id = $1
        `,
        [request.id]
      );

      await client.query(
        "COMMIT"
      );

      return res.send(
        "Security email verified successfully. You can close this page and return to The Dental Lounge."
      );
    } catch (error) {
      await client.query(
        "ROLLBACK"
      );

      throw error;
    } finally {
      client.release();
    }
  })
);

/* =========================================================
   REQUEST SECURITY EMAIL REMOVAL / CHANGE

   IMPORTANT:
   Confirmation goes to CURRENT verified email first.
========================================================= */

r.post(
  "/security-email/request-removal",

  auth,

  asyncHandler(async (req, res) => {
    const user =
      await getSecurityUser(
        req.user.id
      );

    if (
      !user ||
      !user.active
    ) {
      return res
        .status(401)
        .json({
          message:
            "User not found or inactive",
        });
    }

    if (
      !user.recovery_email ||
      !user.recovery_email_verified_at
    ) {
      return res
        .status(400)
        .json({
          message:
            "No verified security email is set",
        });
    }

    const token =
      createTokenPair();

    /*
     * Delete any previous unused removal request.
     */
    await pool.query(
      `
        DELETE FROM security_email_requests

        WHERE user_id = $1

          AND action = 'remove_email'

          AND confirmed_at IS NULL
      `,
      [user.id]
    );

    await pool.query(
      `
        INSERT INTO security_email_requests
        (
          user_id,
          action,
          token_hash,
          expires_at
        )

        VALUES
        (
          $1,
          'remove_email',
          $2,
          NOW() + INTERVAL '15 minutes'
        )
      `,
      [
        user.id,
        token.hash,
      ]
    );

    const url =
      `${getAppUrl()}` +
      `/api/auth/security-email/confirm-removal` +
      `?token=${encodeURIComponent(token.raw)}`;

    await sendMail(
      user.recovery_email,

      "Confirm security email removal",

      verificationEmail(
        "Security Email Change",

        "A request was made to remove or change your security email. Confirm only if this was you.",

        "Confirm Removal",

        url
      )
    );

    return res.json({
      message:
        "Confirmation sent to your current security email.",
    });
  })
);

/* =========================================================
   CONFIRM SECURITY EMAIL REMOVAL
========================================================= */

r.get(
  "/security-email/confirm-removal",

  asyncHandler(async (req, res) => {
    const rawToken = z
      .string()
      .min(20)
      .parse(req.query.token);

    const tokenHash =
      hashToken(rawToken);

    const client =
      await pool.connect();

    try {
      await client.query(
        "BEGIN"
      );

      const { rows } =
        await client.query(
          `
            SELECT
              id,
              user_id

            FROM security_email_requests

            WHERE token_hash = $1

              AND action =
                'remove_email'

              AND confirmed_at
                IS NULL

              AND expires_at > NOW()

            FOR UPDATE
          `,
          [tokenHash]
        );

      const request =
        rows[0];

      if (!request) {
        await client.query(
          "ROLLBACK"
        );

        return res
          .status(400)
          .send(
            "This confirmation link is invalid or expired."
          );
      }

      const updated =
        await client.query(
          `
            UPDATE users

            SET
              recovery_email = NULL,

              recovery_email_verified_at =
                NULL,

              updated_at = NOW()

            WHERE id = $1

              AND active = TRUE

            RETURNING id
          `,
          [request.user_id]
        );

      if (!updated.rows[0]) {
        await client.query(
          "ROLLBACK"
        );

        return res
          .status(400)
          .send(
            "This user account is no longer active."
          );
      }

      await client.query(
        `
          UPDATE security_email_requests

          SET
            confirmed_at = NOW()

          WHERE id = $1
        `,
        [request.id]
      );

      await client.query(
        "COMMIT"
      );

      return res.send(
        "Security email removal confirmed. Return to The Dental Lounge and add your new security email."
      );
    } catch (error) {
      await client.query(
        "ROLLBACK"
      );

      throw error;
    } finally {
      client.release();
    }
  })
);

/* =========================================================
   REQUEST PASSWORD CHANGE

   NO CURRENT PASSWORD REQUIRED.

   New password is bcrypt hashed and remains pending.
   Current password remains active until email confirmation.
========================================================= */

r.put(
  "/change-password",

  auth,

  asyncHandler(async (req, res) => {
    const p = z
      .object({
        new_password: z
          .string()
          .min(
            8,
            "New password must be at least 8 characters"
          ),

        confirm_password: z
          .string()
          .min(
            8,
            "Confirm password is required"
          ),
      })
      .refine(
        (data) =>
          data.new_password ===
          data.confirm_password,

        {
          message:
            "New passwords do not match",

          path: [
            "confirm_password",
          ],
        }
      )
      .parse(req.body);

    const user =
      await getSecurityUser(
        req.user.id
      );

    if (
      !user ||
      !user.active
    ) {
      return res
        .status(401)
        .json({
          message:
            "User not found or inactive",
        });
    }

    /*
     * Password change cannot proceed until
     * security email is verified.
     */
    if (
      !user.recovery_email ||
      !user.recovery_email_verified_at
    ) {
      return res
        .status(400)
        .json({
          code:
            "SECURITY_EMAIL_REQUIRED",

          message:
            "Add and verify a security email before changing your password.",
        });
    }

    /*
     * New password cannot equal current password.
     * User does NOT need to enter current password.
     */
    const samePassword =
      await bcrypt.compare(
        p.new_password,
        user.password_hash
      );

    if (samePassword) {
      return res
        .status(400)
        .json({
          message:
            "New password must be different from your current password",
        });
    }

    /*
     * Hash pending new password immediately.
     * Plain password is never stored.
     */
    const newPasswordHash =
      await bcrypt.hash(
        p.new_password,
        12
      );

    const token =
      createTokenPair();

    /*
     * Reject previous pending password-change
     * requests for this user.
     */
    await pool.query(
      `
        UPDATE password_change_requests

        SET
          rejected_at = NOW()

        WHERE user_id = $1

          AND confirmed_at IS NULL

          AND rejected_at IS NULL
      `,
      [user.id]
    );

    /*
     * Store only:
     * - bcrypt password hash
     * - SHA-256 confirmation token hash
     */
    await pool.query(
      `
        INSERT INTO password_change_requests
        (
          user_id,
          clinic_id,
          new_password_hash,
          token_hash,
          expires_at
        )

        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          NOW() + INTERVAL '15 minutes'
        )
      `,
      [
        user.id,
        user.clinic_id,
        newPasswordHash,
        token.hash,
      ]
    );

    const url =
      `${getAppUrl()}` +
      `/api/auth/confirm-password-change` +
      `?token=${encodeURIComponent(token.raw)}`;

    await sendMail(
      user.recovery_email,

      "Confirm your password change",

      verificationEmail(
        "Confirm Password Change",

        "A new password was requested for your account. Your existing password remains active until you confirm this request.",

        "Confirm Password Change",

        url
      )
    );

    return res.json({
      message:
        "Confirmation email sent. Your current password remains active until you confirm the change.",
    });
  })
);

/* =========================================================
   CONFIRM PASSWORD CHANGE
========================================================= */

r.get(
  "/confirm-password-change",

  asyncHandler(async (req, res) => {
    const rawToken = z
      .string()
      .min(20)
      .parse(req.query.token);

    const tokenHash =
      hashToken(rawToken);

    const client =
      await pool.connect();

    try {
      await client.query(
        "BEGIN"
      );

      const { rows } =
        await client.query(
          `
            SELECT
              id,
              user_id,
              new_password_hash

            FROM password_change_requests

            WHERE token_hash = $1

              AND confirmed_at
                IS NULL

              AND rejected_at
                IS NULL

              AND expires_at > NOW()

            FOR UPDATE
          `,
          [tokenHash]
        );

      const request =
        rows[0];

      if (!request) {
        await client.query(
          "ROLLBACK"
        );

        return res
          .status(400)
          .send(
            "This password confirmation link is invalid or expired."
          );
      }

      /*
       * Password is updated ONLY here,
       * after email confirmation.
       */
      const updated =
        await client.query(
          `
            UPDATE users

            SET
              password_hash = $1,

              updated_at = NOW()

            WHERE id = $2

              AND active = TRUE

            RETURNING id
          `,
          [
            request.new_password_hash,
            request.user_id,
          ]
        );

      if (!updated.rows[0]) {
        await client.query(
          "ROLLBACK"
        );

        return res
          .status(400)
          .send(
            "This user account is no longer active."
          );
      }

      /*
       * Mark this request used.
       */
      await client.query(
        `
          UPDATE password_change_requests

          SET
            confirmed_at = NOW()

          WHERE id = $1
        `,
        [request.id]
      );

      /*
       * Reject any other pending password
       * change request for the same user.
       */
      await client.query(
        `
          UPDATE password_change_requests

          SET
            rejected_at = NOW()

          WHERE user_id = $1

            AND id <> $2

            AND confirmed_at IS NULL

            AND rejected_at IS NULL
        `,
        [
          request.user_id,
          request.id,
        ]
      );

      await client.query(
        "COMMIT"
      );

      return res.send(
        "Password changed successfully. You can close this page and sign in with your new password."
      );
    } catch (error) {
      await client.query(
        "ROLLBACK"
      );

      throw error;
    } finally {
      client.release();
    }
  })
);

export default r;