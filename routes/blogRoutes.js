// routes/blog.js
import express from "express";
import Blog from "../models/Blog.js";
import { isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

/* -------------------------------
   CREATE BLOG POST
   POST /api/blog/create
--------------------------------*/
router.post("/create", isAdmin, async (req, res) => {
  try {
    const { title, content, author, date, metaTitle, metaDesc } = req.body;

    if (!title?.trim() || !content?.trim() || !author?.trim()) {
      return res
        .status(400)
        .json({ msg: "Title, content, and author are required" });
    }

    const blog = await Blog.create({
      title: title.trim(),
      content, // HTML string
      author: author.trim(),
      date: date ? new Date(date) : undefined,
      metaTitle,
      metaDesc,
    });

    res.json({ msg: "Blog post created", blog });
  } catch (err) {
    console.error("Error creating blog:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

/* -------------------------------
   GET ALL BLOG POSTS (with basic pagination)
   GET /api/blog
   Query:
     - page  (optional, default 1)
     - limit (optional, default 10)
--------------------------------*/
router.get("/", async (req, res) => {
  try {
    let { page = "1", limit = "10" } = req.query;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (pageNumber - 1) * limitNumber;

    const [posts, total] = await Promise.all([
      Blog.find()
        .sort({ date: -1 }) // newest first by publish date
        .skip(skip)
        .limit(limitNumber),
      Blog.countDocuments(),
    ]);

    res.json({
      total,
      page: pageNumber,
      limit: limitNumber,
      pages: Math.max(Math.ceil(total / limitNumber), 1),
      data: posts,
    });
  } catch (err) {
    console.error("Error fetching blogs:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

/* -------------------------------
   GET SINGLE BLOG BY ID
   GET /api/blog/:id
--------------------------------*/
router.get("/:id", async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Blog post not found" });

    res.json(post);
  } catch (err) {
    console.error("Error fetching blog:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

/* -------------------------------
   UPDATE BLOG POST
   PUT /api/blog/update/:id
--------------------------------*/
router.put("/update/:id", isAdmin, async (req, res) => {
  try {
    const { title, content, author, date, metaTitle, metaDesc } = req.body;

    const updateFields = {};

    if (title !== undefined) updateFields.title = title;
    if (content !== undefined) updateFields.content = content;
    if (author !== undefined) updateFields.author = author;
    if (date !== undefined) updateFields.date = new Date(date);
    if (metaTitle !== undefined) updateFields.metaTitle = metaTitle;
    if (metaDesc !== undefined) updateFields.metaDesc = metaDesc;

    const updated = await Blog.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ msg: "Blog post not found" });

    res.json({ msg: "Blog post updated", blog: updated });
  } catch (err) {
    console.error("Error updating blog:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

/* -------------------------------
   DELETE BLOG POST
   DELETE /api/blog/delete/:id
--------------------------------*/
router.delete("/delete/:id", isAdmin, async (req, res) => {
  try {
    const deleted = await Blog.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ msg: "Blog post not found" });

    res.json({ msg: "Blog post deleted" });
  } catch (err) {
    console.error("Error deleting blog:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
