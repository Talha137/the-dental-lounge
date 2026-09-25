import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Stethoscope,
  Receipt,
  LogOut,
  Plus,
  Search,
  Pencil,
  Trash2,
  Printer,
  X,
  CheckCircle2,
  AlertCircle,
  WalletCards,
  History,
  Building2,
  ShieldCheck,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Palette,
  Save,
  Image as ImageIcon,
} from "lucide-react";

import api from "./services/api";
import "./styles.css";

/* =========================================================
   HELPERS
========================================================= */

const money = (value) =>
  `PKR ${Number(value || 0).toLocaleString("en-PK")}`;

const dateOnly = (value) => {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const dateTime = (value) => {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

const inputDate = (value) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

const inputDateTime = (value) => {
  if (!value) return "";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return "";

  const local = new Date(
    d.getTime() - d.getTimezoneOffset() * 60000
  );

  return local.toISOString().slice(0, 16);
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function getError(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function getClinicBrand() {
  const user = getStoredUser();
  const c = user?.clinic || {};

  return {
    clinic_name: c.clinic_name || "The Dental Lounge",
    clinic_code: c.clinic_code || "",
    logo_url: c.logo_url || "",

    primary_color: c.primary_color || "#0e7f86",
    secondary_color: c.secondary_color || "#7edbd7",
    accent_color: c.accent_color || "#14a3a8",

    text_color: c.text_color || "#172033",
    muted_text_color: c.muted_text_color || "#64748b",

    sidebar_color: c.sidebar_color || "#071f25",
    sidebar_active_color: c.sidebar_active_color || "#7edbd7",
    sidebar_text_color: c.sidebar_text_color || "#ffffff",
    sidebar_active_text_color: c.sidebar_active_text_color || "#071f25",

    page_background_color:
      c.page_background_color || "#f4fafb",
    card_background_color:
      c.card_background_color || "#ffffff",
    table_header_color:
      c.table_header_color || "#f8fafc",

    primary_button_color:
      c.primary_button_color || "#0e7f86",
    secondary_button_color:
      c.secondary_button_color || "#ffffff",
    danger_button_color:
      c.danger_button_color || "#dc2626",
    primary_button_text_color:
      c.primary_button_text_color || "#ffffff",
    secondary_button_text_color:
      c.secondary_button_text_color || "#172033",
    danger_button_text_color:
      c.danger_button_text_color || "#ffffff",

    success_color: c.success_color || "#16a34a",
    warning_color: c.warning_color || "#d97706",
    error_color: c.error_color || "#dc2626",
    info_color: c.info_color || "#0284c7",
    success_text_color: c.success_text_color || "#ffffff",
    warning_text_color: c.warning_text_color || "#ffffff",
    error_text_color: c.error_text_color || "#ffffff",
    info_text_color: c.info_text_color || "#ffffff",

    paid_color: c.paid_color || "#16a34a",
    partial_color: c.partial_color || "#d97706",
    unpaid_color: c.unpaid_color || "#dc2626",
    paid_text_color: c.paid_text_color || "#ffffff",
    partial_text_color: c.partial_text_color || "#ffffff",
    unpaid_text_color: c.unpaid_text_color || "#ffffff",

    scheduled_color: c.scheduled_color || "#64748b",
    confirmed_color: c.confirmed_color || "#0284c7",
    completed_color: c.completed_color || "#16a34a",
    cancelled_color: c.cancelled_color || "#dc2626",
    no_show_color: c.no_show_color || "#7c3aed",
    scheduled_text_color: c.scheduled_text_color || "#ffffff",
    confirmed_text_color: c.confirmed_text_color || "#ffffff",
    completed_text_color: c.completed_text_color || "#ffffff",
    cancelled_text_color: c.cancelled_text_color || "#ffffff",
    no_show_text_color: c.no_show_text_color || "#ffffff",

    input_focus_color:
      c.input_focus_color || "#14a3a8",
    modal_accent_color:
      c.modal_accent_color || "#0e7f86",

    welcome_gradient_start:
      c.welcome_gradient_start || "#071f25",
    welcome_gradient_end:
      c.welcome_gradient_end || "#14a3a8",
    welcome_text_color:
      c.welcome_text_color || "#ffffff",

    currency: c.currency || "PKR",
    timezone: c.timezone || "Asia/Karachi",

    owner_name: c.owner_name || "",
    address: c.address || "",
    phone: c.phone || "",
    email: c.email || "",
    website: c.website || "",
    registration_no: c.registration_no || "",

    receipt_footer: c.receipt_footer || "",
    prescription_footer: c.prescription_footer || "",
  };
}

function clinicInitials(name) {
  const value = String(name || "").trim();

  if (!value) return "CL";

  const words = value
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 1) {
    return words[0]
      .slice(0, 3)
      .toUpperCase();
  }

  return words
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/* =========================================================
   NOTICE
========================================================= */

function Notice({ notice, onClose }) {
  if (!notice?.message) return null;

  return (
    <div className={`notice ${notice.type || "success"}`}>
      <div className="notice-left">
        {notice.type === "error" ? (
          <AlertCircle size={20} />
        ) : (
          <CheckCircle2 size={20} />
        )}

        <span>{notice.message}</span>
      </div>

      <button
        type="button"
        className="icon-btn"
        onClick={onClose}
      >
        <X size={18} />
      </button>
    </div>
  );
}

/* =========================================================
   MODAL
========================================================= */

function Modal({
  title,
  children,
  onClose,
  wide = false,
}) {
  return (
    <div className="modal-backdrop">
      <div
        className={`modal ${
          wide ? "modal-wide" : ""
        }`}
      >
        <div className="modal-header">
          <h2>{title}</h2>

          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SEARCHABLE PATIENT
========================================================= */

function SearchablePatient({
  patients,
  value,
  onChange,
  placeholder = "Search patient by name, ID or phone...",
}) {
  const selected = patients.find(
    (p) => p.id === value
  );

  const [query, setQuery] = useState(
    selected
      ? `${selected.full_name} (${selected.patient_code})`
      : ""
  );

  const [open, setOpen] = useState(false);

  useEffect(() => {
    const current = patients.find(
      (p) => p.id === value
    );

    if (current) {
      setQuery(
        `${current.full_name} (${current.patient_code})`
      );
    }

    if (!value) {
      setQuery("");
    }
  }, [value, patients]);

  const matches = useMemo(() => {
    const q = query
      .toLowerCase()
      .trim();

    if (!q) {
      return patients.slice(0, 20);
    }

    return patients
      .filter((p) =>
        [
          p.full_name,
          p.patient_code,
          p.phone,
          p.cnic,
        ]
          .filter(Boolean)
          .some((x) =>
            String(x)
              .toLowerCase()
              .includes(q)
          )
      )
      .slice(0, 20);
  }, [patients, query]);

  return (
    <div className="patient-search">
      <div className="patient-search-input">
        <Search size={18} />

        <input
          value={query}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange("");
            setOpen(true);
          }}
        />
      </div>

      {open && (
        <div className="patient-dropdown">
          {matches.length === 0 ? (
            <div className="patient-empty">
              No patient found.
            </div>
          ) : (
            matches.map((patient) => (
              <button
                type="button"
                className="patient-option"
                key={patient.id}
                onClick={() => {
                  onChange(patient.id);

                  setQuery(
                    `${patient.full_name} (${patient.patient_code})`
                  );

                  setOpen(false);
                }}
              >
                <strong>
                  {patient.full_name}
                </strong>

                <span>
                  {patient.patient_code}

                  {patient.phone
                    ? ` • ${patient.phone}`
                    : ""}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   LOGIN
========================================================= */

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  async function submit(e) {
    e.preventDefault();

    setError("");
    setBusy(true);

    try {
      const { data } =
        await api.post(
          "/auth/login",
          {
            email,
            password,
          }
        );

      localStorage.setItem(
        "token",
        data.token
      );

      const loginUser = {
        ...(data.user || {}),
        clinic:
          data.clinic ||
          data.user?.clinic ||
          null,
      };

      localStorage.setItem(
        "user",
        JSON.stringify(loginUser)
      );

      navigate("/");
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <form
        className="login-card"
        onSubmit={submit}
      >
        <div className="brand-mark">
          TDL
        </div>

        <h1>The Dental Lounge</h1>

        <p>
          Clinic Management System
        </p>

        {error && (
          <div className="form-error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <label>Email</label>

        <input
          type="email"
          value={email}
          autoComplete="username"
          onChange={(e) =>
            setEmail(e.target.value)
          }
          placeholder="Enter email address"
          required
        />

        <label>Password</label>

        <input
          type="password"
          value={password}
          autoComplete="current-password"
          onChange={(e) =>
            setPassword(e.target.value)
          }
          placeholder="Enter password"
          required
        />

        <button
          className="btn primary full"
          disabled={busy}
        >
          {busy
            ? "Signing in..."
            : "Sign In"}
        </button>
      </form>
    </div>
  );
}

/* =========================================================
   APP SHELL
========================================================= */

function Shell() {
  const navigate = useNavigate();

  const [user, setUser] = useState(
    () => getStoredUser()
  );

  const clinic = getClinicBrand();

  useEffect(() => {
    let active = true;

    async function refreshSession() {
      try {
        const { data } =
          await api.get("/auth/me");

        const freshUser =
          data?.user ||
          data ||
          {};

        const freshClinic =
          data?.clinic ||
          freshUser?.clinic ||
          null;

        const mergedUser = {
          ...getStoredUser(),
          ...freshUser,
          clinic: freshClinic,
        };

        if (!active) return;

        localStorage.setItem(
          "user",
          JSON.stringify(mergedUser)
        );

        setUser(mergedUser);
      } catch (err) {
        if (
          err?.response?.status !== 401
        ) {
          console.error(
            "Could not refresh clinic branding:",
            err
          );
        }
      }
    }

    refreshSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    const variables = {
      "--clinic-primary": clinic.primary_color,
      "--clinic-secondary": clinic.secondary_color,
      "--clinic-accent": clinic.accent_color,
      "--clinic-text": clinic.text_color,
      "--clinic-muted-text": clinic.muted_text_color,
      "--clinic-sidebar": clinic.sidebar_color,
      "--clinic-sidebar-active": clinic.sidebar_active_color,
      "--clinic-sidebar-text": clinic.sidebar_text_color,
      "--clinic-sidebar-active-text": clinic.sidebar_active_text_color,
      "--clinic-page-bg": clinic.page_background_color,
      "--clinic-card-bg": clinic.card_background_color,
      "--clinic-table-header": clinic.table_header_color,
      "--clinic-primary-button": clinic.primary_button_color,
      "--clinic-secondary-button": clinic.secondary_button_color,
      "--clinic-danger-button": clinic.danger_button_color,
      "--clinic-primary-button-text": clinic.primary_button_text_color,
      "--clinic-secondary-button-text": clinic.secondary_button_text_color,
      "--clinic-danger-button-text": clinic.danger_button_text_color,
      "--clinic-success": clinic.success_color,
      "--clinic-warning": clinic.warning_color,
      "--clinic-error": clinic.error_color,
      "--clinic-info": clinic.info_color,
      "--clinic-success-text": clinic.success_text_color,
      "--clinic-warning-text": clinic.warning_text_color,
      "--clinic-error-text": clinic.error_text_color,
      "--clinic-info-text": clinic.info_text_color,
      "--clinic-paid": clinic.paid_color,
      "--clinic-partial": clinic.partial_color,
      "--clinic-unpaid": clinic.unpaid_color,
      "--clinic-paid-text": clinic.paid_text_color,
      "--clinic-partial-text": clinic.partial_text_color,
      "--clinic-unpaid-text": clinic.unpaid_text_color,
      "--clinic-scheduled": clinic.scheduled_color,
      "--clinic-confirmed": clinic.confirmed_color,
      "--clinic-completed": clinic.completed_color,
      "--clinic-cancelled": clinic.cancelled_color,
      "--clinic-no-show": clinic.no_show_color,
      "--clinic-scheduled-text": clinic.scheduled_text_color,
      "--clinic-confirmed-text": clinic.confirmed_text_color,
      "--clinic-completed-text": clinic.completed_text_color,
      "--clinic-cancelled-text": clinic.cancelled_text_color,
      "--clinic-no-show-text": clinic.no_show_text_color,
      "--clinic-input-focus": clinic.input_focus_color,
      "--clinic-modal-accent": clinic.modal_accent_color,
      "--clinic-gradient-start": clinic.welcome_gradient_start,
      "--clinic-gradient-end": clinic.welcome_gradient_end,
      "--clinic-welcome-text": clinic.welcome_text_color,

      /* Existing CSS compatibility */
      "--brand": clinic.primary_color,
      "--brand-2": clinic.accent_color,
    };

    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    document.title =
      clinic.clinic_name || "Clinic Management";
  }, [clinic]);

  const menu = [
    {
      to: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
    },

    {
      to: "/patients",
      label: "Patients",
      icon: Users,
    },

    {
      to: "/appointments",
      label: "Appointments",
      icon: CalendarDays,
    },

    {
      to: "/treatments",
      label: "Treatments",
      icon: Stethoscope,
    },

    {
      to: "/billing",
      label: "Billing",
      icon: Receipt,
    },

    ...(user.system_role ===
    "super_admin"
      ? [
          {
            to: "/admin/clinics",
            label: "Clinics",
            icon: Building2,
          },

          {
            to: "/admin/users",
            label: "Users",
            icon: ShieldCheck,
          },
        ]
      : []),
  ];

  function logout() {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    navigate("/login");
  }

  return (
    <div className="app-shell">
      <style>{`
        body,
        .app-shell,
        .main-content {
          background: var(--clinic-page-bg) !important;
        }

        .sidebar {
          background: var(--clinic-sidebar) !important;
        }

        .sidebar,
        .sidebar .nav-item,
        .sidebar-brand,
        .sidebar-brand strong,
        .sidebar-brand span,
        .sidebar-user strong,
        .sidebar-user span,
        .logout-btn {
          color: var(--clinic-sidebar-text) !important;
        }

        .nav-item.active {
          background: var(--clinic-sidebar-active) !important;
          color: var(--clinic-sidebar-active-text) !important;
        }

        .sidebar-logo {
          border-color: var(--clinic-accent) !important;
        }

        .stat-card,
        .table-card,
        .card,
        .modal,
        .toolbar,
        .panel {
          background: var(--clinic-card-bg) !important;
        }

        table thead th {
          background: var(--clinic-table-header) !important;
        }

        .btn.primary {
          background: var(--clinic-primary-button) !important;
          border-color: var(--clinic-primary-button) !important;
          color: var(--clinic-primary-button-text) !important;
        }

        .btn.secondary {
          background: var(--clinic-secondary-button) !important;
          color: var(--clinic-secondary-button-text) !important;
        }

        .btn.danger,
        .btn.danger:hover,
        .btn.danger:focus,
        .btn.danger:active {
          background: var(--clinic-danger-button) !important;
          border-color: var(--clinic-danger-button) !important;
          color: var(--clinic-danger-button-text) !important;
        }

        input:focus,
        textarea:focus,
        select:focus {
          border-color: var(--clinic-input-focus) !important;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--clinic-input-focus) 18%, transparent) !important;
        }

        .modal-header {
          border-top-color: var(--clinic-modal-accent) !important;
        }

        .welcome-card {
          color: var(--clinic-welcome-text) !important;
          background: linear-gradient(
            120deg,
            var(--clinic-gradient-start),
            var(--clinic-gradient-end)
          ) !important;
        }

        .notice.success {
          border-color: var(--clinic-success) !important;
          color: var(--clinic-success-text) !important;
        }

        .notice.error {
          border-color: var(--clinic-error) !important;
          color: var(--clinic-error-text) !important;
        }

        .status-select.scheduled,
        .status.scheduled,
        .badge.scheduled {
          color: var(--clinic-scheduled-text) !important;
          background: var(--clinic-scheduled) !important;
          border-color: var(--clinic-scheduled) !important;
        }

        .status-select.confirmed,
        .status.confirmed,
        .badge.confirmed {
          color: var(--clinic-confirmed-text) !important;
          background: var(--clinic-confirmed) !important;
          border-color: var(--clinic-confirmed) !important;
        }

        .status-select.completed,
        .status.completed,
        .badge.completed {
          color: var(--clinic-completed-text) !important;
          background: var(--clinic-completed) !important;
          border-color: var(--clinic-completed) !important;
        }

        .status-select.cancelled,
        .status.cancelled,
        .badge.cancelled {
          color: var(--clinic-cancelled-text) !important;
          background: var(--clinic-cancelled) !important;
          border-color: var(--clinic-cancelled) !important;
        }

        .status-select.no-show,
        .status.no-show,
        .badge.no-show {
          color: var(--clinic-no-show-text) !important;
          background: var(--clinic-no-show) !important;
          border-color: var(--clinic-no-show) !important;
        }

        .status.paid,
        .badge.paid,
        .payment-status.paid {
          color: var(--clinic-paid-text) !important;
          background: var(--clinic-paid) !important;
          border-color: var(--clinic-paid) !important;
        }

        .status.partial,
        .badge.partial,
        .payment-status.partial {
          color: var(--clinic-partial-text) !important;
          background: var(--clinic-partial) !important;
          border-color: var(--clinic-partial) !important;
        }

        .status.unpaid,
        .badge.unpaid,
        .payment-status.unpaid {
          color: var(--clinic-unpaid-text) !important;
          background: var(--clinic-unpaid) !important;
          border-color: var(--clinic-unpaid) !important;
        }
      `}</style>
      <aside className="sidebar">
        <div className="sidebar-brand">
          {clinic.logo_url ? (
            <div
              className="sidebar-logo"
              style={{
                padding: 0,
                overflow: "hidden",
              }}
            >
              <img
                src={clinic.logo_url}
                alt={`${clinic.clinic_name} logo`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
                onError={(e) => {
                  e.currentTarget.style.display =
                    "none";
                }}
              />
            </div>
          ) : (
            <div className="sidebar-logo">
              {clinicInitials(
                clinic.clinic_name
              )}
            </div>
          )}

          <div>
            <strong>
              {clinic.clinic_name}
            </strong>

            <span>
              {user.system_role ===
              "super_admin"
                ? "Super Admin"
                : "Clinic Management"}
            </span>
          </div>
        </div>

        <nav>
          {menu.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({
                  isActive,
                }) =>
                  isActive
                    ? "nav-item active"
                    : "nav-item"
                }
              >
                <Icon size={19} />

                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <strong>
              {user.name ||
                user.full_name ||
                "Clinic Admin"}
            </strong>

            <span>
              {user.system_role ||
                user.role ||
                "staff"}
            </span>
          </div>

          <button
            className="logout-btn"
            onClick={logout}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={<Dashboard />}
          />

          <Route
            path="/patients"
            element={<Patients />}
          />

          <Route
            path="/appointments"
            element={<Appointments />}
          />

          <Route
            path="/treatments"
            element={<Treatments />}
          />

          <Route
            path="/billing"
            element={<Billing />}
          />

          <Route
            path="/admin/clinics"
            element={<AdminClinics />}
          />

          <Route
            path="/admin/clinics/:id"
            element={
              <AdminClinicDetails />
            }
          />

          <Route
            path="/admin/users"
            element={<AdminUsers />}
          />

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard() {
  const clinic =
    getClinicBrand();

  const [data, setData] =
    useState({
      patients: 0,
      todayAppointments: 0,
      totalRevenue: 0,
      todayRevenue: 0,
      outstanding: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function load() {
    try {
      setError("");

      const response =
        await api.get(
          "/dashboard"
        );

      setData(response.data);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const cards = [
    {
      label: "Total Patients",
      value: data.patients,
      icon: Users,
    },

    {
      label:
        "Today's Appointments",
      value:
        data.todayAppointments,
      icon: CalendarDays,
    },

    {
      label: "Total Revenue",
      value: money(
        data.totalRevenue ??
          data.todayRevenue
      ),
      icon: WalletCards,
    },

    {
      label: "Outstanding",
      value: money(
        data.outstanding
      ),
      icon: Receipt,
    },
  ];

  return (
    <Page
      title="Dashboard"
      subtitle="Clinic overview and today's activity"
    >
      {error && (
        <Notice
          notice={{
            type: "error",
            message: error,
          }}
          onClose={() =>
            setError("")
          }
        />
      )}

      {loading ? (
        <div className="loading-card">
          Loading dashboard...
        </div>
      ) : (
        <div className="stats-grid">
          {cards.map((card) => {
            const Icon =
              card.icon;

            return (
              <div
                className="stat-card"
                key={card.label}
              >
                <div className="stat-icon">
                  <Icon size={23} />
                </div>

                <div>
                  <span>
                    {card.label}
                  </span>

                  <strong>
                    {card.value}
                  </strong>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="welcome-card">
        <h2>
          Welcome to{" "}
          {clinic.clinic_name}
        </h2>

        <p>
          Manage patients,
          appointments, clinical
          records, prescriptions
          and billing from one
          place.
        </p>
      </div>
    </Page>
  );
}

/* =========================================================
   PATIENTS
========================================================= */

const emptyPatient = {
  full_name: "",
  phone: "",
  cnic: "",
  gender: "",
  date_of_birth: "",
  address: "",
  medical_history: "",
  allergies: "",
  notes: "",
};

function Patients() {
  const [patients, setPatients] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [form, setForm] =
    useState(emptyPatient);

  const [editing, setEditing] =
    useState(null);

  const [showForm, setShowForm] =
    useState(false);

  const [notice, setNotice] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  async function load(q = "") {
    try {
      const { data } =
        await api.get(
          "/patients",
          {
            params: { q },
          }
        );

      setPatients(data);
    } catch (err) {
      setNotice({
        type: "error",
        message: getError(err),
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer =
      setTimeout(() => {
        load(search);
      }, 250);

    return () =>
      clearTimeout(timer);
  }, [search]);

  function openAdd() {
    setEditing(null);

    setForm(emptyPatient);

    setShowForm(true);
  }

  function openEdit(patient) {
    setEditing(patient);

    setForm({
      full_name:
        patient.full_name || "",

      phone:
        patient.phone || "",

      cnic:
        patient.cnic || "",

      gender:
        patient.gender || "",

      date_of_birth:
        inputDate(
          patient.date_of_birth
        ),

      address:
        patient.address || "",

      medical_history:
        patient.medical_history ||
        "",

      allergies:
        patient.allergies || "",

      notes:
        patient.notes || "",
    });

    setShowForm(true);
  }

  async function save(e) {
    e.preventDefault();

    setSaving(true);

    try {
      const response = editing
        ? await api.put(
            `/patients/${editing.id}`,
            form
          )
        : await api.post(
            "/patients",
            form
          );

      setNotice({
        type: "success",
        message:
          response.data.message,
      });

      setShowForm(false);

      setEditing(null);

      setForm(emptyPatient);

      await load(search);
    } catch (err) {
      setNotice({
        type: "error",
        message: getError(err),
      });
    } finally {
      setSaving(false);
    }
  }

  async function remove(patient) {
    const ok =
      window.confirm(
        `PERMANENT DELETE\n\nDelete ${patient.full_name} (${patient.patient_code})?\n\nThis will also permanently remove this patient's appointments, treatments, prescriptions, invoices and payments.\n\nThis action cannot be undone.`
      );

    if (!ok) return;

    const second =
      window.confirm(
        "Are you absolutely sure you want to permanently delete this patient and all related records?"
      );

    if (!second) return;

    try {
      const { data } =
        await api.delete(
          `/patients/${patient.id}`
        );

      setNotice({
        type: "success",
        message: data.message,
      });

      await load(search);
    } catch (err) {
      setNotice({
        type: "error",
        message: getError(err),
      });
    }
  }

  return (
    <Page
      title="Patients"
      subtitle="Patient registration and records"
      action={
        <button
          className="btn primary"
          onClick={openAdd}
        >
          <Plus size={18} />
          Add Patient
        </button>
      }
    >
      <Notice
        notice={notice}
        onClose={() =>
          setNotice(null)
        }
      />

      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />

          <input
            placeholder="Search name, patient ID, phone or CNIC..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />
        </div>
      </div>

      <div className="table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  Patient ID
                </th>

                <th>Name</th>

                <th>Phone</th>

                <th>Gender</th>

                <th>Age</th>

                <th>
                  Registered
                </th>

                <th className="actions-col">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <TableMessage
                  columns={7}
                  text="Loading patients..."
                />
              ) : patients.length ===
                0 ? (
                <TableMessage
                  columns={7}
                  text="No patients found."
                />
              ) : (
                patients.map(
                  (patient) => (
                    <tr
                      key={
                        patient.id
                      }
                    >
                      <td>
                        <span className="code">
                          {
                            patient.patient_code
                          }
                        </span>
                      </td>

                      <td>
                        <strong>
                          {
                            patient.full_name
                          }
                        </strong>
                      </td>

                      <td>
                        {patient.phone ||
                          "—"}
                      </td>

                      <td>
                        {patient.gender ||
                          "—"}
                      </td>

                      <td>
                        {patient.calculated_age ??
                          "—"}
                      </td>

                      <td>
                        {dateOnly(
                          patient.created_at
                        )}
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn small secondary"
                            onClick={() =>
                              openEdit(
                                patient
                              )
                            }
                          >
                            <Pencil
                              size={
                                15
                              }
                            />
                            Edit
                          </button>

                          <button
                            className="btn small danger"
                            onClick={() =>
                              remove(
                                patient
                              )
                            }
                          >
                            <Trash2
                              size={
                                15
                              }
                            />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <Modal
          title={
            editing
              ? "Edit Patient"
              : "Add Patient"
          }
          onClose={() =>
            setShowForm(false)
          }
          wide
        >
          <form onSubmit={save}>
            <div className="form-grid">
              <Field label="Full Name *">
                <input
                  value={
                    form.full_name
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      full_name:
                        e.target
                          .value,
                    })
                  }
                  required
                />
              </Field>

              <Field label="Phone">
                <input
                  value={
                    form.phone
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone:
                        e.target
                          .value,
                    })
                  }
                />
              </Field>

              <Field label="CNIC">
                <input
                  value={
                    form.cnic
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      cnic:
                        e.target
                          .value,
                    })
                  }
                />
              </Field>

              <Field label="Gender">
                <select
                  value={
                    form.gender
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      gender:
                        e.target
                          .value,
                    })
                  }
                >
                  <option value="">
                    Select
                  </option>

                  <option>
                    Male
                  </option>

                  <option>
                    Female
                  </option>

                  <option>
                    Other
                  </option>
                </select>
              </Field>

              <Field label="Date of Birth">
                <input
                  type="date"
                  value={
                    form.date_of_birth
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      date_of_birth:
                        e.target
                          .value,
                    })
                  }
                />
              </Field>

              <Field
                label="Address"
                full
              >
                <input
                  value={
                    form.address
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      address:
                        e.target
                          .value,
                    })
                  }
                />
              </Field>

              <Field
                label="Medical History"
                full
              >
                <textarea
                  rows="3"
                  value={
                    form.medical_history
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      medical_history:
                        e.target
                          .value,
                    })
                  }
                />
              </Field>

              <Field
                label="Allergies"
                full
              >
                <textarea
                  rows="2"
                  value={
                    form.allergies
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      allergies:
                        e.target
                          .value,
                    })
                  }
                />
              </Field>

              <Field
                label="Notes"
                full
              >
                <textarea
                  rows="3"
                  value={
                    form.notes
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notes:
                        e.target
                          .value,
                    })
                  }
                />
              </Field>
            </div>

            <FormActions
              onCancel={() =>
                setShowForm(false)
              }
              busy={saving}
              text={
                editing
                  ? "Update Patient"
                  : "Save Patient"
              }
            />
          </form>
        </Modal>
      )}
    </Page>
  );
}/* =========================================================
   APPOINTMENTS
========================================================= */

const emptyAppointment = {
  patient_id: "",
  appointment_at: "",
  reason: "",
  notes: "",
  status: "scheduled",
};

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);

  const [form, setForm] = useState(emptyAppointment);

  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const [a, p] = await Promise.all([
        api.get("/appointments"),
        api.get("/patients"),
      ]);

      setAppointments(a.data);
      setPatients(p.data);
    } catch (err) {
      setNotice({
        type: "error",
        message: getError(err),
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setEditing(null);
    setForm(emptyAppointment);
    setShowForm(true);
  }

  function openEdit(item) {
    setEditing(item);

    setForm({
      patient_id: item.patient_id,
      appointment_at: inputDateTime(item.appointment_at),
      reason: item.reason || "",
      notes: item.notes || "",
      status: item.status || "scheduled",
    });

    setShowForm(true);
  }

  async function save(e) {
    e.preventDefault();

    setSaving(true);

    try {
      const payload = {
        ...form,
        appointment_at: form.appointment_at,
      };

      const response = editing
        ? await api.put(
            `/appointments/${editing.id}`,
            payload
          )
        : await api.post("/appointments", payload);

      setNotice({
        type: "success",
        message: response.data.message,
      });

      setShowForm(false);
      setEditing(null);
      setForm(emptyAppointment);

      await load();
    } catch (err) {
      setNotice({
        type: "error",
        message: getError(err),
      });
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(id, status) {
    try {
      const { data } = await api.patch(
        `/appointments/${id}/status`,
        { status }
      );

      setNotice({
        type: "success",
        message: data.message,
      });

      await load();
    } catch (err) {
      setNotice({
        type: "error",
        message: getError(err),
      });
    }
  }

  async function remove(item) {
    if (
      !window.confirm(
        `Delete ${item.patient_name}'s appointment?\n\nExisting treatment history will not be deleted.`
      )
    ) {
      return;
    }

    try {
      const { data } = await api.delete(
        `/appointments/${item.id}`
      );

      setNotice({
        type: "success",
        message: data.message,
      });

      await load();
    } catch (err) {
      setNotice({
        type: "error",
        message: getError(err),
      });
    }
  }

  return (
    <Page
      title="Appointments"
      subtitle="Schedule and manage clinic appointments"
      action={
        <button
          className="btn primary"
          onClick={openAdd}
        >
          <Plus size={18} />
          New Appointment
        </button>
      }
    >
      <Notice
        notice={notice}
        onClose={() => setNotice(null)}
      />

      <div className="table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Patient</th>
                <th>Phone</th>
                <th>Reason</th>
                <th>Status</th>
                <th className="actions-col">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <TableMessage
                  columns={6}
                  text="Loading appointments..."
                />
              ) : appointments.length === 0 ? (
                <TableMessage
                  columns={6}
                  text="No appointments found."
                />
              ) : (
                appointments.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>
                        {dateTime(item.appointment_at)}
                      </strong>
                    </td>

                    <td>
                      {item.patient_name}

                      <small className="subtext">
                        {item.patient_code}
                      </small>
                    </td>

                    <td>
                      {item.patient_phone || "—"}
                    </td>

                    <td>
                      {item.reason || "—"}
                    </td>

                    <td>
                      <select
                        className={`status-select ${item.status}`}
                        value={item.status}
                        onChange={(e) =>
                          changeStatus(
                            item.id,
                            e.target.value
                          )
                        }
                      >
                        <option value="scheduled">
                          Scheduled
                        </option>

                        <option value="confirmed">
                          Confirmed
                        </option>

                        <option value="completed">
                          Completed
                        </option>

                        <option value="cancelled">
                          Cancelled
                        </option>

                        <option value="no-show">
                          No Show
                        </option>
                      </select>
                    </td>

                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn small secondary"
                          onClick={() =>
                            openEdit(item)
                          }
                        >
                          <Pencil size={15} />
                          Edit
                        </button>

                        <button
                          className="btn small danger"
                          onClick={() =>
                            remove(item)
                          }
                        >
                          <Trash2 size={15} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <Modal
          title={
            editing
              ? "Edit Appointment"
              : "New Appointment"
          }
          onClose={() =>
            setShowForm(false)
          }
          wide
        >
          <form onSubmit={save}>
            <div className="form-grid">
              <Field
                label="Patient *"
                full
              >
                <SearchablePatient
                  patients={patients}
                  value={form.patient_id}
                  onChange={(id) =>
                    setForm({
                      ...form,
                      patient_id: id,
                    })
                  }
                />
              </Field>

              <Field label="Appointment Date & Time *">
                <input
                  type="datetime-local"
                  value={form.appointment_at}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      appointment_at:
                        e.target.value,
                    })
                  }
                  required
                />
              </Field>

              {editing && (
                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status:
                          e.target.value,
                      })
                    }
                  >
                    <option value="scheduled">
                      Scheduled
                    </option>

                    <option value="confirmed">
                      Confirmed
                    </option>

                    <option value="completed">
                      Completed
                    </option>

                    <option value="cancelled">
                      Cancelled
                    </option>

                    <option value="no-show">
                      No Show
                    </option>
                  </select>
                </Field>
              )}

              <Field
                label="Reason"
                full
              >
                <input
                  value={form.reason}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      reason:
                        e.target.value,
                    })
                  }
                  placeholder="e.g. Tooth pain / consultation"
                />
              </Field>

              <Field
                label="Notes"
                full
              >
                <textarea
                  rows="3"
                  value={form.notes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notes:
                        e.target.value,
                    })
                  }
                />
              </Field>
            </div>

            <FormActions
              onCancel={() =>
                setShowForm(false)
              }
              busy={saving}
              text={
                editing
                  ? "Update Appointment"
                  : "Book Appointment"
              }
            />
          </form>
        </Modal>
      )}
    </Page>
  );
}

/* =========================================================
   TREATMENTS
========================================================= */

const emptyTreatment = {
  patient_id: "",
  treatment_date: new Date()
    .toISOString()
    .slice(0, 10),

  patient_age: "",
  doctor_name: "",
  tooth_no: "",
  diagnosis: "",
  procedure: "",
  prescription: "",
  clinical_notes: "",
  fee: "",
};

function Treatments() {
  const [treatments, setTreatments] = useState([]);
  const [patients, setPatients] = useState([]);

  const [form, setForm] = useState(emptyTreatment);
  const [editing, setEditing] = useState(null);

  const [showForm, setShowForm] = useState(false);

  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const [t, p] = await Promise.all([
        api.get("/treatments"),
        api.get("/patients"),
      ]);

      setTreatments(t.data);
      setPatients(p.data);
    } catch (err) {
      setNotice({
        type: "error",
        message: getError(err),
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setEditing(null);

    setForm({
      ...emptyTreatment,

      treatment_date: new Date()
        .toISOString()
        .slice(0, 10),
    });

    setShowForm(true);
  }

  function openEdit(item) {
    setEditing(item);

    setForm({
      patient_id:
        item.patient_id || "",

      treatment_date:
        inputDate(
          item.treatment_date
        ),

      patient_age:
        item.patient_age ?? "",

      doctor_name:
        item.doctor_name_manual ||
        item.doctor_name ||
        "",

      tooth_no:
        item.tooth_no || "",

      diagnosis:
        item.diagnosis || "",

      procedure:
        item.procedure || "",

      prescription:
        item.prescription || "",

      clinical_notes:
        item.clinical_notes || "",

      fee:
        item.fee ?? "",
    });

    setShowForm(true);
  }

  async function save(e) {
    e.preventDefault();

    setSaving(true);

    try {
      const response = editing
        ? await api.put(
            `/treatments/${editing.id}`,
            form
          )
        : await api.post(
            "/treatments",
            form
          );

      setNotice({
        type: "success",
        message: response.data.message,
      });

      setShowForm(false);
      setEditing(null);

      await load();
    } catch (err) {
      setNotice({
        type: "error",
        message: getError(err),
      });
    } finally {
      setSaving(false);
    }
  }

  async function remove(item) {
    if (
      !window.confirm(
        `Delete treatment "${item.procedure}" for ${item.patient_name}?\n\nAny invoice will be kept, but detached from this treatment.`
      )
    ) {
      return;
    }

    try {
      const { data } = await api.delete(
        `/treatments/${item.id}`
      );

      setNotice({
        type: "success",
        message: data.message,
      });

      await load();
    } catch (err) {
      setNotice({
        type: "error",
        message: getError(err),
      });
    }
  }

  function printPrescription(item) {
    /*
     * IMPORTANT:
     * Prescription branding now comes from
     * the logged-in clinic instead of being
     * hard-coded as The Dental Lounge.
     */
    const clinic = getClinicBrand();

    const win = window.open(
      "",
      "_blank",
      "width=900,height=1000"
    );

    if (!win) {
      setNotice({
        type: "error",
        message:
          "Print window was blocked by the browser. Please allow pop-ups.",
      });

      return;
    }

    const age =
      item.patient_age !== null &&
      item.patient_age !== undefined &&
      item.patient_age !== ""
        ? `${escapeHtml(
            item.patient_age
          )} Years`
        : "—";

    const clinicContact = [
      clinic.address,
      clinic.phone,
      clinic.email,
      clinic.website,
    ]
      .filter(Boolean)
      .map(escapeHtml)
      .join(" • ");

    const logoHtml =
      clinic.logo_url
        ? `
          <img
            src="${escapeHtml(
              clinic.logo_url
            )}"
            alt="Clinic Logo"
            style="
              max-width:90px;
              max-height:70px;
              object-fit:contain;
              margin-bottom:10px;
            "
          />
        `
        : "";

    win.document.write(`
      <!doctype html>

      <html>
        <head>
          <title>
            Prescription - ${escapeHtml(
              item.patient_name
            )}
          </title>

          <style>
            @page {
              size: A4;
              margin: 12mm;
            }

            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              font-family:
                Arial,
                Helvetica,
                sans-serif;
              color: #172033;
              background: white;
            }

            .sheet {
              min-height: 270mm;
              border: 1px solid #d9e1ea;
              padding: 28px 32px;
              position: relative;
            }

            .header {
              text-align: center;
              padding-bottom: 18px;
              border-bottom: 3px solid ${escapeHtml(
                clinic.primary_color
              )};
            }

            .header h1 {
              margin: 0 0 6px;
              font-size: 28px;
              letter-spacing: .4px;
              color: ${escapeHtml(
                clinic.primary_color
              )};
            }

            .header p {
              margin: 4px 0 0;
              font-size: 13px;
              color: #5f6878;
            }

            .clinic-contact {
              margin-top: 8px;
              font-size: 11px;
              line-height: 1.5;
              color: #6b7280;
            }

            .registration {
              margin-top: 4px;
              font-size: 11px;
              color: #6b7280;
            }

            .meta {
              display: grid;
              grid-template-columns:
                1fr 1fr;
              gap: 10px 24px;
              padding: 20px 0;
              border-bottom:
                1px solid #d9e1ea;
              font-size: 14px;
            }

            .meta div {
              display: flex;
              gap: 8px;
            }

            .label {
              font-weight: 700;
            }

            .section {
              margin-top: 22px;
            }

            .section h3 {
              margin: 0 0 8px;
              font-size: 15px;
              text-transform:
                uppercase;
              letter-spacing: .5px;
              color: ${escapeHtml(
                clinic.primary_color
              )};
            }

            .box {
              border:
                1px solid #d9e1ea;
              border-radius: 6px;
              padding: 12px;
              min-height: 46px;
              white-space: pre-wrap;
              line-height: 1.55;
              font-size: 14px;
            }

            .rx {
              min-height: 130px;
              font-size: 15px;
            }

            .footer {
              margin-top: 55px;
              display: flex;
              justify-content:
                space-between;
              align-items:
                flex-end;
              gap: 30px;
            }

            .clinic-footer {
              max-width: 55%;
              font-size: 11px;
              color: #6b7280;
              line-height: 1.5;
              white-space: pre-wrap;
            }

            .signature {
              width: 220px;
              border-top:
                1px solid #172033;
              padding-top: 7px;
              text-align: center;
              font-size: 13px;
            }

            .no-print {
              margin-bottom: 15px;
              text-align: right;
            }

            .print-btn {
              padding: 9px 18px;
              border: 0;
              border-radius: 6px;
              background: ${escapeHtml(
                clinic.primary_color
              )};
              color: white;
              cursor: pointer;
            }

            @media print {
              .no-print {
                display: none;
              }

              .sheet {
                border: 0;
                padding: 0;
              }
            }
          </style>
        </head>

        <body>
          <div class="no-print">
            <button
              class="print-btn"
              onclick="window.print()"
            >
              Print Prescription
            </button>
          </div>

          <div class="sheet">
            <div class="header">
              ${logoHtml}

              <h1>
                ${escapeHtml(
                  clinic.clinic_name
                )}
              </h1>

              <p>
                Dental Prescription /
                Treatment Record
              </p>

              ${
                clinicContact
                  ? `
                    <div class="clinic-contact">
                      ${clinicContact}
                    </div>
                  `
                  : ""
              }

              ${
                clinic.registration_no
                  ? `
                    <div class="registration">
                      Registration No:
                      ${escapeHtml(
                        clinic.registration_no
                      )}
                    </div>
                  `
                  : ""
              }
            </div>

            <div class="meta">
              <div>
                <span class="label">
                  Patient:
                </span>

                <span>
                  ${escapeHtml(
                    item.patient_name
                  )}
                </span>
              </div>

              <div>
                <span class="label">
                  Patient ID:
                </span>

                <span>
                  ${escapeHtml(
                    item.patient_code
                  )}
                </span>
              </div>

              <div>
                <span class="label">
                  Age:
                </span>

                <span>
                  ${age}
                </span>
              </div>

              <div>
                <span class="label">
                  Date:
                </span>

                <span>
                  ${escapeHtml(
                    dateOnly(
                      item.treatment_date
                    )
                  )}
                </span>
              </div>

              <div>
                <span class="label">
                  Doctor:
                </span>

                <span>
                  ${escapeHtml(
                    item.doctor_name ||
                      "—"
                  )}
                </span>
              </div>

              <div>
                <span class="label">
                  Tooth:
                </span>

                <span>
                  ${escapeHtml(
                    item.tooth_no ||
                      "—"
                  )}
                </span>
              </div>
            </div>

            <div class="section">
              <h3>Diagnosis</h3>

              <div class="box">
                ${escapeHtml(
                  item.diagnosis ||
                    "—"
                )}
              </div>
            </div>

            <div class="section">
              <h3>
                Treatment /
                Procedure
              </h3>

              <div class="box">
                ${escapeHtml(
                  item.procedure ||
                    "—"
                )}
              </div>
            </div>

            <div class="section">
              <h3>
                Rx / Prescription
              </h3>

              <div class="box rx">
                ${escapeHtml(
                  item.prescription ||
                    "—"
                )}
              </div>
            </div>

            ${
              item.clinical_notes
                ? `
                  <div class="section">
                    <h3>
                      Clinical Notes
                    </h3>

                    <div class="box">
                      ${escapeHtml(
                        item.clinical_notes
                      )}
                    </div>
                  </div>
                `
                : ""
            }

            <div class="footer">
              <div class="clinic-footer">
                ${escapeHtml(
                  clinic.prescription_footer ||
                    ""
                )}
              </div>

              <div class="signature">
                ${escapeHtml(
                  item.doctor_name ||
                    "Doctor"
                )}

                <br />

                Doctor Signature
              </div>
            </div>
          </div>
        </body>
      </html>
    `);

    win.document.close();
    win.focus();
  }

  return (
    <Page
      title="Treatments"
      subtitle="Clinical notes, procedures and prescriptions"
      action={
        <button
          className="btn primary"
          onClick={openAdd}
        >
          <Plus size={18} />
          Add Treatment
        </button>
      }
    >
      <Notice
        notice={notice}
        onClose={() =>
          setNotice(null)
        }
      />

      <div className="table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Tooth</th>
                <th>Procedure</th>
                <th>Fee</th>

                <th className="actions-col">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <TableMessage
                  columns={7}
                  text="Loading treatments..."
                />
              ) : treatments.length === 0 ? (
                <TableMessage
                  columns={7}
                  text="No treatment records found."
                />
              ) : (
                treatments.map(
                  (item) => (
                    <tr key={item.id}>
                      <td>
                        {dateOnly(
                          item.treatment_date
                        )}
                      </td>

                      <td>
                        <strong>
                          {item.patient_name}
                        </strong>

                        <small className="subtext">
                          {item.patient_code}
                        </small>
                      </td>

                      <td>
                        {item.doctor_name ||
                          "—"}
                      </td>

                      <td>
                        {item.tooth_no ||
                          "—"}
                      </td>

                      <td>
                        {item.procedure ||
                          "—"}
                      </td>

                      <td>
                        {money(item.fee)}
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn small secondary"
                            onClick={() =>
                              printPrescription(
                                item
                              )
                            }
                          >
                            <Printer
                              size={15}
                            />
                            Print
                          </button>

                          <button
                            className="btn small secondary"
                            onClick={() =>
                              openEdit(item)
                            }
                          >
                            <Pencil
                              size={15}
                            />
                            Edit
                          </button>

                          <button
                            className="btn small danger"
                            onClick={() =>
                              remove(item)
                            }
                          >
                            <Trash2
                              size={15}
                            />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <Modal
          title={
            editing
              ? "Edit Treatment"
              : "Add Treatment"
          }
          onClose={() =>
            setShowForm(false)
          }
          wide
        >
          <form onSubmit={save}>
            <div className="form-grid">
              <Field
                label="Patient *"
                full
              >
                <SearchablePatient
                  patients={patients}
                  value={form.patient_id}
                  onChange={(id) =>
                    setForm({
                      ...form,
                      patient_id: id,
                    })
                  }
                />
              </Field>

              <Field label="Treatment Date *">
                <input
                  type="date"
                  value={
                    form.treatment_date
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      treatment_date:
                        e.target.value,
                    })
                  }
                  required
                />
              </Field>

              <Field label="Patient Age">
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={
                    form.patient_age
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      patient_age:
                        e.target.value,
                    })
                  }
                  placeholder="e.g. 32"
                />
              </Field>

              <Field label="Doctor Name">
                <input
                  value={
                    form.doctor_name
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      doctor_name:
                        e.target.value,
                    })
                  }
                  placeholder="Doctor name"
                />
              </Field>

              <Field label="Tooth No.">
                <input
                  value={
                    form.tooth_no
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tooth_no:
                        e.target.value,
                    })
                  }
                  placeholder="e.g. 16 / UR6"
                />
              </Field>

              <Field
                label="Diagnosis"
                full
              >
                <textarea
                  rows="3"
                  value={
                    form.diagnosis
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      diagnosis:
                        e.target.value,
                    })
                  }
                />
              </Field>

              <Field
                label="Procedure / Treatment *"
                full
              >
                <textarea
                  rows="3"
                  value={
                    form.procedure
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      procedure:
                        e.target.value,
                    })
                  }
                  required
                />
              </Field>

              <Field
                label="Prescription"
                full
              >
                <textarea
                  rows="4"
                  value={
                    form.prescription
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      prescription:
                        e.target.value,
                    })
                  }
                  placeholder="Medicines, dosage and instructions..."
                />
              </Field>

              <Field
                label="Clinical Notes"
                full
              >
                <textarea
                  rows="4"
                  value={
                    form.clinical_notes
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      clinical_notes:
                        e.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Fee (PKR)">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.fee}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      fee:
                        e.target.value,
                    })
                  }
                />
              </Field>
            </div>

            <FormActions
              onCancel={() =>
                setShowForm(false)
              }
              busy={saving}
              text={
                editing
                  ? "Update Treatment"
                  : "Save Treatment"
              }
            />
          </form>
        </Modal>
      )}
    </Page>
  );
}/* =========================================================
   BILLING
========================================================= */

function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [patients, setPatients] = useState([]);

  const [tab, setTab] = useState("active");

  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);

  const [invoiceModal, setInvoiceModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  const [paymentModal, setPaymentModal] = useState(false);

  const [invoiceForm, setInvoiceForm] = useState({
    patient_id: "",
    total: "",
    discount: "0",
    notes: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    invoice_id: "",
    amount: "",
    method: "cash",
    reference: "",
  });

  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const [i, p, py] = await Promise.all([
        api.get("/billing"),
        api.get("/patients"),
        api.get("/billing/payments"),
      ]);

      setInvoices(i.data);
      setPatients(p.data);
      setPayments(py.data);
    } catch (err) {
      setNotice({
        type: "error",
        message: getError(err),
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const activeInvoices = invoices.filter(
    (i) => i.status !== "paid"
  );

  const paidInvoices = invoices.filter(
    (i) => i.status === "paid"
  );

  const displayed =
    tab === "active"
      ? activeInvoices
      : paidInvoices;

  function newInvoice() {
    /*
     * Important:
     * Close payment modal before opening invoice modal.
     * This prevents the old double-modal problem.
     */
    setPaymentModal(false);
    setEditingInvoice(null);

    setInvoiceForm({
      patient_id: "",
      total: "",
      discount: "0",
      notes: "",
    });

    setInvoiceModal(true);
  }

  function editInvoice(invoice) {
    setPaymentModal(false);
    setEditingInvoice(invoice);

    setInvoiceForm({
      patient_id: invoice.patient_id,
      total: invoice.total,
      discount: invoice.discount || 0,
      notes: invoice.notes || "",
    });

    setInvoiceModal(true);
  }

  async function saveInvoice(e) {
    e.preventDefault();

    setSaving(true);

    try {
      let response;

      if (editingInvoice) {
        response = await api.put(
          `/billing/invoice/${editingInvoice.id}`,
          {
            total: invoiceForm.total,
            discount: invoiceForm.discount,
            notes: invoiceForm.notes,
          }
        );
      } else {
        response = await api.post(
          "/billing/invoice",
          {
            patient_id:
              invoiceForm.patient_id,

            total:
              invoiceForm.total,

            discount:
              invoiceForm.discount,

            notes:
              invoiceForm.notes,
          }
        );
      }

      setNotice({
        type: "success",
        message: response.data.message,
      });

      setInvoiceModal(false);
      setEditingInvoice(null);

      await load();
    } catch (err) {
      setNotice({
        type: "error",
        message: getError(err),
      });
    } finally {
      setSaving(false);
    }
  }

  function receivePayment(invoice = null) {
    /*
     * Mutually exclusive modals.
     */
    setInvoiceModal(false);
    setEditingInvoice(null);

    setPaymentForm({
      invoice_id: invoice?.id || "",
      amount: invoice?.balance || "",
      method: "cash",
      reference: "",
    });

    setPaymentModal(true);
  }

  async function savePayment(e) {
    e.preventDefault();

    setSaving(true);

    try {
      const { data } = await api.post(
        "/billing/payment",
        paymentForm
      );

      setNotice({
        type: "success",
        message: data.message,
      });

      setPaymentModal(false);

      await load();
    } catch (err) {
      setNotice({
        type: "error",
        message: getError(err),
      });
    } finally {
      setSaving(false);
    }
  }

  async function deleteInvoice(invoice) {
    const paid = Number(
      invoice.paid || 0
    );

    const warning =
      paid > 0
        ? `Delete ${invoice.invoice_no}?\n\nThis invoice has ${money(
            paid
          )} payment history. Deleting the invoice will ALSO permanently delete its payment records.\n\nPatient record will remain safe.`
        : `Delete ${invoice.invoice_no}?\n\nNo payment has been received. This unpaid invoice will be permanently removed.\n\nPatient record will remain safe.`;

    if (!window.confirm(warning)) {
      return;
    }

    if (
      paid > 0 &&
      !window.confirm(
        "This invoice contains payment history. Are you absolutely sure?"
      )
    ) {
      return;
    }

    try {
      const { data } = await api.delete(
        `/billing/invoice/${invoice.id}`
      );

      setNotice({
        type: "success",
        message: data.message,
      });

      await load();
    } catch (err) {
      setNotice({
        type: "error",
        message: getError(err),
      });
    }
  }

  async function deletePayment(payment) {
    if (
      !window.confirm(
        `Delete payment of ${money(
          payment.amount
        )} from ${
          payment.patient_name
        }?\n\nInvoice balance and status will be recalculated automatically.`
      )
    ) {
      return;
    }

    try {
      const { data } = await api.delete(
        `/billing/payment/${payment.id}`
      );

      setNotice({
        type: "success",
        message: data.message,
      });

      await load();
    } catch (err) {
      setNotice({
        type: "error",
        message: getError(err),
      });
    }
  }

  return (
    <Page
      title="Billing"
      subtitle="Invoices, payments and outstanding balances"
      action={
        <div className="header-actions">
          <button
            className="btn secondary"
            onClick={() =>
              receivePayment()
            }
          >
            <WalletCards size={18} />
            Receive Payment
          </button>

          <button
            className="btn primary"
            onClick={newInvoice}
          >
            <Plus size={18} />
            New Invoice
          </button>
        </div>
      }
    >
      <Notice
        notice={notice}
        onClose={() =>
          setNotice(null)
        }
      />

      <div className="billing-summary">
        <div>
          <span>Outstanding</span>

          <strong>
            {money(
              activeInvoices.reduce(
                (sum, item) =>
                  sum +
                  Number(
                    item.balance || 0
                  ),
                0
              )
            )}
          </strong>
        </div>

        <div>
          <span>
            Total Received
          </span>

          <strong>
            {money(
              payments.reduce(
                (sum, item) =>
                  sum +
                  Number(
                    item.amount || 0
                  ),
                0
              )
            )}
          </strong>
        </div>

        <div>
          <span>
            Unpaid / Partial Bills
          </span>

          <strong>
            {activeInvoices.length}
          </strong>
        </div>
      </div>

      <div className="tabs">
        <button
          className={
            tab === "active"
              ? "active"
              : ""
          }
          onClick={() =>
            setTab("active")
          }
        >
          Active Bills
        </button>

        <button
          className={
            tab === "paid"
              ? "active"
              : ""
          }
          onClick={() =>
            setTab("paid")
          }
        >
          Paid History
        </button>
      </div>

      <div className="table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Patient</th>
                <th>Total</th>
                <th>Discount</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>

                <th className="actions-col">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <TableMessage
                  columns={8}
                  text="Loading billing..."
                />
              ) : displayed.length ===
                0 ? (
                <TableMessage
                  columns={8}
                  text={
                    tab === "active"
                      ? "No active bills."
                      : "No paid invoices yet."
                  }
                />
              ) : (
                displayed.map(
                  (invoice) => (
                    <tr
                      key={invoice.id}
                    >
                      <td>
                        <span className="code">
                          {
                            invoice.invoice_no
                          }
                        </span>

                        <small className="subtext">
                          {dateOnly(
                            invoice.invoice_date
                          )}
                        </small>
                      </td>

                      <td>
                        {
                          invoice.patient_name
                        }
                      </td>

                      <td>
                        {money(
                          invoice.total
                        )}
                      </td>

                      <td>
                        {money(
                          invoice.discount
                        )}
                      </td>

                      <td>
                        {money(
                          invoice.paid
                        )}
                      </td>

                      <td>
                        <strong>
                          {money(
                            invoice.balance
                          )}
                        </strong>
                      </td>

                      <td>
                        <StatusBadge
                          status={
                            invoice.status
                          }
                        />
                      </td>

                      <td>
                        <div className="action-buttons">
                          {Number(
                            invoice.balance
                          ) > 0 && (
                            <button
                              className="btn small primary"
                              onClick={() =>
                                receivePayment(
                                  invoice
                                )
                              }
                            >
                              Pay
                            </button>
                          )}

                          <button
                            className="btn small secondary"
                            onClick={() =>
                              editInvoice(
                                invoice
                              )
                            }
                          >
                            <Pencil
                              size={15}
                            />
                            Edit
                          </button>

                          <button
                            className="btn small danger"
                            onClick={() =>
                              deleteInvoice(
                                invoice
                              )
                            }
                          >
                            <Trash2
                              size={15}
                            />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section-heading">
        <div>
          <h2>
            <History size={20} />
            Payment History
          </h2>

          <p>
            Received payments can
            be corrected if entered
            by mistake.
          </p>
        </div>
      </div>

      <div className="table-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice</th>
                <th>Patient</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Status</th>

                <th className="actions-col">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {payments.length ===
              0 ? (
                <TableMessage
                  columns={8}
                  text="No payments recorded."
                />
              ) : (
                payments.map(
                  (payment) => (
                    <tr
                      key={payment.id}
                    >
                      <td>
                        {dateTime(
                          payment.paid_at
                        )}
                      </td>

                      <td>
                        <span className="code">
                          {
                            payment.invoice_no
                          }
                        </span>
                      </td>

                      <td>
                        <strong>
                          {
                            payment.patient_name
                          }
                        </strong>
                      </td>

                      <td>
                        <strong>
                          {money(
                            payment.amount
                          )}
                        </strong>
                      </td>

                      <td className="capitalize">
                        {payment.method ||
                          "cash"}
                      </td>

                      <td>
                        {payment.reference ||
                          "—"}
                      </td>

                      <td>
                        <span className="badge paid">
                          <CheckCircle2
                            size={12}
                          />
                          Paid
                        </span>
                      </td>

                      <td>
                        <button
                          className="btn small danger"
                          onClick={() =>
                            deletePayment(
                              payment
                            )
                          }
                        >
                          <Trash2
                            size={15}
                          />
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {invoiceModal && (
        <Modal
          title={
            editingInvoice
              ? "Edit Invoice"
              : "New Invoice"
          }
          onClose={() => {
            setInvoiceModal(false);
            setEditingInvoice(null);
          }}
        >
          <form
            onSubmit={saveInvoice}
          >
            {!editingInvoice && (
              <Field label="Patient *">
                <SearchablePatient
                  patients={patients}
                  value={
                    invoiceForm.patient_id
                  }
                  onChange={(id) =>
                    setInvoiceForm({
                      ...invoiceForm,
                      patient_id: id,
                    })
                  }
                />
              </Field>
            )}

            {editingInvoice && (
              <div className="selected-info">
                <span>Patient</span>

                <strong>
                  {
                    editingInvoice.patient_name
                  }
                </strong>
              </div>
            )}

            <Field label="Invoice Total (PKR) *">
              <input
                type="number"
                min="1"
                step="1"
                value={
                  invoiceForm.total
                }
                onChange={(e) =>
                  setInvoiceForm({
                    ...invoiceForm,
                    total:
                      e.target.value,
                  })
                }
                required
              />
            </Field>

            <Field label="Discount (PKR)">
              <input
                type="number"
                min="0"
                step="1"
                value={
                  invoiceForm.discount
                }
                onChange={(e) =>
                  setInvoiceForm({
                    ...invoiceForm,
                    discount:
                      e.target.value,
                  })
                }
              />
            </Field>

            <Field label="Notes">
              <textarea
                rows="3"
                value={
                  invoiceForm.notes
                }
                onChange={(e) =>
                  setInvoiceForm({
                    ...invoiceForm,
                    notes:
                      e.target.value,
                  })
                }
              />
            </Field>

            <FormActions
              onCancel={() => {
                setInvoiceModal(false);
                setEditingInvoice(null);
              }}
              busy={saving}
              text={
                editingInvoice
                  ? "Update Invoice"
                  : "Create Invoice"
              }
            />
          </form>
        </Modal>
      )}

      {paymentModal && (
        <Modal
          title="Receive Payment"
          onClose={() =>
            setPaymentModal(false)
          }
        >
          <form
            onSubmit={savePayment}
          >
            <Field label="Outstanding Invoice *">
              <select
                value={
                  paymentForm.invoice_id
                }
                onChange={(e) => {
                  const id =
                    e.target.value;

                  const invoice =
                    activeInvoices.find(
                      (x) =>
                        x.id === id
                    );

                  setPaymentForm({
                    ...paymentForm,
                    invoice_id: id,

                    amount:
                      invoice?.balance ||
                      "",
                  });
                }}
                required
              >
                <option value="">
                  Select invoice
                </option>

                {activeInvoices.map(
                  (invoice) => (
                    <option
                      key={
                        invoice.id
                      }
                      value={
                        invoice.id
                      }
                    >
                      {
                        invoice.invoice_no
                      }{" "}
                      —{" "}
                      {
                        invoice.patient_name
                      }{" "}
                      — Balance{" "}
                      {money(
                        invoice.balance
                      )}
                    </option>
                  )
                )}
              </select>
            </Field>

            <Field label="Amount (PKR) *">
              <input
                type="number"
                min="1"
                step="1"
                value={
                  paymentForm.amount
                }
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    amount:
                      e.target.value,
                  })
                }
                required
              />
            </Field>

            <Field label="Payment Method">
              <select
                value={
                  paymentForm.method
                }
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    method:
                      e.target.value,
                  })
                }
              >
                <option value="cash">
                  Cash
                </option>

                <option value="card">
                  Card
                </option>

                <option value="bank">
                  Bank Transfer
                </option>

                <option value="easypaisa">
                  Easypaisa
                </option>

                <option value="jazzcash">
                  JazzCash
                </option>

                <option value="other">
                  Other
                </option>
              </select>
            </Field>

            <Field label="Reference / Transaction ID">
              <input
                value={
                  paymentForm.reference
                }
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    reference:
                      e.target.value,
                  })
                }
              />
            </Field>

            <FormActions
              onCancel={() =>
                setPaymentModal(false)
              }
              busy={saving}
              text="Receive Payment"
            />
          </form>
        </Modal>
      )}
    </Page>
  );
}

/* =========================================================
   SUPER ADMIN — CLINICS
========================================================= */

const emptyClinic = {
  clinic_name: "",
  clinic_code: "",
  owner_name: "",
  email: "",
  phone: "",
  address: "",
  logo_url: "",

  primary_color:
    "#0e7f86",

  secondary_color:
    "#7edbd7",

  currency: "PKR",

  timezone:
    "Asia/Karachi",

  plan: "standard",

  subscription_status:
    "active",

  active: true,
};

/*
 * getStoredUser() already exists in Part 1.
 * DO NOT add another copy here.
 */

function SuperAdminGuard({
  children,
}) {
  const user =
    getStoredUser();

  if (
    user.system_role !==
    "super_admin"
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return children;
}

/* =========================================================
   ADMIN CLINICS LIST
========================================================= */

function AdminClinics() {
  const navigate =
    useNavigate();

  const [clinics, setClinics] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [showForm, setShowForm] =
    useState(false);

  const [form, setForm] =
    useState(emptyClinic);

  const [notice, setNotice] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const pageSize = 10;

  async function load(q = "") {
    try {
      setLoading(true);

      const { data } =
        await api.get(
          "/admin/clinics",
          {
            params: {
              search: q,
            },
          }
        );

      setClinics(data);
    } catch (err) {
      setNotice({
        type: "error",
        message:
          getError(err),
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer =
      setTimeout(
        () => load(search),
        250
      );

    return () =>
      clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        clinics.length /
          pageSize
      )
    );

  const rows =
    clinics.slice(
      (page - 1) *
        pageSize,

      page * pageSize
    );

  async function save(e) {
    e.preventDefault();

    try {
      setSaving(true);

      const { data } =
        await api.post(
          "/admin/clinics",
          form
        );

      setNotice({
        type: "success",
        message:
          data.message,
      });

      setShowForm(false);

      setForm(
        emptyClinic
      );

      await load(search);
    } catch (err) {
      setNotice({
        type: "error",
        message:
          getError(err),
      });
    } finally {
      setSaving(false);
    }
  }

  function openNewClinic() {
    setForm({
      ...emptyClinic,
    });

    setShowForm(true);
  }

  return (
    <SuperAdminGuard>
      <Page
        title="Clinics"
        subtitle="Manage customer clinics and subscriptions"
        action={
          <button
            className="btn primary"
            onClick={
              openNewClinic
            }
          >
            <Plus size={18} />
            New Clinic
          </button>
        }
      >
        <Notice
          notice={notice}
          onClose={() =>
            setNotice(null)
          }
        />

        <div className="toolbar">
          <div className="search-box">
            <Search size={18} />

            <input
              placeholder="Search clinic, code, owner, email or phone..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />
          </div>
        </div>

        <div className="table-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Clinic</th>
                  <th>Code</th>
                  <th>Owner</th>
                  <th>Users</th>
                  <th>Patients</th>
                  <th>Plan</th>
                  <th>Status</th>

                  <th className="actions-col">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <TableMessage
                    columns={8}
                    text="Loading clinics..."
                  />
                ) : rows.length ===
                  0 ? (
                  <TableMessage
                    columns={8}
                    text="No clinics found."
                  />
                ) : (
                  rows.map(
                    (clinic) => (
                      <tr
                        key={
                          clinic.id
                        }
                      >
                        <td>
                          <strong>
                            {
                              clinic.clinic_name
                            }
                          </strong>

                          <small className="subtext">
                            {clinic.email ||
                              "No email"}
                          </small>
                        </td>

                        <td>
                          <span className="code">
                            {
                              clinic.clinic_code
                            }
                          </span>
                        </td>

                        <td>
                          {clinic.owner_name ||
                            "—"}
                        </td>

                        <td>
                          {clinic.users_count ??
                            0}
                        </td>

                        <td>
                          {clinic.patients_count ??
                            0}
                        </td>

                        <td className="capitalize">
                          {clinic.plan ||
                            "standard"}
                        </td>

                        <td>
                          <span
                            className={`badge ${
                              clinic.active
                                ? "paid"
                                : "cancelled"
                            }`}
                          >
                            {clinic.active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td>
                          <button
                            className="btn small secondary"
                            onClick={() =>
                              navigate(
                                `/admin/clinics/${clinic.id}`
                              )
                            }
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>

          {clinics.length >
            pageSize && (
            <div className="pagination">
              <button
                className="btn small secondary"
                disabled={
                  page <= 1
                }
                onClick={() =>
                  setPage(
                    (p) =>
                      Math.max(
                        1,
                        p - 1
                      )
                  )
                }
              >
                <ChevronLeft
                  size={16}
                />
                Previous
              </button>

              <span>
                Page {page} of{" "}
                {totalPages}
              </span>

              <button
                className="btn small secondary"
                disabled={
                  page >=
                  totalPages
                }
                onClick={() =>
                  setPage(
                    (p) =>
                      Math.min(
                        totalPages,
                        p + 1
                      )
                  )
                }
              >
                Next
                <ChevronRight
                  size={16}
                />
              </button>
            </div>
          )}
        </div>

        {showForm && (
          <Modal
            title="New Clinic"
            onClose={() =>
              setShowForm(false)
            }
            wide
          >
            <form
              onSubmit={save}
            >
              <div className="form-grid">
                <Field label="Clinic Name *">
                  <input
                    value={
                      form.clinic_name
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        clinic_name:
                          e.target
                            .value,
                      })
                    }
                    required
                  />
                </Field>

                <Field label="Clinic Code *">
                  <input
                    value={
                      form.clinic_code
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        clinic_code:
                          e.target
                            .value,
                      })
                    }
                    placeholder="e.g. ABC01"
                    required
                  />
                </Field>

                <Field label="Owner Name">
                  <input
                    value={
                      form.owner_name
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        owner_name:
                          e.target
                            .value,
                      })
                    }
                  />
                </Field>

                <Field label="Email">
                  <input
                    type="email"
                    value={
                      form.email
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        email:
                          e.target
                            .value,
                      })
                    }
                  />
                </Field>

                <Field label="Phone">
                  <input
                    value={
                      form.phone
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        phone:
                          e.target
                            .value,
                      })
                    }
                  />
                </Field>

                <Field label="Plan">
                  <select
                    value={
                      form.plan
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        plan:
                          e.target
                            .value,
                      })
                    }
                  >
                    <option value="standard">
                      Standard
                    </option>

                    <option value="premium">
                      Premium
                    </option>

                    <option value="owner">
                      Owner
                    </option>
                  </select>
                </Field>

                <Field
                  label="Address"
                  full
                >
                  <textarea
                    rows="3"
                    value={
                      form.address
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        address:
                          e.target
                            .value,
                      })
                    }
                  />
                </Field>
              </div>

              <FormActions
                onCancel={() =>
                  setShowForm(
                    false
                  )
                }
                busy={saving}
                text="Create Clinic"
              />
            </form>
          </Modal>
        )}
      </Page>
    </SuperAdminGuard>
  );
}/* =========================================================
   SUPER ADMIN — CLINIC DETAILS + BRANDING
========================================================= */

const emptyClinicConfiguration = {
  clinic_name: "",
  owner_name: "",
  email: "",
  phone: "",
  address: "",
  website: "",
  registration_no: "",
  logo_url: "",

  primary_color: "#0e7f86",
  secondary_color: "#7edbd7",
  accent_color: "#14a3a8",

  text_color: "#172033",
  muted_text_color: "#64748b",

  sidebar_color: "#071f25",
  sidebar_active_color: "#7edbd7",
  sidebar_text_color: "#ffffff",
  sidebar_active_text_color: "#071f25",

  page_background_color: "#f4fafb",
  card_background_color: "#ffffff",
  table_header_color: "#f8fafc",

  primary_button_color: "#0e7f86",
  secondary_button_color: "#ffffff",
  danger_button_color: "#dc2626",
  primary_button_text_color: "#ffffff",
  secondary_button_text_color: "#172033",
  danger_button_text_color: "#ffffff",

  success_color: "#16a34a",
  warning_color: "#d97706",
  error_color: "#dc2626",
  info_color: "#0284c7",
  success_text_color: "#ffffff",
  warning_text_color: "#ffffff",
  error_text_color: "#ffffff",
  info_text_color: "#ffffff",

  paid_color: "#16a34a",
  partial_color: "#d97706",
  unpaid_color: "#dc2626",
  paid_text_color: "#ffffff",
  partial_text_color: "#ffffff",
  unpaid_text_color: "#ffffff",

  scheduled_color: "#64748b",
  confirmed_color: "#0284c7",
  completed_color: "#16a34a",
  cancelled_color: "#dc2626",
  no_show_color: "#7c3aed",
  scheduled_text_color: "#ffffff",
  confirmed_text_color: "#ffffff",
  completed_text_color: "#ffffff",
  cancelled_text_color: "#ffffff",
  no_show_text_color: "#ffffff",

  input_focus_color: "#14a3a8",
  modal_accent_color: "#0e7f86",

  welcome_gradient_start: "#071f25",
  welcome_gradient_end: "#14a3a8",
  welcome_text_color: "#ffffff",

  currency: "PKR",
  timezone: "Asia/Karachi",

  receipt_footer: "",
  prescription_footer: "",
};

const clinicThemeFields = [
  ["Brand Colors", [
    ["primary_color", "Primary brand", "Main clinic brand color"],
    ["secondary_color", "Secondary brand", "Supporting brand color"],
    ["accent_color", "Accent", "Highlights and small accents"],
  ]],
  ["General Text", [
    ["text_color", "Main text", "Headings, labels and normal content"],
    ["muted_text_color", "Muted text", "Subtitles, hints and secondary text"],
  ]],
  ["Sidebar & Navigation", [
    ["sidebar_color", "Sidebar background", "Main navigation background"],
    ["sidebar_text_color", "Sidebar text", "Normal navigation text and icons"],
    ["sidebar_active_color", "Active menu background", "Selected page background"],
    ["sidebar_active_text_color", "Active menu text", "Selected page text and icons"],
  ]],
  ["Page & Surfaces", [
    ["page_background_color", "Page background", "Background behind all content"],
    ["card_background_color", "Cards", "Dashboard cards and panels"],
    ["table_header_color", "Table headers", "Header row of tables"],
  ]],
  ["Buttons", [
    ["primary_button_color", "Primary button", "Save, Add and main action background"],
    ["primary_button_text_color", "Primary button text", "Text and icons on primary buttons"],
    ["secondary_button_color", "Secondary button", "Cancel and secondary action background"],
    ["secondary_button_text_color", "Secondary button text", "Text and icons on secondary buttons"],
    ["danger_button_color", "Delete button", "Delete and destructive action background"],
    ["danger_button_text_color", "Delete button text", "Text and icons on Delete buttons"],
  ]],
  ["Notifications", [
    ["success_color", "Success", "Successful action background/accent"],
    ["success_text_color", "Success text", "Text on success messages"],
    ["warning_color", "Warning", "Warning background/accent"],
    ["warning_text_color", "Warning text", "Text on warning messages"],
    ["error_color", "Error", "Error background/accent"],
    ["error_text_color", "Error text", "Text on error messages"],
    ["info_color", "Information", "Information background/accent"],
    ["info_text_color", "Information text", "Text on information messages"],
  ]],
  ["Billing Status", [
    ["paid_color", "Paid", "Paid invoice badge background"],
    ["paid_text_color", "Paid text", "Paid badge text"],
    ["partial_color", "Partial", "Partially paid badge background"],
    ["partial_text_color", "Partial text", "Partial badge text"],
    ["unpaid_color", "Unpaid", "Unpaid badge background"],
    ["unpaid_text_color", "Unpaid text", "Unpaid badge text"],
  ]],
  ["Appointment Status", [
    ["scheduled_color", "Scheduled", "Scheduled appointment background"],
    ["scheduled_text_color", "Scheduled text", "Scheduled status text"],
    ["confirmed_color", "Confirmed", "Confirmed appointment background"],
    ["confirmed_text_color", "Confirmed text", "Confirmed status text"],
    ["completed_color", "Completed", "Completed appointment background"],
    ["completed_text_color", "Completed text", "Completed status text"],
    ["cancelled_color", "Cancelled", "Cancelled appointment background"],
    ["cancelled_text_color", "Cancelled text", "Cancelled status text"],
    ["no_show_color", "No-show", "No-show appointment background"],
    ["no_show_text_color", "No-show text", "No-show status text"],
  ]],
  ["Forms & Modals", [
    ["input_focus_color", "Input focus", "Focused form field"],
    ["modal_accent_color", "Modal accent", "Popup and dialog accent"],
  ]],
  ["Welcome Banner", [
    ["welcome_gradient_start", "Gradient start", "Left/start side of welcome banner"],
    ["welcome_gradient_end", "Gradient end", "Right/end side of welcome banner"],
    ["welcome_text_color", "Welcome text", "Text shown on welcome banner"],
  ]],
];

const themePresets = [
  {
    name: "Dental Teal",
    colors: {
      primary_color: "#0e7f86",
      secondary_color: "#7edbd7",
      accent_color: "#14a3a8",
      sidebar_color: "#071f25",
      sidebar_active_color: "#7edbd7",
      primary_button_color: "#0e7f86",
      input_focus_color: "#14a3a8",
      modal_accent_color: "#0e7f86",
      welcome_gradient_start: "#071f25",
      welcome_gradient_end: "#14a3a8",
    },
  },
  {
    name: "Ocean Blue",
    colors: {
      primary_color: "#075985",
      secondary_color: "#bae6fd",
      accent_color: "#0284c7",
      sidebar_color: "#082f49",
      sidebar_active_color: "#7dd3fc",
      primary_button_color: "#0369a1",
      input_focus_color: "#0284c7",
      modal_accent_color: "#075985",
      welcome_gradient_start: "#082f49",
      welcome_gradient_end: "#0284c7",
    },
  },
  {
    name: "Royal Purple",
    colors: {
      primary_color: "#6d28d9",
      secondary_color: "#ddd6fe",
      accent_color: "#8b5cf6",
      sidebar_color: "#2e1065",
      sidebar_active_color: "#c4b5fd",
      primary_button_color: "#7c3aed",
      input_focus_color: "#8b5cf6",
      modal_accent_color: "#6d28d9",
      welcome_gradient_start: "#2e1065",
      welcome_gradient_end: "#7c3aed",
    },
  },
  {
    name: "Emerald",
    colors: {
      primary_color: "#047857",
      secondary_color: "#a7f3d0",
      accent_color: "#10b981",
      sidebar_color: "#022c22",
      sidebar_active_color: "#6ee7b7",
      primary_button_color: "#059669",
      input_focus_color: "#10b981",
      modal_accent_color: "#047857",
      welcome_gradient_start: "#022c22",
      welcome_gradient_end: "#059669",
    },
  },
  {
    name: "Warm Gold",
    colors: {
      primary_color: "#92400e",
      secondary_color: "#fde68a",
      accent_color: "#d97706",
      sidebar_color: "#451a03",
      sidebar_active_color: "#fcd34d",
      primary_button_color: "#b45309",
      input_focus_color: "#d97706",
      modal_accent_color: "#92400e",
      welcome_gradient_start: "#451a03",
      welcome_gradient_end: "#b45309",
    },
  },
];

function clinicToConfiguration(clinic = {}) {
  const result = { ...emptyClinicConfiguration };

  Object.keys(result).forEach((key) => {
    const value = clinic?.[key];
    if (value !== undefined && value !== null && value !== "") {
      result[key] = value;
    }
  });

  return result;
}

function ThemeColorControl({
  label,
  help,
  field,
  value,
  onChange,
}) {
  const valid =
    /^#[0-9A-Fa-f]{6}$/.test(value || "");

  return (
    <label className="theme-color-control">
      <span className="theme-color-copy">
        <strong>{label}</strong>
        <small>{help}</small>
      </span>

      <span className="theme-color-inputs">
        <input
          type="color"
          value={valid ? value : "#000000"}
          onChange={(e) =>
            onChange(field, e.target.value)
          }
          aria-label={`${label} color picker`}
        />

        <input
          value={value}
          maxLength={7}
          onChange={(e) =>
            onChange(field, e.target.value)
          }
          placeholder="#000000"
          aria-label={`${label} hex color`}
        />
      </span>
    </label>
  );
}

function AdminClinicDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [clinic, setClinic] = useState(null);
  const [users, setUsers] = useState([]);

  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showUser, setShowUser] = useState(false);

  const [showConfiguration, setShowConfiguration] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [userForm, setUserForm] = useState({
    full_name: "",
    email: "",
    password: "",
    system_role: "clinic_admin",
    job_role: "owner",
    phone: "",
    active: true,
  });

  const [
    configurationForm,
    setConfigurationForm,
  ] = useState(
    emptyClinicConfiguration
  );

  async function load() {
    try {
      setLoading(true);

      const { data } = await api.get(
        `/admin/clinics/${id}`
      );

      setClinic(data.clinic);

      setUsers(
        data.users || []
      );

      if (data.clinic) {
        setConfigurationForm(
          clinicToConfiguration(data.clinic)
        );
      }
    } catch (err) {
      setNotice({
        type: "error",
        message:
          getError(err),
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  function openConfiguration() {
    if (!clinic) return;

    setConfigurationForm(
      clinicToConfiguration(clinic)
    );

    setShowConfiguration(true);
  }

  function updateThemeColor(field, value) {
    setConfigurationForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function applyThemePreset(colors) {
    setConfigurationForm((current) => ({
      ...current,
      ...colors,
    }));
  }

  function resetTheme() {
    setConfigurationForm((current) => ({
      ...current,
      ...clinicToConfiguration({}),
      clinic_name: current.clinic_name,
      owner_name: current.owner_name,
      email: current.email,
      phone: current.phone,
      address: current.address,
      website: current.website,
      registration_no: current.registration_no,
      logo_url: current.logo_url,
      currency: current.currency,
      timezone: current.timezone,
      receipt_footer: current.receipt_footer,
      prescription_footer: current.prescription_footer,
    }));
  }

  async function saveConfiguration(e) {
    e.preventDefault();

    try {
      setSaving(true);

      const { data } =
        await api.put(
          `/admin/clinics/${id}/configuration`,
          configurationForm
        );

      setNotice({
        type: "success",
        message:
          data.message ||
          "Clinic configuration saved successfully.",
      });

      setShowConfiguration(false);

      await load();
    } catch (err) {
      setNotice({
        type: "error",
        message:
          getError(err),
      });
    } finally {
      setSaving(false);
    }
  }

  async function createUser(e) {
    e.preventDefault();

    try {
      setSaving(true);

      const { data } =
        await api.post(
          `/admin/clinics/${id}/users`,
          userForm
        );

      setNotice({
        type: "success",
        message: data.message,
      });

      setShowUser(false);

      setUserForm({
        full_name: "",
        email: "",
        password: "",
        system_role:
          "clinic_admin",
        job_role: "owner",
        phone: "",
        active: true,
      });

      await load();
    } catch (err) {
      setNotice({
        type: "error",
        message:
          getError(err),
      });
    } finally {
      setSaving(false);
    }
  }

  async function toggleClinic() {
    if (!clinic) return;

    const action =
      clinic.active
        ? "deactivate"
        : "activate";

    if (
      !window.confirm(
        `Are you sure you want to ${action} ${clinic.clinic_name}?`
      )
    ) {
      return;
    }

    try {
      const { data } =
        await api.patch(
          `/admin/clinics/${id}/status`,
          {
            active:
              !clinic.active,
          }
        );

      setNotice({
        type: "success",
        message: data.message,
      });

      await load();
    } catch (err) {
      setNotice({
        type: "error",
        message:
          getError(err),
      });
    }
  }

  async function toggleUser(user) {
    try {
      const { data } =
        await api.patch(
          `/admin/users/${user.id}/status`,
          {
            active:
              !user.active,
          }
        );

      setNotice({
        type: "success",
        message: data.message,
      });

      await load();
    } catch (err) {
      setNotice({
        type: "error",
        message:
          getError(err),
      });
    }
  }

  return (
    <SuperAdminGuard>
      <Page
        title={
          clinic?.clinic_name ||
          "Clinic Details"
        }
        subtitle={
          clinic
            ? `${clinic.clinic_code} • ${
                clinic.subscription_status ||
                "active"
              }`
            : "Loading clinic..."
        }
        action={
          <div className="header-actions">
            <button
              type="button"
              className="btn secondary"
              onClick={() =>
                navigate(
                  "/admin/clinics"
                )
              }
            >
              <ArrowLeft size={18} />
              Back
            </button>

            {clinic && (
              <>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={
                    openConfiguration
                  }
                >
                  <Palette size={18} />
                  Configuration
                </button>

                <button
                  type="button"
                  className={
                    clinic.active
                      ? "btn secondary"
                      : "btn primary"
                  }
                  onClick={
                    toggleClinic
                  }
                >
                  {clinic.active
                    ? "Deactivate"
                    : "Activate"}
                </button>

                <button
                  type="button"
                  className="btn primary"
                  onClick={() =>
                    setShowUser(true)
                  }
                >
                  <UserPlus size={18} />
                  Add User
                </button>
              </>
            )}
          </div>
        }
      >
        <Notice
          notice={notice}
          onClose={() =>
            setNotice(null)
          }
        />

        {loading ? (
          <div className="loading-card">
            Loading clinic...
          </div>
        ) : !clinic ? (
          <div className="loading-card">
            Clinic not found.
          </div>
        ) : (
          <>
            <div className="billing-summary">
              <div>
                <span>Users</span>

                <strong>
                  {clinic.users_count ??
                    users.length}
                </strong>
              </div>

              <div>
                <span>
                  Patients
                </span>

                <strong>
                  {clinic.patients_count ??
                    0}
                </strong>
              </div>

              <div>
                <span>
                  Total Revenue
                </span>

                <strong>
                  {money(
                    clinic.total_revenue
                  )}
                </strong>
              </div>
            </div>

            {/* ============================
                CLINIC PROFILE
            ============================ */}

            <div className="section-heading">
              <div>
                <h2>
                  <Building2
                    size={20}
                  />
                  Clinic Profile
                </h2>

                <p>
                  Identity, branding and
                  subscription information.
                </p>
              </div>

              <button
                type="button"
                className="btn secondary"
                onClick={
                  openConfiguration
                }
              >
                <Palette size={17} />
                Edit Branding
              </button>
            </div>

            <div className="table-card">
              <div
                style={{
                  padding: "22px",
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "18px",
                }}
              >
                <div>
                  <small className="subtext">
                    Clinic Name
                  </small>

                  <strong
                    style={{
                      display:
                        "block",
                      marginTop:
                        "5px",
                    }}
                  >
                    {
                      clinic.clinic_name
                    }
                  </strong>
                </div>

                <div>
                  <small className="subtext">
                    Clinic Code
                  </small>

                  <span
                    className="code"
                    style={{
                      display:
                        "inline-block",
                      marginTop:
                        "5px",
                    }}
                  >
                    {
                      clinic.clinic_code
                    }
                  </span>
                </div>

                <div>
                  <small className="subtext">
                    Owner
                  </small>

                  <strong
                    style={{
                      display:
                        "block",
                      marginTop:
                        "5px",
                    }}
                  >
                    {clinic.owner_name ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <small className="subtext">
                    Email
                  </small>

                  <strong
                    style={{
                      display:
                        "block",
                      marginTop:
                        "5px",
                    }}
                  >
                    {clinic.email ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <small className="subtext">
                    Phone
                  </small>

                  <strong
                    style={{
                      display:
                        "block",
                      marginTop:
                        "5px",
                    }}
                  >
                    {clinic.phone ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <small className="subtext">
                    Plan
                  </small>

                  <strong
                    className="capitalize"
                    style={{
                      display:
                        "block",
                      marginTop:
                        "5px",
                    }}
                  >
                    {clinic.plan ||
                      "standard"}
                  </strong>
                </div>

                <div>
                  <small className="subtext">
                    Currency
                  </small>

                  <strong
                    style={{
                      display:
                        "block",
                      marginTop:
                        "5px",
                    }}
                  >
                    {clinic.currency ||
                      "PKR"}
                  </strong>
                </div>

                <div>
                  <small className="subtext">
                    Timezone
                  </small>

                  <strong
                    style={{
                      display:
                        "block",
                      marginTop:
                        "5px",
                    }}
                  >
                    {clinic.timezone ||
                      "Asia/Karachi"}
                  </strong>
                </div>

                <div>
                  <small className="subtext">
                    Status
                  </small>

                  <div
                    style={{
                      marginTop:
                        "5px",
                    }}
                  >
                    <StatusBadge
                      status={
                        clinic.active
                          ? "active"
                          : "inactive"
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ============================
                CLINIC USERS
            ============================ */}

            <div className="section-heading">
              <div>
                <h2>
                  <Users size={20} />
                  Clinic Users
                </h2>

                <p>
                  Accounts that can
                  sign in to this
                  clinic.
                </p>
              </div>
            </div>

            <div className="table-card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Job</th>
                      <th>
                        Last Login
                      </th>
                      <th>Status</th>
                      <th>
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.length ===
                    0 ? (
                      <TableMessage
                        columns={7}
                        text="No clinic users yet."
                      />
                    ) : (
                      users.map(
                        (user) => (
                          <tr
                            key={
                              user.id
                            }
                          >
                            <td>
                              <strong>
                                {
                                  user.full_name
                                }
                              </strong>
                            </td>

                            <td>
                              {
                                user.email
                              }
                            </td>

                            <td className="capitalize">
                              {
                                user.system_role
                              }
                            </td>

                            <td>
                              {user.job_role ||
                                "—"}
                            </td>

                            <td>
                              {dateTime(
                                user.last_login_at
                              )}
                            </td>

                            <td>
                              <StatusBadge
                                status={
                                  user.active
                                    ? "active"
                                    : "inactive"
                                }
                              />
                            </td>

                            <td>
                              {user.system_role !==
                                "super_admin" && (
                                <button
                                  type="button"
                                  className="btn small secondary"
                                  onClick={() =>
                                    toggleUser(
                                      user
                                    )
                                  }
                                >
                                  {user.active
                                    ? "Disable"
                                    : "Enable"}
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ================================
            CREATE CLINIC USER
        ================================ */}

        {showUser && (
          <Modal
            title="Create Clinic User"
            onClose={() =>
              setShowUser(false)
            }
            wide
          >
            <form
              onSubmit={createUser}
            >
              <div className="form-grid">
                <Field label="Full Name *">
                  <input
                    value={
                      userForm.full_name
                    }
                    onChange={(e) =>
                      setUserForm({
                        ...userForm,

                        full_name:
                          e.target
                            .value,
                      })
                    }
                    required
                  />
                </Field>

                <Field label="Email *">
                  <input
                    type="email"
                    value={
                      userForm.email
                    }
                    onChange={(e) =>
                      setUserForm({
                        ...userForm,

                        email:
                          e.target
                            .value,
                      })
                    }
                    required
                  />
                </Field>

                <Field label="Temporary Password *">
                  <input
                    type="password"
                    minLength="8"
                    value={
                      userForm.password
                    }
                    onChange={(e) =>
                      setUserForm({
                        ...userForm,

                        password:
                          e.target
                            .value,
                      })
                    }
                    required
                  />
                </Field>

                <Field label="System Role">
                  <select
                    value={
                      userForm.system_role
                    }
                    onChange={(e) =>
                      setUserForm({
                        ...userForm,

                        system_role:
                          e.target
                            .value,
                      })
                    }
                  >
                    <option value="clinic_admin">
                      Clinic Admin
                    </option>

                    <option value="staff">
                      Staff
                    </option>
                  </select>
                </Field>

                <Field label="Job Role">
                  <input
                    value={
                      userForm.job_role
                    }
                    onChange={(e) =>
                      setUserForm({
                        ...userForm,

                        job_role:
                          e.target
                            .value,
                      })
                    }
                    placeholder="Owner / Doctor / Receptionist / Accountant"
                  />
                </Field>

                <Field label="Phone">
                  <input
                    value={
                      userForm.phone
                    }
                    onChange={(e) =>
                      setUserForm({
                        ...userForm,

                        phone:
                          e.target
                            .value,
                      })
                    }
                  />
                </Field>
              </div>

              <FormActions
                onCancel={() =>
                  setShowUser(false)
                }
                busy={saving}
                text="Create User"
              />
            </form>
          </Modal>
        )}

        {/* ================================
            CLINIC CONFIGURATION / THEME STUDIO
        ================================ */}

        {showConfiguration && (
          <Modal
            title="Clinic Configuration & Theme Studio"
            onClose={() =>
              setShowConfiguration(false)
            }
            wide
          >
            <style>{`
              .theme-studio {
                display: grid;
                grid-template-columns: minmax(0, 1.35fr) minmax(300px, .65fr);
                gap: 24px;
                align-items: start;
              }

              .theme-section {
                border: 1px solid rgba(15,23,42,.10);
                border-radius: 18px;
                padding: 18px;
                margin-top: 16px;
                background: #fff;
              }

              .theme-section:first-child {
                margin-top: 0;
              }

              .theme-section h3 {
                margin: 0 0 4px;
                font-size: 16px;
              }

              .theme-section > p {
                margin: 0 0 16px;
                color: #64748b;
                font-size: 13px;
              }

              .theme-color-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 12px;
              }

              .theme-color-control {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 12px;
                min-height: 74px;
                padding: 12px;
                border: 1px solid #e2e8f0;
                border-radius: 14px;
                background: #f8fafc;
              }

              .theme-color-copy {
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 3px;
              }

              .theme-color-copy strong {
                font-size: 13px;
                color: #0f172a;
              }

              .theme-color-copy small {
                color: #64748b;
                line-height: 1.35;
              }

              .theme-color-inputs {
                display: flex;
                align-items: center;
                gap: 7px;
              }

              .theme-color-inputs input[type="color"] {
                width: 42px;
                min-width: 42px;
                height: 42px;
                padding: 2px;
                border-radius: 10px;
                cursor: pointer;
              }

              .theme-color-inputs input:not([type="color"]) {
                width: 92px;
                min-width: 0;
                font-family: monospace;
                font-size: 12px;
              }

              .theme-presets {
                display: grid;
                grid-template-columns: repeat(5, minmax(100px, 1fr));
                gap: 10px;
              }

              .theme-preset {
                border: 1px solid #e2e8f0;
                background: #fff;
                border-radius: 13px;
                padding: 10px;
                cursor: pointer;
                text-align: left;
              }

              .theme-preset:hover {
                border-color: #94a3b8;
                transform: translateY(-1px);
              }

              .theme-preset-colors {
                display: flex;
                height: 24px;
                border-radius: 8px;
                overflow: hidden;
                margin-bottom: 7px;
              }

              .theme-preset-colors i {
                flex: 1;
              }

              .theme-preview {
                position: sticky;
                top: 0;
                border: 1px solid rgba(15,23,42,.12);
                border-radius: 20px;
                overflow: hidden;
                background: ${configurationForm.card_background_color};
                box-shadow: 0 18px 45px rgba(15,23,42,.10);
              }

              .theme-preview-shell {
                display: grid;
                grid-template-columns: 112px 1fr;
                min-height: 410px;
                background: ${configurationForm.page_background_color};
              }

              .theme-preview-sidebar {
                padding: 14px 10px;
                background: ${configurationForm.sidebar_color};
                color: white;
              }

              .theme-preview-logo {
                width: 42px;
                height: 42px;
                margin: 0 auto 16px;
                border-radius: 12px;
                overflow: hidden;
                display: grid;
                place-items: center;
                background: ${configurationForm.secondary_color};
                color: ${configurationForm.primary_color};
                font-size: 11px;
                font-weight: 800;
              }

              .theme-preview-logo img {
                width: 100%;
                height: 100%;
                object-fit: cover;
              }

              .theme-preview-nav {
                padding: 9px 8px;
                border-radius: 9px;
                margin-bottom: 7px;
                font-size: 10px;
                opacity: .72;
              }

              .theme-preview-nav.active {
                opacity: 1;
                background: ${configurationForm.sidebar_active_color};
                color: #071f25;
                font-weight: 700;
              }

              .theme-preview-main {
                padding: 14px;
                min-width: 0;
              }

              .theme-preview-banner {
                padding: 18px;
                border-radius: 14px;
                color: white;
                background: linear-gradient(
                  120deg,
                  ${configurationForm.welcome_gradient_start},
                  ${configurationForm.welcome_gradient_end}
                );
              }

              .theme-preview-card {
                margin-top: 12px;
                padding: 12px;
                border-radius: 12px;
                background: ${configurationForm.card_background_color};
                border: 1px solid rgba(15,23,42,.08);
              }

              .theme-preview-buttons,
              .theme-preview-badges {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin-top: 10px;
              }

              .theme-preview-buttons span,
              .theme-preview-badges span {
                padding: 6px 9px;
                border-radius: 8px;
                font-size: 9px;
                font-weight: 700;
              }

              @media (max-width: 1050px) {
                .theme-studio {
                  grid-template-columns: 1fr;
                }

                .theme-preview {
                  position: static;
                }
              }

              @media (max-width: 720px) {
                .theme-color-grid,
                .theme-presets {
                  grid-template-columns: 1fr;
                }

                .theme-color-control {
                  align-items: flex-start;
                  flex-direction: column;
                }

                .theme-color-inputs {
                  width: 100%;
                }

                .theme-color-inputs input:not([type="color"]) {
                  flex: 1;
                  width: auto;
                }
              }
            `}</style>

            <form onSubmit={saveConfiguration}>
              <div className="theme-studio">
                <div>
                  <div className="theme-section">
                    <h3>Clinic Identity</h3>
                    <p>
                      Name and contact information shown throughout the system and documents.
                    </p>

                    <div className="form-grid">
                      <Field label="Clinic Name *">
                        <input
                          value={configurationForm.clinic_name}
                          onChange={(e) =>
                            setConfigurationForm({
                              ...configurationForm,
                              clinic_name: e.target.value,
                            })
                          }
                          required
                        />
                      </Field>

                      <Field label="Owner Name">
                        <input
                          value={configurationForm.owner_name}
                          onChange={(e) =>
                            setConfigurationForm({
                              ...configurationForm,
                              owner_name: e.target.value,
                            })
                          }
                        />
                      </Field>

                      <Field label="Email">
                        <input
                          type="email"
                          value={configurationForm.email}
                          onChange={(e) =>
                            setConfigurationForm({
                              ...configurationForm,
                              email: e.target.value,
                            })
                          }
                        />
                      </Field>

                      <Field label="Phone">
                        <input
                          value={configurationForm.phone}
                          onChange={(e) =>
                            setConfigurationForm({
                              ...configurationForm,
                              phone: e.target.value,
                            })
                          }
                        />
                      </Field>

                      <Field label="Website">
                        <input
                          value={configurationForm.website}
                          onChange={(e) =>
                            setConfigurationForm({
                              ...configurationForm,
                              website: e.target.value,
                            })
                          }
                          placeholder="https://example.com"
                        />
                      </Field>

                      <Field label="Registration No.">
                        <input
                          value={configurationForm.registration_no}
                          onChange={(e) =>
                            setConfigurationForm({
                              ...configurationForm,
                              registration_no: e.target.value,
                            })
                          }
                        />
                      </Field>

                      <Field label="Address" full>
                        <textarea
                          rows="3"
                          value={configurationForm.address}
                          onChange={(e) =>
                            setConfigurationForm({
                              ...configurationForm,
                              address: e.target.value,
                            })
                          }
                        />
                      </Field>

                      <Field label="Logo URL" full>
                        <input
                          value={configurationForm.logo_url}
                          onChange={(e) =>
                            setConfigurationForm({
                              ...configurationForm,
                              logo_url: e.target.value,
                            })
                          }
                          placeholder="https://..."
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="theme-section">
                    <h3>Quick Theme Presets</h3>
                    <p>
                      Pick a ready-made style first, then fine-tune any individual color below.
                    </p>

                    <div className="theme-presets">
                      {themePresets.map((preset) => (
                        <button
                          type="button"
                          className="theme-preset"
                          key={preset.name}
                          onClick={() =>
                            applyThemePreset(preset.colors)
                          }
                        >
                          <span className="theme-preset-colors">
                            <i
                              style={{
                                background: preset.colors.sidebar_color,
                              }}
                            />
                            <i
                              style={{
                                background: preset.colors.primary_color,
                              }}
                            />
                            <i
                              style={{
                                background: preset.colors.secondary_color,
                              }}
                            />
                          </span>

                          <strong>{preset.name}</strong>
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="btn secondary"
                      style={{ marginTop: "12px" }}
                      onClick={resetTheme}
                    >
                      Reset Theme Colors
                    </button>
                  </div>

                  {clinicThemeFields.map(
                    ([section, fields]) => (
                      <div
                        className="theme-section"
                        key={section}
                      >
                        <h3>{section}</h3>

                        <p>
                          Click the color square to choose visually, or enter a hex color.
                        </p>

                        <div className="theme-color-grid">
                          {fields.map(
                            ([field, label, help]) => (
                              <ThemeColorControl
                                key={field}
                                field={field}
                                label={label}
                                help={help}
                                value={
                                  configurationForm[field]
                                }
                                onChange={
                                  updateThemeColor
                                }
                              />
                            )
                          )}
                        </div>
                      </div>
                    )
                  )}

                  <div className="theme-section">
                    <h3>Regional Settings</h3>
                    <p>
                      Currency and timezone used by this clinic.
                    </p>

                    <div className="form-grid">
                      <Field label="Currency *">
                        <select
                          value={configurationForm.currency}
                          onChange={(e) =>
                            setConfigurationForm({
                              ...configurationForm,
                              currency: e.target.value,
                            })
                          }
                          required
                        >
                          <option value="PKR">PKR</option>
                          <option value="USD">USD</option>
                          <option value="GBP">GBP</option>
                          <option value="EUR">EUR</option>
                          <option value="AED">AED</option>
                          <option value="SAR">SAR</option>
                        </select>
                      </Field>

                      <Field label="Timezone *">
                        <select
                          value={configurationForm.timezone}
                          onChange={(e) =>
                            setConfigurationForm({
                              ...configurationForm,
                              timezone: e.target.value,
                            })
                          }
                          required
                        >
                          <option value="Asia/Karachi">Asia/Karachi</option>
                          <option value="Asia/Dubai">Asia/Dubai</option>
                          <option value="Asia/Riyadh">Asia/Riyadh</option>
                          <option value="Europe/London">Europe/London</option>
                          <option value="America/New_York">America/New_York</option>
                          <option value="America/Los_Angeles">America/Los_Angeles</option>
                        </select>
                      </Field>
                    </div>
                  </div>

                  <div className="theme-section">
                    <h3>Document Settings</h3>
                    <p>
                      Custom text printed on receipts and prescriptions.
                    </p>

                    <div className="form-grid">
                      <Field label="Receipt Footer" full>
                        <textarea
                          rows="3"
                          value={configurationForm.receipt_footer}
                          onChange={(e) =>
                            setConfigurationForm({
                              ...configurationForm,
                              receipt_footer: e.target.value,
                            })
                          }
                          placeholder="Thank you for visiting our clinic."
                        />
                      </Field>

                      <Field label="Prescription Footer" full>
                        <textarea
                          rows="3"
                          value={configurationForm.prescription_footer}
                          onChange={(e) =>
                            setConfigurationForm({
                              ...configurationForm,
                              prescription_footer: e.target.value,
                            })
                          }
                          placeholder="Clinic instructions or footer..."
                        />
                      </Field>
                    </div>
                  </div>
                </div>

                <div className="theme-preview">
                  <div className="theme-preview-shell">
                    <div className="theme-preview-sidebar">
                      <div className="theme-preview-logo">
                        {configurationForm.logo_url ? (
                          <img
                            src={configurationForm.logo_url}
                            alt="Clinic preview"
                          />
                        ) : (
                          clinicInitials(
                            configurationForm.clinic_name
                          )
                        )}
                      </div>

                      <div className="theme-preview-nav active">
                        Dashboard
                      </div>
                      <div className="theme-preview-nav">
                        Patients
                      </div>
                      <div className="theme-preview-nav">
                        Appointments
                      </div>
                      <div className="theme-preview-nav">
                        Billing
                      </div>
                    </div>

                    <div className="theme-preview-main">
                      <div className="theme-preview-banner">
                        <strong>
                          Welcome to{" "}
                          {configurationForm.clinic_name ||
                            "Your Clinic"}
                        </strong>

                        <div
                          style={{
                            marginTop: "5px",
                            fontSize: "10px",
                            opacity: 0.8,
                          }}
                        >
                          Live clinic theme preview
                        </div>
                      </div>

                      <div className="theme-preview-card">
                        <strong
                          style={{
                            color:
                              configurationForm.primary_color,
                          }}
                        >
                          Dashboard components
                        </strong>

                        <div className="theme-preview-buttons">
                          <span
                            style={{
                              background:
                                configurationForm.primary_button_color,
                              color: "#fff",
                            }}
                          >
                            Primary
                          </span>

                          <span
                            style={{
                              background:
                                configurationForm.secondary_button_color,
                              border: "1px solid #cbd5e1",
                            }}
                          >
                            Secondary
                          </span>

                          <span
                            style={{
                              background:
                                configurationForm.danger_button_color,
                              color: "#fff",
                            }}
                          >
                            Delete
                          </span>
                        </div>

                        <div className="theme-preview-badges">
                          <span
                            style={{
                              background:
                                configurationForm.paid_color,
                              color: "#fff",
                            }}
                          >
                            Paid
                          </span>

                          <span
                            style={{
                              background:
                                configurationForm.partial_color,
                              color: "#fff",
                            }}
                          >
                            Partial
                          </span>

                          <span
                            style={{
                              background:
                                configurationForm.unpaid_color,
                              color: "#fff",
                            }}
                          >
                            Unpaid
                          </span>
                        </div>

                        <div className="theme-preview-badges">
                          <span
                            style={{
                              background:
                                configurationForm.scheduled_color,
                              color: "#fff",
                            }}
                          >
                            Scheduled
                          </span>

                          <span
                            style={{
                              background:
                                configurationForm.confirmed_color,
                              color: "#fff",
                            }}
                          >
                            Confirmed
                          </span>

                          <span
                            style={{
                              background:
                                configurationForm.completed_color,
                              color: "#fff",
                            }}
                          >
                            Completed
                          </span>

                          <span
                            style={{
                              background:
                                configurationForm.cancelled_color,
                              color: "#fff",
                            }}
                          >
                            Cancelled
                          </span>
                        </div>

                        <div
                          style={{
                            marginTop: "12px",
                            padding: "9px",
                            borderRadius: "9px",
                            borderLeft: `4px solid ${configurationForm.success_color}`,
                            background: "#f8fafc",
                            fontSize: "10px",
                          }}
                        >
                          Success notification preview
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="form-actions"
                style={{
                  marginTop: "24px",
                }}
              >
                <button
                  type="button"
                  className="btn secondary"
                  disabled={saving}
                  onClick={() =>
                    setShowConfiguration(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn primary"
                  disabled={saving}
                >
                  <Save size={18} />

                  {saving
                    ? "Saving..."
                    : "Save Configuration"}
                </button>
              </div>
            </form>
          </Modal>
        )}
        
      </Page>
    </SuperAdminGuard>
  );
}/* =========================================================
   SUPER ADMIN — ALL USERS
========================================================= */

function AdminUsers() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);

  const pageSize = 12;

  async function load(q = "") {
    try {
      setLoading(true);

      const { data } = await api.get(
        "/admin/users",
        {
          params: {
            search: q,
          },
        }
      );

      setUsers(data);
    } catch (err) {
      setNotice({
        type: "error",
        message: getError(err),
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(
      () => load(search),
      250
    );

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      users.length / pageSize
    )
  );

  const rows = users.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <SuperAdminGuard>
      <Page
        title="Users"
        subtitle="All clinic users across the platform"
        action={
          <button
            type="button"
            className="btn secondary"
            onClick={() =>
              navigate(
                "/admin/clinics"
              )
            }
          >
            <ArrowLeft size={18} />
            Clinics
          </button>
        }
      >
        <Notice
          notice={notice}
          onClose={() =>
            setNotice(null)
          }
        />

        <div className="toolbar">
          <div className="search-box">
            <Search size={18} />

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search user, email, phone or clinic..."
            />
          </div>
        </div>

        <div className="table-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Clinic</th>
                  <th>Email</th>
                  <th>
                    System Role
                  </th>
                  <th>Job Role</th>
                  <th>Status</th>
                  <th>
                    Last Login
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <TableMessage
                    columns={7}
                    text="Loading users..."
                  />
                ) : rows.length ===
                  0 ? (
                  <TableMessage
                    columns={7}
                    text="No users found."
                  />
                ) : (
                  rows.map(
                    (user) => (
                      <tr
                        key={
                          user.id
                        }
                      >
                        <td>
                          <strong>
                            {
                              user.full_name
                            }
                          </strong>
                        </td>

                        <td>
                          {user.clinic_name ||
                            "—"}
                        </td>

                        <td>
                          {user.email}
                        </td>

                        <td className="capitalize">
                          {user.system_role ||
                            user.role ||
                            "—"}
                        </td>

                        <td>
                          {user.job_role ||
                            "—"}
                        </td>

                        <td>
                          <StatusBadge
                            status={
                              user.active
                                ? "active"
                                : "inactive"
                            }
                          />
                        </td>

                        <td>
                          {dateTime(
                            user.last_login_at
                          )}
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination
          page={page}
          totalPages={
            totalPages
          }
          totalItems={
            users.length
          }
          pageSize={pageSize}
          onPage={setPage}
        />
      </Page>
    </SuperAdminGuard>
  );
}

/* =========================================================
   COMMON COMPONENTS
========================================================= */

function Page({
  title,
  subtitle,
  action,
  children,
}) {
  return (
    <>
      <header className="page-header">
        <div>
          <h1>{title}</h1>

          <p>{subtitle}</p>
        </div>

        {action}
      </header>

      <div className="page-body">
        {children}
      </div>
    </>
  );
}

function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPage,
}) {
  if (
    totalItems <= pageSize
  ) {
    return null;
  }

  const start =
    (page - 1) *
      pageSize +
    1;

  const end = Math.min(
    page * pageSize,
    totalItems
  );

  return (
    <div className="pagination">
      <span>
        {start}–{end} of{" "}
        {totalItems}
      </span>

      <div className="action-buttons">
        <button
          type="button"
          className="btn small secondary"
          disabled={page <= 1}
          onClick={() =>
            onPage(page - 1)
          }
        >
          <ChevronLeft
            size={16}
          />
          Previous
        </button>

        <span className="code">
          Page {page} /{" "}
          {totalPages}
        </span>

        <button
          type="button"
          className="btn small secondary"
          disabled={
            page >= totalPages
          }
          onClick={() =>
            onPage(page + 1)
          }
        >
          Next
          <ChevronRight
            size={16}
          />
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  full = false,
}) {
  return (
    <label
      className={`field ${
        full
          ? "field-full"
          : ""
      }`}
    >
      <span>{label}</span>

      {children}
    </label>
  );
}

function FormActions({
  onCancel,
  busy,
  text = "Save",
}) {
  return (
    <div className="form-actions">
      <button
        type="button"
        className="btn secondary"
        onClick={onCancel}
        disabled={busy}
      >
        Cancel
      </button>

      <button
        type="submit"
        className="btn primary"
        disabled={busy}
      >
        {busy
          ? "Saving..."
          : text}
      </button>
    </div>
  );
}

function TableMessage({
  columns,
  text,
}) {
  return (
    <tr>
      <td
        colSpan={columns}
        className="table-message"
      >
        {text}
      </td>
    </tr>
  );
}

function StatusBadge({
  status,
}) {
  return (
    <span
      className={`badge ${
        status || ""
      }`}
    >
      {String(
        status || ""
      ).replace("-", " ")}
    </span>
  );
}

/* =========================================================
   AUTH PROTECTION
========================================================= */

function ProtectedApp() {
  const token =
    localStorage.getItem(
      "token"
    );

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Shell />;
}

/* =========================================================
   ROOT APP
========================================================= */

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/*"
          element={
            <ProtectedApp />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

/* =========================================================
   START REACT
========================================================= */

ReactDOM.createRoot(
  document.getElementById(
    "root"
  )
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);