// routes/orders.js
import express from "express";
const router = express.Router();
import Order from "../models/Order.js";
import { isAdmin } from "../middleware/authMiddleware.js";


// NOTE: Add proper auth / admin checks as needed.

// GET /api/orders
// List orders with pagination for admin dashboard
router.get("/", isAdmin, async (req, res) => {
  try {
    // page & limit from query, with sane defaults
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 20, 1);

    const filter = {}; // later you can add status filters, date range, etc.

    const total = await Order.countDocuments(filter).exec();
    const pages = Math.max(Math.ceil(total / limit), 1);

    const pageToUse = Math.min(page, pages); // avoid asking for page > pages
    const skip = (pageToUse - 1) * limit;

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    // orders already include:
    // - items[].attributes
    // - paypalOrderId / paypalCaptureId / paypalPayerId
    // - notes
    return res.json({
      total,
      page: pageToUse,
      limit,
      pages,
      data: orders,
    });
  } catch (err) {
    console.error("Error fetching orders:", err);
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
});


// GET /api/orders/by-email/:email
// Get all orders for a given customer email (no pagination for now)
router.get("/by-email/:email", isAdmin, async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const orders = await Order.find({ "customer.email": email })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // each order includes attributes + PayPal fields automatically
    return res.json({ orders });
  } catch (err) {
    console.error("Error fetching orders by email:", err);
    return res.status(500).json({ error: "Failed to fetch orders by email" });
  }
});

// GET /api/orders/:id
// Get a single order by Mongo _id
router.get("/:id", isAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean().exec();
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    // order includes items[].attributes + PayPal fields + notes
    return res.json({ order });
  } catch (err) {
    console.error("Error fetching order by id:", err);
    return res.status(500).json({ error: "Failed to fetch order" });
  }
});

// PATCH /api/orders/:id
// Update order status / paymentStatus and PayPal refs / notes (admin)
router.patch("/:id", isAdmin, async (req, res) => {
  try {
    const {
      orderStatus,
      paymentStatus,
      paypalOrderId,
      paypalCaptureId,
      paypalPayerId,
      notes,
    } = req.body;

    const update = {};

    // statuses
    if (orderStatus) update.orderStatus = orderStatus;
    if (paymentStatus) update.paymentStatus = paymentStatus;

    // PayPal references (optional)
    if (paypalOrderId) update.paypalOrderId = paypalOrderId;
    if (paypalCaptureId) update.paypalCaptureId = paypalCaptureId;
    if (paypalPayerId) update.paypalPayerId = paypalPayerId;

    // notes (optional)
    if (typeof notes === "string") update.notes = notes;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    )
      .lean()
      .exec();

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.json({ order });
  } catch (err) {
    console.error("Error updating order:", err);
    return res.status(500).json({ error: "Failed to update order" });
  }
});

export default router;
