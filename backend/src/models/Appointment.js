const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    patientName: { type: String, trim: true },
    doctorName: { type: String, trim: true },

    department: { type: String, required: true, trim: true },
    date: { type: String, required: true, trim: true }, // "YYYY-MM-DD"
    time: { type: String, required: true, trim: true }, // "HH:mm"

    status: {
      type: String,
      enum: ["pending", "upcoming", "arrived", "done", "cancelled"],
      default: "pending",
    },

    note: { type: String, default: "" },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctorId: 1, date: 1 });
appointmentSchema.index({ patientId: 1, date: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
