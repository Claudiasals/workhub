import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import { connect as connectDb } from "./db/index.js";
import apiRouter from "./api/index.js";

dotenv.config();

const app = express();

const allowedOrigins = new Set(
	[
		process.env.CLIENT_URL,
		"http://localhost:5173",
		"http://127.0.0.1:5173",
		"http://localhost:5174",
		"http://127.0.0.1:5174",
	].filter(Boolean)
);

// CORS configuration
app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin || allowedOrigins.has(origin)) {
				callback(null, true);
				return;
			}

			const isLocalDevOrigin =
				process.env.SERVER_ENV === "development" &&
				/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

			if (isLocalDevOrigin) {
				callback(null, true);
				return;
			}

			callback(new Error(`Origin ${origin} not allowed by CORS`));
		},
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], // Allowed HTTP methods
		credentials: true, // Allow credentials (cookies, authorization headers, etc.)
	})
);

// Global middlewares
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple health-check endpoint
app.get("/", (req, res) => {
	res.json({ success: true, message: "WorkHub API is running" });
});

// All APIs are under /api
app.use("/api", apiRouter);

// Port from .env or default
const PORT = process.env.SERVER_PORT || 3030;

const startServer = async () => {
	try {
		await connectDb();

		app.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
		});
	} catch (err) {
		console.error("Failed to start server:", err);
		process.exit(1);
	}
};

startServer();
