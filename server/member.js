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

    photoURL: { type: String },

    emails: [{ type: String }],

    telephones: [
      {
        type: String,
        trim: true,
      },
    ],

    adresses: [
      {
        type: String,
        trim: true,
      },
    ],

    // Plusieurs possibles
    professions: [{ type: String }],

    // Référence vers l'utilisateur qui a créé ce membre
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lockedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Member", memberSchema);