const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    nom: { type: String, trim: true },
    prenom: { type: String, trim: true },

    sexe: {
      type: String,
      enum: ["homme", "femme"],
    },

    dateNaissance: { type: Date },
    dateDeces: { type: Date },

    // Plusieurs possibles
    professions: [{ type: String }],

    // Référence vers l'utilisateur qui a créé ce membre
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Member", memberSchema);