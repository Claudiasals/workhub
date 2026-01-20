import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import CategoryModel from "../../../db/models/Category.js";

// Resolve current file path (ESM compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve absolute path to the server .env file
const envPath = path.resolve(__dirname, "../../../.env");

// Load environment variables
dotenv.config({ path: envPath });

// MongoDB connection URI
const URI = process.env.DB_CONNECTION_URI;

// Categories to seed
const categories = [
  { name: "Living" },
  { name: "Bedroom" },
  { name: "Office" },
  { name: "Storage" },
  { name: "Tables & Chairs" },
];

// Seed categories collection
async function seedCategories() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(URI);

    console.log("Removing existing categories...");
    await CategoryModel.deleteMany();

    console.log("Inserting new categories...");
    const inserted = await CategoryModel.insertMany(categories);

    console.log(`Category seed completed (${inserted.length} records)`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Category seed failed:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Execute seed script
seedCategories();

// Run with: node server/api/v1/seed/seedCategories.js
