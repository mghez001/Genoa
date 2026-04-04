const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont requis",
        error: "MISSING_FIELDS",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Cet email est déjà utilisé",
        error: "EMAIL_ALREADY_EXISTS",
      });
    }

    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: isFirstUser ? "admin" : "reader",
      isApproved: isFirstUser ? true : false,
    });

    return res.status(201).json({
      success: true,
      message: isFirstUser
        ? "Compte administrateur créé"
        : "Compte créé, en attente de validation",
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
    console.error("register error:", err);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: "SERVER_ERROR",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe requis",
        error: "MISSING_FIELDS",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect",
        error: "INVALID_CREDENTIALS",
      });
    }

    if (!user.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Votre compte est en attente de validation par un administrateur",
        error: "ACCOUNT_NOT_APPROVED",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect",
        error: "INVALID_CREDENTIALS",
      });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.status(200).json({
      success: true,
      message: "Connexion réussie",
      data: {
        token,
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
    console.error("login error:", err);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: "SERVER_ERROR",
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable",
        error: "USER_NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profil récupéré",
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
    console.error("getMe error:", err);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: "SERVER_ERROR",
    });
  }
};

const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Déconnexion réussie",
    data: null,
  });
};

module.exports = { register, login, getMe, logout };