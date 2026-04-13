const Relation = require("../models/Relation");
const Member = require("../models/Member");

const getCouples = async (req, res) => {
  try {
    const couples = await Relation.find({ type: "couple" })
      .populate("membre1_id", "nom prenom")
      .populate("membre2_id", "nom prenom")
      .select("-__v");

    return res.status(200).json({
      success: true,
      message: "Liste des couples",
      data: { couples },
    });
  } catch (err) {
    console.error("getCouples error:", err);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: "SERVER_ERROR",
    });
  }
};

const createCouple = async (req, res) => {
  try {
    const { membre1_id, membre2_id, dateUnion, dateSeparation } = req.body;

    if (!membre1_id || !membre2_id) {
      return res.status(400).json({
        success: false,
        message: "membre1_id et membre2_id sont requis",
        error: "MISSING_FIELDS",
      });
    }

    // Vérifier que les deux membres existent
    const [m1, m2] = await Promise.all([
      Member.findById(membre1_id),
      Member.findById(membre2_id),
    ]);

    if (!m1 || !m2) {
      return res.status(404).json({
        success: false,
        message: "Un ou plusieurs membres introuvables",
        error: "MEMBER_NOT_FOUND",
      });
    }

    // Vérifier qu'un couple identique n'existe pas déjà
    const existing = await Relation.findOne({
      type: "couple",
      $or: [
        { membre1_id, membre2_id },
        { membre1_id: membre2_id, membre2_id: membre1_id },
      ],
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Une relation de couple existe déjà entre ces deux membres",
        error: "COUPLE_ALREADY_EXISTS",
      });
    }

    const relation = await Relation.create({
      type: "couple",
      membre1_id,
      membre2_id,
      dateUnion: dateUnion || null,
      dateSeparation: dateSeparation || null,
    });

    return res.status(201).json({
      success: true,
      message: "Relation de couple créée",
      data: {
        relation: {
          _id: relation._id,
          type: relation.type,
          membre1_id: relation.membre1_id,
          membre2_id: relation.membre2_id,
        },
      },
    });
  } catch (err) {
    console.error("createCouple error:", err);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: "SERVER_ERROR",
    });
  }
};

const createChild = async (req, res) => {
  try {
    const { couple_id, enfant_id, filiationType } = req.body;

    if (!couple_id || !enfant_id) {
      return res.status(400).json({
        success: false,
        message: "couple_id et enfant_id sont requis",
        error: "MISSING_FIELDS",
      });
    }

    // Vérifier que le couple existe et est bien de type "couple"
    const couple = await Relation.findOne({ _id: couple_id, type: "couple" });
    if (!couple) {
      return res.status(404).json({
        success: false,
        message: "Relation de couple introuvable",
        error: "COUPLE_NOT_FOUND",
      });
    }

    if (
      couple.membre1_id?.toString() === enfant_id ||
      couple.membre2_id?.toString() === enfant_id
    ) {
      return res.status(400).json({
        success: false,
        message: "L'enfant ne peut pas être un des membres du couple",
        error: "CHILD_IS_COUPLE_MEMBER",
      });
    }

    // Vérifier que l'enfant existe
    const enfant = await Member.findById(enfant_id);
    if (!enfant) {
      return res.status(404).json({
        success: false,
        message: "Membre (enfant) introuvable",
        error: "MEMBER_NOT_FOUND",
      });
    }

    // Vérifier que ce lien enfant n'existe pas déjà
    const existing = await Relation.findOne({
      type: "enfant",
      couple_id,
      enfant_id,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Ce lien enfant existe déjà",
        error: "CHILD_LINK_ALREADY_EXISTS",
      });
    }

    const relation = await Relation.create({
      type: "enfant",
      couple_id,
      enfant_id,
      filiationType: filiationType || "biologique",
    });

    return res.status(201).json({
      success: true,
      message: "Lien enfant créé",
      data: {
        relation: {
          _id: relation._id,
          type: relation.type,
          couple_id: relation.couple_id,
          enfant_id: relation.enfant_id,
          filiationType: relation.filiationType,
        },
      },
    });
  } catch (err) {
    console.error("createChild error:", err);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: "SERVER_ERROR",
    });
  }
};

module.exports = { getCouples, createCouple, createChild };
