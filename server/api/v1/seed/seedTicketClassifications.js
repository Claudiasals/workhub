import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import TicketModel from "../../../db/models/Ticket.js";
import UserModel from "../../../db/models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../../.env");

dotenv.config({ path: envPath });

const URI = process.env.DB_CONNECTION_URI;

const classificationSamples = [
  {
    priority: "alta",
    category: "tecnico",
    summary: "Problema tecnico urgente — intervento immediato",
    adminSuggestion: "Assegnare al reparto IT entro la giornata.",
  },
  {
    priority: "media",
    category: "magazzino",
    summary: "Anomalia magazzino da verificare",
    adminSuggestion: "Controllare giacenze e movimenti recenti.",
  },
  {
    priority: "bassa",
    category: "altro",
    summary: "Richiesta non urgente",
    adminSuggestion: "Pianificare intervento nella settimana.",
  },
  null,
];

const seedTicketPayloads = [
  {
    name: "seed-ticket-urgente-scanner",
    content: "Lo scanner del magazzino non sincronizza le giacenze dopo la lettura.",
    status: "open",
    aiClassification: {
      priority: "alta",
      category: "tecnico",
      summary: "Scanner non sincronizza giacenze",
      adminSuggestion: "Verificare connettività e API magazzino.",
      source: "heuristic",
      generatedAt: new Date(),
    },
  },
  {
    name: "seed-ticket-media-report",
    content: "Serve abilitare il report ordini per il responsabile di reparto.",
    status: "open",
    aiClassification: {
      priority: "media",
      category: "ordine",
      summary: "Richiesta permessi report ordini",
      adminSuggestion: "Abilitare ruolo report per il capo reparto.",
      source: "heuristic",
      generatedAt: new Date(),
    },
  },
  {
    name: "seed-ticket-bassa-bacheca",
    content: "La bacheca dovrebbe mostrare prima gli avvisi più recenti.",
    status: "open",
    aiClassification: {
      priority: "bassa",
      category: "altro",
      summary: "Ordinamento avvisi bacheca",
      adminSuggestion: "Valutare ordinamento per data decrescente.",
      source: "heuristic",
      generatedAt: new Date(),
    },
  },
  {
    name: "seed-ticket-non-classificato",
    content: "Ticket creato manualmente senza passare dalla classificazione AI.",
    status: "open",
  },
];

async function seedTicketClassifications() {
  try {
    if (!URI) {
      throw new Error("DB_CONNECTION_URI non configurato in server/.env");
    }

    console.log("Connecting to database...");
    await mongoose.connect(URI);

    const user = await UserModel.findOne().lean();
    if (!user) {
      throw new Error("Nessun utente trovato. Crea almeno un utente prima del seed ticket.");
    }

    const existingTickets = await TicketModel.find().sort({ createdAt: 1 });

    if (existingTickets.length === 0) {
      console.log("Nessun ticket esistente: inserimento ticket di esempio...");
      for (const payload of seedTicketPayloads) {
        await TicketModel.create({
          ...payload,
          user: user._id,
          name: `${payload.name}-${Date.now()}`,
        });
      }
      console.log(`Inseriti ${seedTicketPayloads.length} ticket con classificazioni miste.`);
    } else {
      console.log(`Aggiornamento ${existingTickets.length} ticket esistenti...`);
      for (let i = 0; i < existingTickets.length; i++) {
        const ticket = existingTickets[i];
        const sample = classificationSamples[i % classificationSamples.length];

        if (sample) {
          await TicketModel.findByIdAndUpdate(ticket._id, {
            aiClassification: {
              ...sample,
              source: "heuristic",
              generatedAt: ticket.createdAt || new Date(),
            },
          });
        } else {
          await TicketModel.findByIdAndUpdate(ticket._id, {
            $unset: { aiClassification: "" },
          });
        }
      }
      console.log("Classificazioni AI applicate in rotazione (alta, media, bassa, non classificato).");
    }

    const summary = await TicketModel.aggregate([
      {
        $group: {
          _id: "$aiClassification.priority",
          count: { $sum: 1 },
        },
      },
    ]);

    console.log("Riepilogo priorità nel database:");
    summary.forEach((row) => {
      console.log(`  ${row._id || "non classificato"}: ${row.count}`);
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Ticket classification seed failed:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedTicketClassifications();

// Run with: node server/api/v1/seed/seedTicketClassifications.js
