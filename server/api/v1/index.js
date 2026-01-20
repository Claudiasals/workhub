import express from "express";
import userRouter from "./routes/users.js";
import authRouter from "./routes/auth.js";
import meRouter from "./routes/me.js";
import pointOfSalesRouter from "./routes/pointOfSales.js";
import userShiftRouter from "./routes/userShift.js";
import userLeaveRouter from "./routes/userLeave.js";
import eventRouter from "./routes/event.js";
import orderRouter from "./routes/orderRoutes.js";
import productRouter from "./routes/product.js";
import itemsRouter from "./routes/items.js";
import customersRouter from "./routes/customers.js";
import ticketingRouter from "./routes/ticketing.js";

const app = express.Router();

// User management routes
app.use("/users", userRouter);

// Authentication routes
app.use("/auth", authRouter);

// Logged-in user profile routes
app.use("/me", meRouter);

// Points of sale routes
app.use("/pointsofsales", pointOfSalesRouter);

// User shift management routes
app.use("/shifts", userShiftRouter);

// User leave management routes
app.use("/leaves", userLeaveRouter);

// Event management routes
app.use("/events", eventRouter);

// Order management routes
app.use("/orders", orderRouter);

// Product catalog routes
app.use("/products", productRouter);

// Warehouse item routes
app.use("/items", itemsRouter);

// Customer management routes
app.use("/customers", customersRouter);

// Ticketing system routes
app.use("/ticketing", ticketingRouter);

export default app;
