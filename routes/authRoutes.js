import express from "express";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const router = express.Router();

// LOGIN ONLY
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the admin user
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    // Token only stores email
    const token = jwt.sign(
      { email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return token in response (frontend will store it)
    res.json({ msg: "Login successful", token });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// LOGOUT
// Since no cookies, logout is just frontend removing the token
router.post("/logout", (req, res) => {
  res.json({ msg: "Logged out" });
});

// VERIFY
router.get("/verify", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
      return res.status(401).json({ message: "Unauthorized" });

    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET);

    res.json({ success: true });
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
});

export default router;
