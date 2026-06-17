import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import {handleSearch} from "./search.js";
import { transcribeFile, checkLanguage } from "./transcribe.js";
import multer from "multer";
import upload from "./upload.js";
import cors from "cors";
dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 3000;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads")
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})


// app.post("/api/search", (req, res) => {
//   // audio search logic here
//   res.json([
//     {
//         "surah": 112,
//         "ayah": 1,
//         "text": "قل هو الله احد",
//         "normalizedText": "قل هو الله احد",
//         "percentage": "64.64%"
//     },
//   ]);
// });
app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

app.post("/api/search", upload.single("audio"),async  (req, res) => {
  try {
    let query = "";
    const selectedLanguage = req.body.language || "ar";

    if (req.file) {
      // Audio search: transcribe the uploaded file path to text
      const audioUrl = req.file.path;
      query = await transcribeFile(audioUrl, selectedLanguage);
    } else if (req.body.text) {
      // Text search: use the query provided in the request body
      query = req.body.text;
    } else {
      // No valid input provided
      return res.status(400).json({ error: "Missing search input (audio file or text query)" });
    }

    const result = await handleSearch(query);
    res.json(result);
  } catch (error) {
    console.error("Search processing error:", error);
    res.status(500).json({ error: "An error occurred while processing your search request." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
 
