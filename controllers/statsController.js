const Member = require("../models/Member");
const Relation = require("../models/Relation");

const getFamilyStats = async (req, res) => {
  try {
    const allMembers = await Member.find({});

    const totalMembers = allMembers.length;
    const totalMen = allMembers.filter((m) => m.sexe === "homme").length;
    const totalWomen = allMembers.filter((m) => m.sexe === "femme").length;

    // Espérance de vie moyenne (membres avec date de naissance ET de décès)
    const deceased = allMembers.filter((m) => m.dateNaissance && m.dateDeces);
    const averageLifeExpectancy =
      deceased.length > 0
        ? parseFloat(
            (
              deceased.reduce((sum, m) => {
                const birth = new Date(m.dateNaissance);
                const death = new Date(m.dateDeces);
                return sum + (death - birth) / (1000 * 60 * 60 * 24 * 365.25);
              }, 0) / deceased.length
            ).toFixed(1)
          )
        : null;

    // Nombre moyen d'enfants par couple
    const couples = await Relation.find({ type: "couple" });
    let totalChildren = 0;
    for (const couple of couples) {
      const count = await Relation.countDocuments({
        type: "enfant",
        couple_id: couple._id,
      });
      totalChildren += count;
    }
    const averageChildrenPerCouple =
      couples.length > 0
        ? parseFloat((totalChildren / couples.length).toFixed(1))
        : 0;

    return res.status(200).json({
      success: true,
      message: "Statistiques récupérées",
      data: {
        totalMembers,
        totalMen,
        totalWomen,
        averageLifeExpectancy,
        averageChildrenPerCouple,
      },
    });
  } catch (err) {
    console.error("getFamilyStats error:", err);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: "SERVER_ERROR",
    });
  }
};

module.exports = { getFamilyStats };