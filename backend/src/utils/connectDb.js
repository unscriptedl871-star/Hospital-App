const mongoose = require("mongoose");

module.exports = async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI missing in .env");

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);

  console.log("✅ MongoDB connected");
};
