const mongoose = require("mongoose");

const relationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["couple", "enfant"],
      required: true,
    },

    // Couple
    membre1_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
    },
    membre2_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
    },
    dateUnion: { type: Date },
    dateSeparation: { type: Date },

    // Enfant
    couple_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Relation",
    },
    enfant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
    },
    filiationType: {
      type: String,
      enum: ["biologique", "adoption"],
    },
  },
  { timestamps: true }
);

// Validation ?

module.exports = mongoose.model("Relation", relationSchema);