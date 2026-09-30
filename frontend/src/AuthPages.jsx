import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowLeft,
  Mail,
  LockKeyhole,
} from "lucide-react";

import api from "./services/api";

/* =========================================================
   HELPERS
========================================================= */

function getError(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong"
  );
}

function AuthNotice({ type = "error", children }) {
  if (!children) return null;

  return (
    <div className={`auth-page-notice ${type}`}>
      {type === "success" ? (
        <CheckCircle2 size={19} />
      ) : (
        <AlertCircle size={19} />
      )}

      <span>{children}</span>
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete = "new-password",
  required = true,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="auth-password-wrap">
      <input
        type={visible ? "text" : "password"}
        value={value}
        minLength={8}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={onChange}
        required={required}
      />

      <button
        type="button"
        className="auth-password-eye"
        onClick={() => setVisible((old) => !old)}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

/* =========================================================
   SHARED AUTH PAGE
========================================================= */

function PublicAuthPage({
  icon: Icon,
  title,
  description,
  children,
}) {
  return (
    <div className="public-auth-page">
      <style>{`
        html,
        body,
        #root {
          width: 100%;
          min-height: 100%;
          margin: 0;
        }

        body {
          overflow: auto;
        }

        .public-auth-page {
          min-height: 100dvh;
          width: 100%;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px 18px;
          background:
            radial-gradient(
              circle at top right,
              rgba(20, 163, 168, 0.18),
              transparent 34%
            ),
            linear-gradient(
              135deg,
              #071f25 0%,
              #0b3940 48%,
              #0e7f86 100%
            );
          font-family: inherit;
        }

        .public-auth-card {
          width: min(100%, 470px);
          background: #ffffff;
          border-radius: 22px;
          padding: 30px;
          box-sizing: border-box;
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.28);
        }

        .public-auth-logo {
          width: 58px;
          height: 58px;
          margin: 0 auto 18px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0e7f86;
          color: #ffffff;
          box-shadow:
            0 12px 30px rgba(14, 127, 134, 0.28);
        }

        .public-auth-card h1 {
          margin: 0;
          color: #172033;
          text-align: center;
          font-size: 26px;
          line-height: 1.25;
        }

        .public-auth-description {
          margin: 9px auto 24px;
          color: #64748b;
          text-align: center;
          font-size: 14px;
          line-height: 1.6;
        }

        .public-auth-form {
          display: grid;
          gap: 15px;
        }

        .public-auth-field {
          display: grid;
          gap: 7px;
        }

        .public-auth-field label {
          color: #334155;
          font-size: 13px;
          font-weight: 700;
        }

        .public-auth-field input {
          width: 100%;
          height: 46px;
          padding: 0 13px;
          box-sizing: border-box;
          border: 1px solid #cbd5e1;
          border-radius: 11px;
          outline: none;
          background: #ffffff;
          color: #172033;
          font: inherit;
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
        }

        .public-auth-field input:focus {
          border-color: #14a3a8;
          box-shadow:
            0 0 0 3px rgba(20, 163, 168, 0.14);
        }

        .auth-password-wrap {
          position: relative;
        }

        .auth-password-wrap input {
          padding-right: 48px;
        }

        .auth-password-eye {
          position: absolute;
          top: 50%;
          right: 8px;
          width: 36px;
          height: 36px;
          padding: 0;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #64748b;
          cursor: pointer;
        }

        .auth-password-eye:hover {
          background: #f1f5f9;
          color: #0e7f86;
        }

        .public-auth-submit {
          width: 100%;
          min-height: 46px;
          border: 0;
          border-radius: 11px;
          padding: 11px 16px;
          background: #0e7f86;
          color: #ffffff;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
          transition:
            transform 0.15s ease,
            opacity 0.15s ease;
        }

        .public-auth-submit:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .public-auth-submit:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        .public-auth-back {
          width: 100%;
          min-height: 42px;
          margin-top: 12px;
          padding: 8px 12px;
          border: 0;
          border-radius: 10px;
          background: transparent;
          color: #0e7f86;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        .public-auth-back:hover {
          background: #f0fdfa;
        }

        .auth-page-notice {
          margin-bottom: 18px;
          padding: 12px 13px;
          border-radius: 11px;
          display: flex;
          align-items: flex-start;
          gap: 9px;
          font-size: 13px;
          line-height: 1.5;
        }

        .auth-page-notice svg {
          flex: 0 0 auto;
          margin-top: 1px;
        }

        .auth-page-notice.error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
        }

        .auth-page-notice.success {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        }

        .auth-security-note {
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.6;
          text-align: center;
        }

        @media (max-width: 520px) {
          .public-auth-page {
            align-items: flex-start;
            padding: 18px 12px;
          }

          .public-auth-card {
            margin: auto 0;
            padding: 24px 18px;
            border-radius: 18px;
          }

          .public-auth-card h1 {
            font-size: 23px;
          }
        }
      `}</style>

      <div className="public-auth-card">
        <div className="public-auth-logo">
          <Icon size={27} />
        </div>

        <h1>{title}</h1>

        <div className="public-auth-description">
          {description}
        </div>

        {children}
      </div>
    </div>
  );
}

/* =========================================================
   FORGOT PASSWORD PAGE
========================================================= */

export function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  async function submit(e) {
    e.preventDefault();

    setNotice(null);
    setBusy(true);

    try {
      const { data } = await api.post(
        "/auth/forgot-password",
        {
          email: email.trim(),
        }
      );

      setNotice({
        type: "success",
        message:
          data?.message ||
          "If an eligible account exists, a reset email has been sent to its verified security email.",
      });

      setEmail("");
    } catch (error) {
      setNotice({
        type: "error",
        message: getError(error),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublicAuthPage
      icon={Mail}
      title="Forgot Password"
      description="Enter your login email. A secure reset link will be sent to the verified Security Email linked with your account."
    >
      <AuthNotice type={notice?.type}>
        {notice?.message}
      </AuthNotice>

      <form
        className="public-auth-form"
        onSubmit={submit}
      >
        <div className="public-auth-field">
          <label>Login Email</label>

          <input
            type="email"
            value={email}
            autoComplete="username"
            placeholder="Enter your login email"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="public-auth-submit"
          disabled={busy}
        >
          {busy
            ? "Sending secure link..."
            : "Send Reset Link"}
        </button>
      </form>

      <button
        type="button"
        className="public-auth-back"
        onClick={() => navigate("/login")}
      >
        <ArrowLeft size={17} />
        Back to Login
      </button>

      <div className="auth-security-note">
        For security, the system does not reveal whether an
        account or recovery email exists. Reset links are
        one-time and expire automatically.
      </div>
    </PublicAuthPage>
  );
}

/* =========================================================
   RESET PASSWORD PAGE
========================================================= */

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";

  const [form, setForm] = useState({
    new_password: "",
    confirm_password: "",
  });

  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!token) {
      setNotice({
        type: "error",
        message:
          "Password reset link is missing or invalid. Request a new reset link.",
      });
    }
  }, [token]);

  async function submit(e) {
    e.preventDefault();

    setNotice(null);

    if (!token) {
      setNotice({
        type: "error",
        message:
          "Password reset link is missing. Request a new reset link.",
      });

      return;
    }

    if (form.new_password.length < 8) {
      setNotice({
        type: "error",
        message:
          "New password must be at least 8 characters.",
      });

      return;
    }

    if (
      form.new_password !== form.confirm_password
    ) {
      setNotice({
        type: "error",
        message:
          "New passwords do not match.",
      });

      return;
    }

    setBusy(true);

    try {
      const { data } = await api.post(
        "/auth/reset-password",
        {
          token,
          new_password: form.new_password,
          confirm_password: form.confirm_password,
        }
      );

      setForm({
        new_password: "",
        confirm_password: "",
      });

      setComplete(true);

      setNotice({
        type: "success",
        message:
          data?.message ||
          "Password reset successfully. You can now sign in with your new password.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        message: getError(error),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublicAuthPage
      icon={LockKeyhole}
      title="Create New Password"
      description={
        complete
          ? "Your password reset request has been completed."
          : "Your email reset link has opened the secure password reset page. Enter and confirm your new password."
      }
    >
      <AuthNotice type={notice?.type}>
        {notice?.message}
      </AuthNotice>

      {!complete && token && (
        <form
          className="public-auth-form"
          onSubmit={submit}
        >
          <div className="public-auth-field">
            <label>New Password</label>

            <PasswordInput
              value={form.new_password}
              placeholder="Minimum 8 characters"
              onChange={(e) =>
                setForm((old) => ({
                  ...old,
                  new_password: e.target.value,
                }))
              }
            />
          </div>

          <div className="public-auth-field">
            <label>Confirm New Password</label>

            <PasswordInput
              value={form.confirm_password}
              placeholder="Enter new password again"
              onChange={(e) =>
                setForm((old) => ({
                  ...old,
                  confirm_password: e.target.value,
                }))
              }
            />
          </div>

          <button
            type="submit"
            className="public-auth-submit"
            disabled={busy}
          >
            {busy
              ? "Changing password..."
              : "Change Password"}
          </button>
        </form>
      )}

      {complete ? (
        <button
          type="button"
          className="public-auth-submit"
          onClick={() =>
            navigate("/login", {
              replace: true,
            })
          }
        >
          Continue to Login
        </button>
      ) : (
        <button
          type="button"
          className="public-auth-back"
          onClick={() =>
            navigate("/forgot-password")
          }
        >
          <ArrowLeft size={17} />
          Request New Link
        </button>
      )}

      <div className="auth-security-note">
        Your password is sent only through the encrypted
        application connection. The system never stores your
        plain-text password.
      </div>
    </PublicAuthPage>
  );
}