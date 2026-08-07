const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const appointmentRoutes = require("./routes/appointments.routes");
const usersRoutes = require("./routes/users.routes");


const app = express();

app.use(cors());
app.use(express.json());
app.use("/users", usersRoutes);


app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/appointments", appointmentRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

module.exports = app;
