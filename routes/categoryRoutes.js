import express from "express";
import Category from "../models/Category.js";
import { isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// CREATE
router.post("/create", isAdmin, async (req, res) => {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ msg: "Name and slug required" });
    }

    const exists = await Category.findOne({ slug });
    if (exists) return res.status(400).json({ msg: "Category already exists" });

    const cat = await Category.create({ name, slug });

    res.json({ msg: "Category created", category: cat });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// GET ALL
router.get("/get-all", async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json({ categories });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// UPDATE
router.put("/update/:id", isAdmin, async (req, res) => {
  try {
    const { name, slug } = req.body;
    const { id } = req.params;

    const updated = await Category.findByIdAndUpdate(
      id,
      { name, slug },
      { new: true }
    );

    res.json({ msg: "Category updated", category: updated });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// DELETE
router.delete("/delete/:id", isAdmin, async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ msg: "Category deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
