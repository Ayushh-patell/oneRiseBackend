// models/Order.js
import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true }, // your product id or SKU
    name: { type: String, required: true },
    colorName: { type: String },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true }, // in major units, e.g. 499.99
    lineTotal: { type: Number, required: true }, // unitPrice * quantity
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    fullName: String,
    email: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer: customerSchema,
    items: {
      type: [orderItemSchema],
      default: [],
    },
    subtotal: { type: Number, required: true }, // sum of lineTotal
    currency: { type: String, default: "usd" },

    // statuses
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "canceled"],
      default: "pending",
    },
    orderStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "completed", "cancelled"],
      default: "pending",
    },

    // Stripe refs
    stripeSessionId: { type: String, index: true },
    stripePaymentIntentId: { type: String },
    stripeCustomerId: { type: String },

    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
