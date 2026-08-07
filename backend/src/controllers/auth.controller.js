const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, name: user.name, phone: user.phone },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

exports.register = async (req, res, next) => {
  try {
    const { name, phone, password, role } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ message: "name, phone, password required" });
    }

    const exists = await User.findOne({ phone });
    if (exists) return res.status(409).json({ message: "Phone already registered" });

    const passwordHash = await bcrypt.hash(String(password), 10);

    const user = await User.create({
      name,
      phone,
      passwordHash,
      role: role || "patient",
    });

    const token = signToken(user);

    res.json({
      token,
      user: { id: user._id, name: user.name, phone: user.phone, role: user.role },
    });
  } catch (e) {
    next(e);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ message: "phone, password required" });

    const user = await User.findOne({ phone });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken(user);

    res.json({
      token,
      user: { id: user._id, name: user.name, phone: user.phone, role: user.role },
    });
  } catch (e) {
    next(e);
  }
};
