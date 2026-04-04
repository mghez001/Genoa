const Relation = require("../models/Relation");
const Member = require("../models/Member");

const getTree = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { scope = "all", depth = 2 } = req.query;

    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Membre introuvable",
        error: "MEMBER_NOT_FOUND",
      });
    }

    const nodes = new Map(); // id -> member
    const edges = [];

    // Ajouter un membre aux nodes s'il n'y est pas déjà
    const addNode = (m) => {
      if (!nodes.has(m._id.toString())) {
        nodes.set(m._id.toString(), {
          id: m._id.toString(),
          label: `${m.prenom || ""} ${m.nom || ""}`.trim(),
          sexe: m.sexe,
        });
      }
    };

    addNode(member);

    // Trouver les parents : chercher les relations "enfant" où enfant_id = memberId
    const parentLinks = await Relation.find({
      type: "enfant",
      enfant_id: memberId,
    }).populate("couple_id");

    for (const link of parentLinks) {
      const couple = link.couple_id;
      if (!couple) continue;

      const [p1, p2] = await Promise.all([
        Member.findById(couple.membre1_id),
        Member.findById(couple.membre2_id),
      ]);

      if (p1) {
        addNode(p1);
        edges.push({ source: p1._id.toString(), target: memberId, type: "parent" });
      }
      if (p2) {
        addNode(p2);
        edges.push({ source: p2._id.toString(), target: memberId, type: "parent" });
      }
    }

    // Trouver les enfants : chercher les couples où membre1_id ou membre2_id = memberId
    const coupleLinks = await Relation.find({
      type: "couple",
      $or: [{ membre1_id: memberId }, { membre2_id: memberId }],
    });

    for (const couple of coupleLinks) {
      const childLinks = await Relation.find({
        type: "enfant",
        couple_id: couple._id,
      });

      for (const childLink of childLinks) {
        const child = await Member.findById(childLink.enfant_id);
        if (child) {
          addNode(child);
          edges.push({
            source: memberId,
            target: child._id.toString(),
            type: "enfant",
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Arbre récupéré",
      data: {
        rootMemberId: memberId,
        nodes: Array.from(nodes.values()),
        edges,
      },
    });
  } catch (err) {
    console.error("getTree error:", err);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: "SERVER_ERROR",
    });
  }
};

module.exports = { getTree };