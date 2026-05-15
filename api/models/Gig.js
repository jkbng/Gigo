const mongoose = require("mongoose");

const gigSchema = new mongoose.Schema(
  {
    title:    { type: String, required: true, trim: true },
    category: { type: String, enum: ["Delivery","Cleaning","Moving","Event","Tech","Teaching","Other"], default: "Other" },
    company:  { type: String, required: true, trim: true },
    pay:      { type: String, required: true },
    payType:  { type: String, enum: ["hourly","daily","fixed"], default: "daily" },
    duration: { type: String, default: "1 day" },
    slots:          { type: Number, default: 1 },
    slotsRemaining: { type: Number, default: 1 },
    description:  { type: String, default: "" },
    requirements: [String],
    expiresAt: {
      type: Date,
      required: true,
      default: () => {
        const d = new Date();
        d.setHours(23, 59, 59, 999);
        return d;
      },
    },
    location: {
      type:        { type: String, enum: ["Point"], required: true, default: "Point" },
      coordinates: { type: [Number], required: true },
      address:     { type: String, default: "" },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

gigSchema.index({ location: "2dsphere" });
gigSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
module.exports = mongoose.models.Gig || mongoose.model("Gig", gigSchema);
