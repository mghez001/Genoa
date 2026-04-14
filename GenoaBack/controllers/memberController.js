const Member = require("../models/Member");
const Relation = require("../models/Relation");

const createMember = async (req, res) => {
  try {
    const {
      nom,
      prenom,
      sexe,
      dateNaissance,
      dateDeces,
      photoURL,
      emails,
      telephones,
      adresses,
      professions,
    } = req.body;

    const member = await Member.create({
      nom,
      prenom,
      sexe,
      dateNaissance,
      dateDeces,
      photoURL,
      emails,
      telephones,
      adresses,
      professions,
      createdBy: req.user.userId,
    });

    return res.status(201).json({
      success: true,
      message: "Membre créé",
      data: {
        member: {
          _id: member._id,
          nom: member.nom,
          prenom: member.prenom,
        },
      },
    });
  } catch (err) {
    console.error("createMember error:", err);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: "SERVER_ERROR",
    });
  }
};

const getMembers = async (req, res) => {
  try {
    const { search, nom, prenom, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { nom: { $regex: search, $options: "i" } },
        { prenom: { $regex: search, $options: "i" } },
      ];
    }
    if (nom) filter.nom = { $regex: nom, $options: "i" };
    if (prenom) filter.prenom = { $regex: prenom, $options: "i" };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Member.countDocuments(filter);
    const members = await Member.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .select("-__v");

    return res.status(200).json({
      success: true,
      message: "Liste des membres",
      data: {
        members,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
        },
      },
    });
  } catch (err) {
    console.error("getMembers error:", err);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: "SERVER_ERROR",
    });
  }
};

const getMemberById = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id)
      .populate("createdBy", "name email")
      .select("-__v");

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Membre introuvable",
        error: "MEMBER_NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Membre récupéré",
      data: { member },
    });
  } catch (err) {
    console.error("getMemberById error:", err);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: "SERVER_ERROR",
    });
  }
};

const updateMember = async (req, res) => {
  try {
    // Vérifier si le membre est verrouillé par quelqu'un d'autre
    const existing = await Member.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Membre introuvable",
        error: "MEMBER_NOT_FOUND",
      });
    }

    if (
      existing.lockedBy &&
      existing.lockedBy.toString() !== req.user.userId
    ) {
      return res.status(423).json({
        success: false,
        message: "Ce membre est en cours de modification par un autre utilisateur",
        error: "MEMBER_LOCKED",
      });
    }

    const member = await Member.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).select("-__v");

    return res.status(200).json({
      success: true,
      message: "Membre mis à jour",
      data: { member },
    });
  } catch (err) {
    console.error("updateMember error:", err);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: "SERVER_ERROR",
    });
  }
};

const deleteMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Membre introuvable",
        error: "MEMBER_NOT_FOUND",
      });
    }

    const coupleRelations = await Relation.find({
      type: "couple",
      $or: [
        { membre1_id: req.params.id },
        { membre2_id: req.params.id },
      ],
    }).select("_id");
    const coupleIds = coupleRelations.map((relation) => relation._id);

    const deletedRelations = await Relation.deleteMany({
      $or: [
        { _id: { $in: coupleIds } },
        { type: "enfant", enfant_id: req.params.id },
        { type: "enfant", couple_id: { $in: coupleIds } },
      ],
    });

    await Member.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Membre supprimé",
      data: {
        deletedRelations: deletedRelations.deletedCount,
      },
    });
  } catch (err) {
    console.error("deleteMember error:", err);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: "SERVER_ERROR",
    });
  }
};

const lockMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Membre introuvable",
        error: "MEMBER_NOT_FOUND",
      });
    }

    // Déjà verrouillé par quelqu'un d'autre ?
    if (
      member.lockedBy &&
      member.lockedBy.toString() !== req.user.userId
    ) {
      return res.status(423).json({
        success: false,
        message: "Ce membre est déjà verrouillé par un autre utilisateur",
        error: "ALREADY_LOCKED",
      });
    }

    member.lockedBy = req.user.userId;
    member.lockedAt = new Date();
    await member.save();

    // Émettre l'événement Socket.IO si disponible
    const io = req.app.get("io");
    if (io) {
      io.emit("member:locked", {
        memberId: member._id,
        lockedBy: req.user.userId,
        lockedAt: member.lockedAt,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Verrou posé",
      data: {
        memberId: member._id,
        lockedBy: member.lockedBy,
        lockedAt: member.lockedAt,
      },
    });
  } catch (err) {
    console.error("lockMember error:", err);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: "SERVER_ERROR",
    });
  }
};

const unlockMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Membre introuvable",
        error: "MEMBER_NOT_FOUND",
      });
    }

    // Seul celui qui a posé le verrou (ou un admin) peut le retirer
    const isAdmin = req.user.role === "admin";
    if (
      member.lockedBy &&
      member.lockedBy.toString() !== req.user.userId &&
      !isAdmin
    ) {
      return res.status(403).json({
        success: false,
        message: "Vous ne pouvez pas retirer le verrou d'un autre utilisateur",
        error: "FORBIDDEN",
      });
    }

    member.lockedBy = null;
    member.lockedAt = null;
    await member.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("member:unlocked", { memberId: member._id });
    }

    return res.status(200).json({
      success: true,
      message: "Verrou retiré",
      data: {
        memberId: member._id,
        lockedBy: null,
        lockedAt: null,
      },
    });
  } catch (err) {
    console.error("unlockMember error:", err);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: "SERVER_ERROR",
    });
  }
};

module.exports = {
  createMember,
  getMembers,
  getMemberById,
  updateMember,
  deleteMember,
  lockMember,
  unlockMember,
};
