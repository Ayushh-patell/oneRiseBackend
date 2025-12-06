// models/Blog.js
import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // HTML content – can contain <p>, <h1>, <h2>, <ul>, <li>, etc.
    content: {
      type: String,
      required: true,
    },

    author: {
      type: String,
      required: true,
      trim: true,
    },

    // Publish date (separate from createdAt/updatedAt)
    date: {
      type: Date,
      default: Date.now,
    },

    // SEO fields (optional)
    metaTitle: {
      type: String,
      trim: true,
    },
    metaDesc: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

export default mongoose.model("Blog", blogSchema);
