const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/users.routes");
const memberRoutes = require("./routes/members.routes");
const relationRoutes = require("./routes/relations.routes");
const treeRoutes = require("./routes/tree.routes");
const searchRoutes = require("./routes/search.routes");
const statsRoutes = require("./routes/stats.routes");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// Rendre io accessible dans tous les controllers via req.app.get("io")
app.set("io", io);

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/relations", relationRoutes);
app.use("/api/tree", treeRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/stats", statsRoutes);

// Socket.IO
io.on("connection", (socket) => {
  console.log("Client connecté :", socket.id);

  socket.on("disconnect", () => {
    console.log("Client déconnecté :", socket.id);
  });
});

// Connexion MongoDB + démarrage serveur
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connecté");
    server.listen(process.env.PORT || 3000, () => {
      console.log(`Serveur démarré sur le port ${process.env.PORT || 3000}`);
    });
  })
  .catch((err) => console.error("Erreur MongoDB :", err));