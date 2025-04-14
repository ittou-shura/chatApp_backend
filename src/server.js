import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

// Import your modules
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";

dotenv.config();

const PORT = process.env.PORT || 5002;

// Create the Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS options
const io = new Server(server, {
  cors: {
    origin: "https://chatty-beta-snowy.vercel.app",
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Used to store online users mapping: { userId: socketId }
const userSocketMap = {};

// Utility to retrieve a user's socket ID
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  // Retrieve the userId from the handshake query and store it
  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // Emit online users list to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // On disconnect, remove the user and update all clients
  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// Attach middleware to the Express app
app.use(cors({
  origin: "https://chatty-beta-snowy.vercel.app",
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Attach routes to the Express app
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Uncomment and configure if serving static files in production
// import path from "path";
// const __dirname = path.resolve();
// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname, "../frontend/dist")));
//   app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
//   });
// }

// Start the server and connect to the database
server.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
});

// Export io, app, and server if needed elsewhere
export { io, app, server };
