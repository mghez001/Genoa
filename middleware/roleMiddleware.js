const ROLE_HIERARCHY = {
  reader: 1,
  editor: 2,
  admin: 3,
};

const requireRole = (minRole) => {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole || ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY[minRole]) {
      return res.status(403).json({
        success: false,
        message: "Vous n'avez pas les droits nécessaires",
        error: "FORBIDDEN",
      });
    }

    next();
  };
};

module.exports = requireRole;