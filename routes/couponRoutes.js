// routes/couponRoutes.js
import express from "express";
import { isAdmin } from "../middleware/authMiddleware.js";
import Coupon from "../models/Coupon.js";

const router = express.Router();

/*
  ======================
  ADMIN ROUTES (CRUD)
  ======================
*/

// GET /api/coupons
// List all coupons (admin)
router.get("/", isAdmin, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    console.error("Error fetching coupons", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/coupons/:id
// Get single coupon by ID (admin)
router.get("/:id", isAdmin, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    res.json(coupon);
  } catch (error) {
    console.error("Error fetching coupon", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/coupons
// Create coupon (admin)
router.post("/", isAdmin, async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscountValue,
      startDate,
      expiryDate,
      usageLimit,
      isActive,
    } = req.body;

    const normalizedCode = code && code.trim().toUpperCase();

    const existing = await Coupon.findOne({ code: normalizedCode });
    if (existing) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }

    const coupon = await Coupon.create({
      code: normalizedCode,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscountValue: maxDiscountValue || null,
      startDate: startDate || new Date(),
      expiryDate,
      usageLimit: usageLimit || null,
      isActive: typeof isActive === "boolean" ? isActive : true,
    });

    res.status(201).json(coupon);
  } catch (error) {
    console.error("Error creating coupon", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/coupons/:id
// Update coupon (admin)
router.put("/:id", isAdmin, async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.code) {
      updateData.code = updateData.code.trim().toUpperCase();

      const existing = await Coupon.findOne({
        code: updateData.code,
        _id: { $ne: req.params.id },
      });

      if (existing) {
        return res
          .status(400)
          .json({ message: "Another coupon with this code already exists" });
      }
    }

    const coupon = await Coupon.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    res.json(coupon);
  } catch (error) {
    console.error("Error updating coupon", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/coupons/:id
// Delete coupon (admin)
router.delete("/:id", isAdmin, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    res.json({ message: "Coupon deleted" });
  } catch (error) {
    console.error("Error deleting coupon", error);
    res.status(500).json({ message: "Server error" });
  }
});

/*
  ======================
  PUBLIC ROUTE (CHECK)
  ======================
*/

// POST /api/coupons/check
// body: { code, cartTotal }
// returns: { valid, discount, finalTotal, coupon, message }
router.post("/check", async (req, res) => {
  try {
    const { code, cartTotal } = req.body;

    if (!code || typeof cartTotal !== "number") {
      return res
        .status(400)
        .json({ message: "code and cartTotal are required" });
    }

    const normalizedCode = code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: normalizedCode });

    if (!coupon) {
      return res.status(400).json({ message: "Invalid coupon code" });
    }

    const now = new Date();

    if (!coupon.isActive) {
      return res.status(400).json({ message: "Coupon is not active" });
    }

    if (coupon.startDate && now < coupon.startDate) {
      return res.status(400).json({ message: "Coupon is not active yet" });
    }

    if (coupon.expiryDate && now > coupon.expiryDate) {
      return res.status(400).json({ message: "Coupon has expired" });
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: "Coupon usage limit reached" });
    }

    if (coupon.minOrderValue && cartTotal < coupon.minOrderValue) {
      return res.status(400).json({
        message: `Minimum order value is ${coupon.minOrderValue}`,
      });
    }

    // Calculate discount
    let discount = 0;

    if (coupon.discountType === "percent") {
      discount = (cartTotal * coupon.discountValue) / 100;

      if (
        coupon.maxDiscountValue !== null &&
        discount > coupon.maxDiscountValue
      ) {
        discount = coupon.maxDiscountValue;
      }
    } else if (coupon.discountType === "fixed") {
      discount = coupon.discountValue;
    }

    if (discount > cartTotal) {
      discount = cartTotal;
    }

    const finalTotal = cartTotal - discount;

    // Don't update usedCount here; do it after successful order placement

    res.json({
      valid: true,
      discount,
      finalTotal,
      coupon: {
        id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderValue: coupon.minOrderValue,
        maxDiscountValue: coupon.maxDiscountValue,
        expiryDate: coupon.expiryDate,
      },
    });
  } catch (error) {
    console.error("Error checking coupon", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
