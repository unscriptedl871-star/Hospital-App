const router = require("express").Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const c = require("../controllers/appointments.controller");

// optional helper route (so browser doesn't show "Cannot GET /appointments")
router.get("/", (req, res) =>
  res.json({ message: "Use /appointments/my, /appointments/today, /appointments/queue" })
);

// Patient
router.post("/", requireAuth, requireRole("patient"), c.createAppointment);
router.get("/my", requireAuth, requireRole("patient"), c.myAppointments);
router.patch("/:id/cancel", requireAuth, requireRole("patient", "reception", "admin"), c.cancelAppointment);

// Reception/Admin
router.get("/queue", requireAuth, requireRole("reception", "admin"), c.queueAppointments);

// Doctor/Admin
router.get("/today", requireAuth, requireRole("doctor", "admin"), c.doctorToday);

// Status updates (reception/doctor/admin)
router.patch("/:id/status", requireAuth, requireRole("reception", "doctor", "admin"), c.updateStatus);

module.exports = router;
