import mongoose from "mongoose";
import Admin from "./models/Admin.js";
import dotenv from "dotenv";

dotenv.config();

const createAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  await Admin.deleteMany(); // Optional: remove old admin

  await Admin.create({
    email: "admin@oneRiseGroup",
    password: "ORGpwmmAP1209"
  });

  console.log("Admin created");
  process.exit();
};

createAdmin();
