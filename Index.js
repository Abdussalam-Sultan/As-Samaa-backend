import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import {searchQuran, getAyah} from "./search.js";
import  transcribeFile from "./transcribe.js";
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
  //const query = req.body.query;
  console.log("REQ FILE:", req.file);
  const audioUrl = req.file.path;
  const query = await transcribeFile(audioUrl);
  const results = await searchQuran(query)
  const enrichedResults = await getAyah(results);

  res.json(enrichedResults);
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
 
