const User = require("../models/User");
const bcrypt = require("bcrypt");

const ROLE_HIERARCHY = {
  reader: 1,
  editor: 2,
  admin: 3,
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role = "reader" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont requis",
        error: "MISSING_FIELDS",
      });
    }

    if (!["admin", "editor", "reader"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Rôle invalide. Valeurs acceptées : admin, editor, reader",
        error: "INVALID_ROLE",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Cet email est déjà utilisé",
        error: "EMAIL_ALREADY_EXISTS",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      isApproved: true,
    });

    return res.status(201).json({
      success: true,
      message: "Compte créé",
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isApproved: user.isApproved,
        },
      },
    });
  } catch (err) {
    console.error("createUser error:", err);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: "SERVER_ERROR",
    });
  }
};

const getApprovedUsers = async (req, res) => {
  try {
    const currentUserRole = req.user?.role;
    const currentUserLevel = ROLE_HIERARCHY[currentUserRole] || 0;
    const users = await User.find({
      isApproved: true,
      _id: { $ne: req.user.userId },
    }).select("-passwordHash");
    const filteredUsers = users.filter((user) => {
      const userLevel = ROLE_HIERARCHY[user.role] || 0;
      return userLevel <= currentUserLevel;
    });

    return res.status(200).json({
      success: true,
      message: "Utilisateurs approuves",
      data: { users: filteredUsers },
    });
  } catch (err) {
    console.error("getApprovedUsers error:", err);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: "SERVER_ERROR",
    });
  }
};

const getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ isApproved: false }).select("-passwordHash");

    return res.status(200).json({
      success: true,
      message: "Comptes en attente",
      data: { users },
    });
  } catch (err) {
    console.error("getPendingUsers error:", err);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: "SERVER_ERROR",
    });
  }
};

const approveUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable",
        error: "USER_NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Utilisateur approuvé",
      data: {
        user: {
          _id: user._id,
          isApproved: user.isApproved,
        },
      },
    });
  } catch (err) {
    console.error("approveUser error:", err);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: "SERVER_ERROR",
    });
  }
};

const rejectPendingUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable",
        error: "USER_NOT_FOUND",
      });
    }

    if (user.isApproved) {
      return res.status(400).json({
        success: false,
        message: "Ce compte a deja ete approuve",
        error: "USER_ALREADY_APPROVED",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Utilisateur refuse",
      data: {
        user: {
          _id: user._id,
          email: user.email,
        },
      },
    });
  } catch (err) {
    console.error("rejectPendingUser error:", err);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: "SERVER_ERROR",
    });
  }
};

const updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    const currentUserRole = req.user?.role;
    const currentUserLevel = ROLE_HIERARCHY[currentUserRole] || 0;

    if (!role || !["admin", "editor", "reader"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Rôle invalide. Valeurs acceptées : admin, editor, reader",
        error: "INVALID_ROLE",
      });
    }

    // Empêcher un admin de se rétrograder lui-même
    if (req.params.id === req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Vous ne pouvez pas modifier votre propre rôle",
        error: "CANNOT_EDIT_OWN_ROLE",
      });
    }

    if ((ROLE_HIERARCHY[role] || 0) > currentUserLevel) {
      return res.status(403).json({
        success: false,
        message: "Vous ne pouvez pas attribuer un rôle supérieur au vôtre",
        error: "CANNOT_ASSIGN_HIGHER_ROLE",
      });
    }

    const targetUser = await User.findById(req.params.id).select("-passwordHash");

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable",
        error: "USER_NOT_FOUND",
      });
    }

    const targetUserLevel = ROLE_HIERARCHY[targetUser.role] || 0;

    if (targetUserLevel > currentUserLevel) {
      return res.status(403).json({
        success: false,
        message: "Vous ne pouvez pas modifier un utilisateur ayant un rôle supérieur au vôtre",
        error: "CANNOT_EDIT_HIGHER_ROLE",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-passwordHash");

    return res.status(200).json({
      success: true,
      message: "Rôle mis à jour",
      data: {
        user: {
          _id: user._id,
          role: user.role,
        },
      },
    });
  } catch (err) {
    console.error("updateRole error:", err);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: "SERVER_ERROR",
    });
  }
};

module.exports = { createUser, getApprovedUsers, getPendingUsers, approveUser, rejectPendingUser, updateRole };
