// models/couponModel.js
import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true, // normalize so checks are easier
    },
    description: {
      type: String,
      default: "",
    },
    discountType: {
      type: String,
      enum: ["percent", "fixed"],
      default: "percent",
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      // example: 10 -> 10% for 'percent', or 10 -> ₹10 / $10 for 'fixed'
    },
    minOrderValue: {
      type: Number,
      default: 0, // no minimum by default
    },
    maxDiscountValue: {
      type: Number,
      default: null, // only used when type = 'percent'
    },
    startDate: {
      type: Date,
      default: () => new Date(),
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      default: null, // total allowed uses (across everyone). null = unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
