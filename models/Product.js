import mongoose from "mongoose";

const colorOptionSchema = new mongoose.Schema({
  colorName: { type: String, required: true },
  price: { type: Number },        // optional per-color price override
  imageURL: { type: String },     // optional image per color
});

// attribute: e.g. { name: "Size", options: ["S", "M", "L"] }
const attributeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    options: { type: [String], required: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    desc: { type: String },
    longDesc: { type: String },
    category: { type: String, required: true },

    // base price (used when no color price is set / color not mandatory)
    price: { type: Number, required: true },

    additionalInfo: { type: String },

    imageURLs: [{ type: String }],

    colorOptions: [colorOptionSchema], // optional colors with optional image/price

    // NEW: if true, user must select a color before adding to cart
    colorRequired: { type: Boolean, default: false },

    // NEW: generic attributes like Size, Material, etc.
    attributes: [attributeSchema],

    ratings: [
      {
        stars: { type: Number, min: 1, max: 5 },
        review: { type: String },
        user: { type: String }, // email or username
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
