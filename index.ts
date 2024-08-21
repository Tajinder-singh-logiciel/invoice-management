import express from "express";
import mongoose from "mongoose";
import invoiceRoutes from "./routes/invoiceRoutes";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from a .env file

const app = express();
const port = process.env.PORT || 5000;

// MongoDB Atlas connection
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/invoice")
  .then(() => console.log("MongoDB connected to Atlas"))
  .catch((err) => console.log("Error connecting to MongoDB:", err));

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api", invoiceRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
