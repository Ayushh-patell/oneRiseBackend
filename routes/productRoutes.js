import express from "express";
import Product from "../models/Product.js";
import { upload, compressAndSaveImages } from "../middleware/upload.js";
import { isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

/* -------------------------------
   CREATE PRODUCT
--------------------------------*/
router.post("/create", isAdmin, upload, async (req, res) => {
  try {
    const {
      name,
      desc,
      longDesc,
      category,
      price,
      additionalInfo,
      colorOptions,
      colorRequired, // "true"/"false" or boolean
      attributes,    // NEW: JSON string of [{ name, options: [...] }]
    } = req.body;

    // Parse color options (array of { colorName, price? })
    let parsedColors = [];
    if (colorOptions) {
      try {
        parsedColors = JSON.parse(colorOptions);
      } catch (e) {
        console.error("Failed to parse colorOptions JSON", e);
      }
    }

    // Parse attributes (array of { name, options: [String] })
    let parsedAttributes = [];
    if (attributes) {
      try {
        parsedAttributes = JSON.parse(attributes);
      } catch (e) {
        console.error("Failed to parse attributes JSON", e);
      }
    }

    let imageURLs = [];
    let colorImageURLs = [];

    // ==== MAIN IMAGES ====
    if (req.files?.images) {
      imageURLs = await compressAndSaveImages(
        req.files.images || req.files["images"]
      );
    }

    // ==== COLOR IMAGES ====
    if (req.files?.colorImages) {
      colorImageURLs = await compressAndSaveImages(
        req.files.colorImages || req.files["colorImages"]
      );
    }

    // Attach image urls & numeric price to colorOptions in order
    const finalColorOptions = parsedColors.map((c, index) => ({
      colorName: c.colorName,
      price:
        c.price !== undefined && c.price !== ""
          ? Number(c.price)
          : undefined,
      imageURL: colorImageURLs[index] || "",
    }));

    const product = await Product.create({
      name,
      desc,
      longDesc,
      category,
      price: Number(price),
      additionalInfo,
      imageURLs,
      colorOptions: finalColorOptions,
      colorRequired:
        colorRequired === true || colorRequired === "true" ? true : false,
      attributes: parsedAttributes, // NEW
    });

    res.json({ msg: "Product created", product });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

/* ------------------------------
   GET PRODUCTS
   Query params:
     - category (optional): filter by category name
     - page     (optional): page number (default 1)
     - limit    (optional): items per page (default 12)
     - minPrice (optional): minimum price (inclusive)
     - maxPrice (optional): maximum price (inclusive)
   NOTE: price range checks both base price AND colorOptions.price
--------------------------------*/
router.get("/", async (req, res) => {
  try {
    let { category, page = "1", limit = "12", minPrice, maxPrice } = req.query;

    // pagination
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.max(parseInt(limit, 10) || 12, 1);
    const skip = (pageNumber - 1) * limitNumber;

    const filter = {};

    // category filter (exact match; change to regex if you want case-insensitive)
    if (category) {
      filter.category = category;
      // case-insensitive example:
      // filter.category = new RegExp(`^${category}$`, "i");
    }

    // price filter (checks both product.price and colorOptions.price)
    let min =
      minPrice !== undefined && minPrice !== "" ? Number(minPrice) : null;
    let max =
      maxPrice !== undefined && maxPrice !== "" ? Number(maxPrice) : null;

    if (
      (min !== null && Number.isNaN(min)) ||
      (max !== null && Number.isNaN(max))
    ) {
      return res
        .status(400)
        .json({ message: "minPrice and maxPrice must be valid numbers" });
    }

    if (min !== null && max !== null && min > max) {
      // swap to be forgiving
      const temp = min;
      min = max;
      max = temp;
    }

    if (min !== null || max !== null) {
      const priceRange = {};
      if (min !== null) priceRange.$gte = min;
      if (max !== null) priceRange.$lte = max;

      // match either base price or any colorOptions.price in range
      filter.$or = [
        { price: priceRange },
        { colorOptions: { $elemMatch: { price: priceRange } } },
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),
      Product.countDocuments(filter),
    ]);

    res.json({
      total, // total items matching filter
      page: pageNumber,
      limit: limitNumber,
      pages: Math.max(Math.ceil(total / limitNumber), 1),
      data: products,
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ message: "Server error fetching products" });
  }
});

/* -------------------------------
   GET PRODUCT BY ID
--------------------------------*/
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ msg: "Product not found" });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

/* -------------------------------
   UPDATE PRODUCT
--------------------------------*/
router.put("/update/:id", isAdmin, upload, async (req, res) => {
  try {
    const data = req.body;

    // Parse existing main image URLs
    let existingImages = [];
    if (data.existingImages) {
      try {
        existingImages = JSON.parse(data.existingImages);
      } catch (e) {
        console.error("Failed to parse existingImages JSON", e);
      }
    }

    // Parse color options JSON
    // expected shape from frontend per color:
    // { colorName, price, existingImage }
    let colorOptionsRaw = [];
    if (data.colorOptions) {
      try {
        colorOptionsRaw = JSON.parse(data.colorOptions);
      } catch (e) {
        console.error("Failed to parse colorOptions JSON", e);
      }
    }

    // base color options (before new uploads)
    let colorOptions = colorOptionsRaw.map((c) => ({
      colorName: c.colorName,
      price:
        c.price !== undefined && c.price !== ""
          ? Number(c.price)
          : undefined,
      imageURL: c.existingImage || null,
    }));

    // Parse attributes JSON
    // expected shape: [{ name, options: [{label, price}], }]
    let parsedAttributes = [];
    if (data.attributes) {
      try {
        parsedAttributes = JSON.parse(data.attributes);
      } catch (e) {
        console.error("Failed to parse attributes JSON", e);
      }
    }

    const updateFields = {
      name: data.name,
      desc: data.desc,
      longDesc: data.longDesc,
      category: data.category,
      price: data.price ? Number(data.price) : undefined,
      additionalInfo: data.additionalInfo,
      colorRequired:
        data.colorRequired === true || data.colorRequired === "true"
          ? true
          : false,
      colorOptions,
      attributes: parsedAttributes, // NEW
    };

    // ---- MAIN IMAGES ----
    if (req.files?.images?.length) {
      const newImgs = await compressAndSaveImages(req.files.images);
      updateFields.imageURLs = [...existingImages, ...newImgs];
    } else {
      updateFields.imageURLs = existingImages;
    }

    // ---- COLOR IMAGES ----
    if (req.files?.colorImages?.length) {
      const newColorImgs = await compressAndSaveImages(req.files.colorImages);
      let colorImagesIndex = 0;

      updateFields.colorOptions = updateFields.colorOptions.map((c) => {
        if (c.imageURL) return c; // keep existing
        const newImgPath = newColorImgs[colorImagesIndex++];
        if (newImgPath) c.imageURL = newImgPath;
        return c;
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );

    res.json({ msg: "Product updated", updatedProduct });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

/* -------------------------------
   ADD RATING TO PRODUCT
   (used by product page frontend)
--------------------------------*/
router.post("/:id/ratings", async (req, res) => {
  try {
    const { stars, review, user } = req.body;

    const starsNumber = Number(stars);
    if (!starsNumber || starsNumber < 1 || starsNumber > 5) {
      return res
        .status(400)
        .json({ msg: "Stars must be a number between 1 and 5" });
    }

    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ msg: "Product not found" });

    product.ratings.push({
      stars: starsNumber,
      review,
      user,
    });

    await product.save();

    // Return updated product (easier for frontend to refresh state)
    res.json(product);
  } catch (err) {
    console.error("Error adding rating:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

/* -------------------------------
   DELETE PRODUCT
--------------------------------*/
router.delete("/delete/:id", isAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ msg: "Product deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
