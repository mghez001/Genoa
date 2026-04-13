const Member = require("../models/Member");

const searchMembers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Paramètre de recherche requis",
        error: "MISSING_QUERY",
      });
    }

    const results = await Member.find({
      $or: [
        { nom: { $regex: q, $options: "i" } },
        { prenom: { $regex: q, $options: "i" } },
      ],
    }).select("nom prenom sexe dateNaissance photoURL");

    return res.status(200).json({
      success: true,
      message: "Résultats de recherche",
      data: { query: q, results },
    });
  } catch (err) {
    console.error("searchMembers error:", err);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: "SERVER_ERROR",
    });
  }
};

module.exports = { searchMembers };