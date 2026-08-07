const Appointment = require("../models/Appointment");
const User = require("../models/User");

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

exports.createAppointment = async (req, res, next) => {
  try {
    const { doctorId, department, date, time, note } = req.body;

    if (!doctorId || !department || !date || !time) {
      return res.status(400).json({ message: "doctorId, department, date, time required" });
    }

    const patient = await User.findById(req.user.id);
    if (!patient) return res.status(401).json({ message: "Invalid user" });

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") return res.status(400).json({ message: "Invalid doctorId" });

    const appt = await Appointment.create({
      patientId: patient._id,
      doctorId: doctor._id,
      patientName: patient.name,
      doctorName: doctor.name,
      department,
      date,
      time,
      note: note || "",
      status: "pending",
    });

    res.json(appt);
  } catch (e) {
    next(e);
  }
};

exports.myAppointments = async (req, res, next) => {
  try {
    const list = await Appointment.find({ patientId: req.user.id })
      .sort({ date: -1, time: -1 })
      .lean();

    res.json(list);
  } catch (e) {
    next(e);
  }
};

exports.queueAppointments = async (req, res, next) => {
  try {
    const list = await Appointment.find().sort({ date: -1, time: -1 }).lean();
    res.json(list);
  } catch (e) {
    next(e);
  }
};

exports.doctorToday = async (req, res, next) => {
  try {
    const key = todayKey();
    const list = await Appointment.find({ doctorId: req.user.id, date: key })
      .sort({ time: 1 })
      .lean();

    res.json({ date: key, items: list });
  } catch (e) {
    next(e);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["pending", "upcoming", "arrived", "done", "cancelled"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status" });

    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ message: "Not found" });

    // doctor can only update their own appointments
    if (req.user.role === "doctor" && appt.doctorId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    appt.status = status;
    await appt.save();

    res.json(appt);
  } catch (e) {
    next(e);
  }
};

exports.cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ message: "Not found" });

    // patient can only cancel their own
    if (req.user.role === "patient" && appt.patientId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    appt.status = "cancelled";
    await appt.save();

    res.json(appt);
  } catch (e) {
    next(e);
  }
};
