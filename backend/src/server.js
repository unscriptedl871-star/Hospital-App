require("dotenv").config();
const app = require("./app");
const connectDb = require("./utils/connectDb");

const PORT = process.env.PORT || 4000;

app.listen(PORT, "0.0.0.0", () =>
  console.log(`API running on http://0.0.0.0:${PORT}`)
);


(async () => {
  await connectDb();
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
})();
