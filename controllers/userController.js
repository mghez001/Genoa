const User = require("../models/User");

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

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
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

module.exports = { getPendingUsers, approveUser, rejectPendingUser, updateRole };
