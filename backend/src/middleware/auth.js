import jwt from "jsonwebtoken";

/* =========================================================
   AUTHENTICATION MIDDLEWARE
========================================================= */

export function auth(req, res, next) {
  const authorization = req.headers.authorization;

  if (
    !authorization ||
    !authorization.startsWith("Bearer ")
  ) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!decoded?.id) {
      return res.status(401).json({
        message: "Invalid or expired session",
      });
    }

    /*
     * req.user now contains JWT information such as:
     *
     * id
     * name
     * email
     * role
     * system_role
     * job_role
     * clinic_id
     */

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired session",
    });
  }
}

/* =========================================================
   ROLE AUTHORIZATION

   New SaaS roles:
   - super_admin
   - clinic_admin
   - staff

   Legacy role is retained as fallback while the project
   is being migrated.
========================================================= */

export const allow =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const currentRole =
      req.user.system_role ||
      req.user.role;

    if (!roles.includes(currentRole)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    next();
  };

/* =========================================================
   SUPER ADMIN ONLY

   This will be used later for:
   - Clinics management
   - Customer accounts
   - SaaS administration
========================================================= */

export function requireSuperAdmin(
  req,
  res,
  next
) {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  if (
    req.user.system_role !== "super_admin"
  ) {
    return res.status(403).json({
      message:
        "Super administrator access required.",
    });
  }

  next();
}