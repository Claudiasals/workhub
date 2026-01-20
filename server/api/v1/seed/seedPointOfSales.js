import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import PointOfSalesModel from "../../../db/models/PointOfSales.js";

// Resolve current file path (ESM compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve absolute path to the server .env file
const envPath = path.resolve(__dirname, "../../../.env");

// Load environment variables
dotenv.config({ path: envPath });

// MongoDB connection URI
const URI = process.env.DB_CONNECTION_URI;

// Points of sale seed data
const posData = [
  {
    name: "IKEA Roma Anagnina",
    location: {
      address: "Via Anagnina, 81",
      city: "Roma",
      state: "RM",
      zipCode: "00173",
      country: "Italy",
    },
  },
  {
    name: "IKEA Napoli Afragola",
    location: {
      address: "Via Padula, 80021 Afragola (NA)",
      city: "Afragola",
      state: "NA",
      zipCode: "80021",
      country: "Italy",
    },
  },
  {
    name: "IKEA Milano San Giuliano",
    location: {
      address: "Via Po, 1",
      city: "San Giuliano Milanese",
      state: "MI",
      zipCode: "20098",
      country: "Italy",
    },
  },
];

// Seed points of sale collection
async function seedPointsOfSales() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(URI);

    console.log("Removing existing points of sale...");
    await PointOfSalesModel.deleteMany();

    console.log("Inserting new points of sale...");
    const inserted = await PointOfSalesModel.insertMany(posData);

    console.log(`POS seed completed (${inserted.length} records)`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("POS seed failed:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Execute seed script
seedPointsOfSales();

// Run with: node server/api/v1/seed/seedPointOfSales.js
