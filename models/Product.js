import mongoose from "mongoose";

const colorOptionSchema = new mongoose.Schema(
  {
    colorName: { type: String, required: true },
    price: { type: Number }, // optional per-color price override
    imageURL: { type: String }, // optional image per color
  },
  { _id: false }
);

const optionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    price: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

// attribute: e.g. { name: "Size", options: [{label:"S",price:0},{label:"M",price:50}] }
const attributeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    options: { type: [optionSchema], required: true, default: [] }, // ✅ array of {label, price}
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    desc: { type: String },
    longDesc: { type: String },
    category: { type: String, required: true },

    // base price (used when no color price is set / color not mandatory)
    price: { type: Number, required: true },

    additionalInfo: { type: String },

    imageURLs: [{ type: String }],

    colorOptions: { type: [colorOptionSchema], default: [] },

    // if true, user must select a color before adding to cart
    colorRequired: { type: Boolean, default: false },

    // generic attributes like Size, Material, etc.
    attributes: { type: [attributeSchema], default: [] },

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
