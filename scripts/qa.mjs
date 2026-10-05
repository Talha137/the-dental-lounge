import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const failures = [];
const warnings = [];
const pass = (name) => console.log(`PASS  ${name}`);
const fail = (name, detail) => { failures.push(name); console.error(`FAIL  ${name}: ${detail}`); };
const warn = (name, detail) => { warnings.push(name); console.warn(`WARN  ${name}: ${detail}`); };

const vercel = JSON.parse(read("vercel.json"));
if (vercel.services?.frontend?.root === "frontend/" && vercel.services?.backend?.root === "backend/") pass("Vercel services roots");
else fail("Vercel services roots", "frontend/backend service roots are not configured as expected");

const rewrites = vercel.rewrites || [];
const apiIndex = rewrites.findIndex((r) => r.source === "/api/(.*)" && r.destination?.service === "backend");
const spaIndex = rewrites.findIndex((r) => r.source === "/(.*)" && r.destination?.service === "frontend" && r.destination?.path === "/");
if (apiIndex >= 0 && spaIndex > apiIndex) pass("API rewrite precedence");
else fail("API rewrite precedence", "API must route to backend before SPA catch-all");
if (spaIndex >= 0) pass("SPA deep-link fallback");
else fail("SPA deep-link fallback", "frontend catch-all must select the frontend root route");
if (!fs.existsSync(path.join(root, "frontend/vercel.json"))) pass("Single Vercel config owner");
else fail("Single Vercel config owner", "nested frontend/vercel.json can conflict with Services configuration");

const main = read("frontend/src/main.jsx");
const routeMatches = [...main.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
const requiredRoutes = ["/patients/new", "/appointments/new", "/treatments/new", "/billing/invoices/new", "/forgot-password", "/reset-password"];
for (const route of requiredRoutes) {
  if (routeMatches.includes(route)) pass(`React route ${route}`);
  else fail(`React route ${route}`, "route is missing");
}
const duplicates = routeMatches.filter((r, i) => routeMatches.indexOf(r) !== i);
if (!duplicates.length) pass("No duplicate explicit React routes");
else warn("Duplicate React routes", [...new Set(duplicates)].join(", "));

const api = read("frontend/src/services/api.js");
if (/import\.meta\.env\.PROD\s*\?\s*["']\/api["']/.test(api)) pass("Production API uses same-origin /api");
else fail("Production API uses same-origin /api", "production API base should be /api");

const server = read("backend/src/server.js");
if (server.includes('process.env.FRONTEND_URL') && server.includes('process.env.APP_URL')) pass("Production CORS origin configuration");
else fail("Production CORS origin configuration", "FRONTEND_URL/APP_URL are not used");
if (!server.includes('"http://localhost:63866"')) pass("No ephemeral dev port hard-coded");
else fail("No ephemeral dev port hard-coded", "remove hard-coded Vercel dev port");

const auth = read("backend/src/routes/auth.js");
if (auth.includes("RESEND_API_KEY") && auth.includes("EMAIL_FROM")) pass("Email provider configuration hooks");
else fail("Email provider configuration hooks", "Resend key/from configuration missing");
if (auth.includes("/reset-password") && auth.includes("security-email/confirm-add")) pass("Email verification/reset routes present");
else fail("Email verification/reset routes present", "verification/reset flow is incomplete");

const schema = read("backend/src/schema.sql");
if (schema.includes("clinic_id") && schema.includes("security_email_requests") && schema.includes("password_reset_requests")) {
  pass("Fresh database schema matches SaaS/auth features");
} else {
  warn("Fresh database schema", "schema.sql appears older than the current multi-tenant/auth code; do not use db:init for a new production database until migrations are reconciled");
}

const initDb = read("backend/src/initDb.js");
if (initDb.includes("ChangeMe123!")) {
  warn("Seed administrator password", "db:init contains a known default password; never use that seed unchanged in production");
} else {
  pass("No known default seed password");
}

const gitignore = read(".gitignore");
if (gitignore.includes(".env") && gitignore.includes(".vercel/")) pass("Secrets/local Vercel state ignored");
else fail("Secrets/local Vercel state ignored", ".env and .vercel/ should be ignored");

console.log(`\nQA summary: ${failures.length} failure(s), ${warnings.length} warning(s).`);
if (failures.length) process.exit(1);
