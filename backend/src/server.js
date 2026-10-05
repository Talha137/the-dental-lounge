import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import "dotenv/config";

import auth from "./routes/auth.js";
import patients from "./routes/patients.js";
import appointments from "./routes/appointments.js";
import treatments from "./routes/treatments.js";
import billing from "./routes/billing.js";
import dashboard from "./routes/dashboard.js";
import admin from "./routes/admin.js";

const app = express();

/* =========================================================
   GLOBAL MIDDLEWARE
========================================================= */

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:63866",
        process.env.FRONTEND_URL,
      ].filter(Boolean);

      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(morgan("dev"));

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    name: "The Dental Lounge API",
  });
});

/* =========================================================
   APPLICATION ROUTES
========================================================= */

app.use("/api/auth", auth);

app.use("/api/patients", patients);

app.use("/api/appointments", appointments);

app.use("/api/treatments", treatments);

app.use("/api/billing", billing);

app.use("/api/dashboard", dashboard);

/* =========================================================
   SUPER ADMIN ROUTES

   Used for:
   - Clinics management
   - Customer accounts
   - SaaS administration
========================================================= */

app.use("/api/admin", admin);

/* =========================================================
   404
========================================================= */

app.use((req, res) => {
  res.status(404).json({
    message: "API route not found",
  });
});

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use((err, req, res, next) => {
  console.error(err);

  if (err?.name === "ZodError") {
    return res.status(400).json({
      message: "Invalid data",
      errors: err.errors,
    });
  }

  res.status(500).json({
    message: "Server error",
  });
});

/* =========================================================
   START SERVER
========================================================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});