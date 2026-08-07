const router = require("express").Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const User = require("../models/User");

// Doctors list (for Find Doctor / Booking)
router.get(
  "/doctors",
  requireAuth,
  requireRole("patient", "reception", "admin", "doctor"),
  async (req, res, next) => {
    try {
      const doctors = await User.find({ role: "doctor" })
        .select("_id name phone role")
        .sort({ name: 1 })
        .lean();

      res.json(
        doctors.map((d) => ({
          id: d._id.toString(),
          name: d.name,
          phone: d.phone,
          role: d.role,
        }))
      );
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
