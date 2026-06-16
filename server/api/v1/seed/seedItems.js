import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import ItemModel from "../../../db/models/Item.js";
import ProductModel from "../../../db/models/Product.js";
import PointOfSalesModel from "../../../db/models/PointOfSales.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../../.env");

dotenv.config({ path: envPath });

const URI = process.env.DB_CONNECTION_URI;

async function seedItems() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(URI);

    const [products, pointsOfSale] = await Promise.all([
      ProductModel.find().lean(),
      PointOfSalesModel.find().lean(),
    ]);

    if (!products.length) {
      throw new Error("Nessun prodotto trovato. Esegui prima seedProducts.js");
    }

    if (!pointsOfSale.length) {
      throw new Error("Nessuna sede trovata. Esegui prima seedPointOfSales.js");
    }

    console.log("Removing existing warehouse items...");
    await ItemModel.deleteMany();

    const docs = [];

    pointsOfSale.forEach((pos, posIndex) => {
      products.forEach((product, productIndex) => {
        docs.push({
          product: product._id,
          pointOfSales: pos._id,
          stock: 12 + ((posIndex + productIndex) % 8) * 3,
          stockLimit: 10,
          note: "",
        });
      });
    });

    console.log(`Inserting ${docs.length} warehouse items...`);
    const inserted = await ItemModel.insertMany(docs);

    console.log(`Item seed completed (${inserted.length} records)`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Item seed failed:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedItems();

// Run with: node server/api/v1/seed/seedItems.js
