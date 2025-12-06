// middleware/upload.js
import multer from "multer";
import sharp from "sharp";

// We only need memory storage now, no filesystem
const storage = multer.memoryStorage();

// Fields expected from the frontend
export const upload = multer({ storage }).fields([
  { name: "images", maxCount: 10 },
  { name: "colorImages", maxCount: 20 },
]);

/**
 * Compress images and return them as base64 data URLs (to be stored directly in DB).
 * 
 * @param {Array|Object} files - files from multer (req.files.images or req.files.colorImages)
 * @returns {Promise<string[]>} - array of "data:image/jpeg;base64,..." strings
 */
export const compressAndSaveImages = async (files) => {
  const savedImages = [];

  // Normalise input (multer can give array or object depending on how it's passed)
  let fileArray = [];
  if (Array.isArray(files)) {
    fileArray = files;
  } else if (files && typeof files === "object") {
    for (const key in files) {
      fileArray.push(...files[key]);
    }
  }

  for (const file of fileArray) {
    // Compress and resize image in memory
    const compressedBuffer = await sharp(file.buffer)
      .jpeg({ quality: 80 })
      .resize({ width: 1600, withoutEnlargement: true })
      .toBuffer();

    // Convert to base64 data URL to store directly in DB
    const base64 = compressedBuffer.toString("base64");
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    savedImages.push(dataUrl);
  }

  return savedImages;
};
