import jwt from "jsonwebtoken";

export const isAdmin = (req, res, next) => {
  // Expect header: Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ msg: "Not authorized" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.adminEmail = decoded.email; // store admin email
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid token" });
  }
};
