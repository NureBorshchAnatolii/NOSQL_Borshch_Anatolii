require("dotenv").config();
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/config/swagger");
const connectDB = require("./src/config/connection");

const authRoutes = require("./src/routes/auth");
const userRoutes = require("./src/routes/users");
const categoryRoutes = require("./src/routes/categories");
const testRoutes = require("./src/routes/tests");
const attemptRoutes = require("./src/routes/attempts");
const lab1Routes = require("./src/routes/lab1");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Testing App API",
    swaggerOptions: {
      persistAuthorization: true,
    },
  }),
);

app.get("/api/docs.json", (_, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/queries", lab1Routes);

app.use((req, res) => res.status(404).json({ message: "Route not found" }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger docs http://localhost:${PORT}/api/docs`);
});
