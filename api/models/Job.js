const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title:   { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    type:    { type: String, enum: ["Full-time","Part-time","Contract","Internship","Remote"], default: "Full-time" },
    salary:  { type: String, default: "" },
    tags:    [String],
    description: { type: String, default: "" },
    location: {
      type:        { type: String, enum: ["Point"], required: true, default: "Point" },
      coordinates: { type: [Number], required: true },
      address:     { type: String, default: "" },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

jobSchema.index({ location: "2dsphere" });
module.exports = mongoose.models.Job || mongoose.model("Job", jobSchema);
