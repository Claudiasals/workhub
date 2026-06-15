import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { seedCalendarWeek } from "./seedCalendarWeek.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../../.env");

dotenv.config({ path: envPath });

const URI = process.env.DB_CONNECTION_URI;

async function run() {
  try {
    if (!URI) {
      throw new Error("DB_CONNECTION_URI missing in .env");
    }

    console.log("Connecting to database...");
    await mongoose.connect(URI);

    const result = await seedCalendarWeek();
    console.log("Calendar week seed completed:", result);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Calendar week seed failed:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

run();
