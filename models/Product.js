import mongoose from "mongoose";

const colorOptionSchema = new mongoose.Schema({
  colorName: { type: String, required: true },
  price: { type: Number },        // optional per-color price override
  imageURL: { type: String },     // optional image per color
});

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
