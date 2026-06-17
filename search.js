import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";
import Fuse from "fuse.js";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

  function normalizeArabic(text) {
  return text
    .replace(/[\u064B-\u065F\u0610-\u061A\u06D6-\u06ED]/g, "") // tashkeel
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // invisible chars
    .replace(/ـ/g, "") // tatweel
    .replace(/ٰ/g, "") // remove dagger alif IMPORTANT
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}
function normalizeEnglish(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // remove punctuation
    .replace(/\s+/g, " ")
    .trim();
}
function detectInputMode(text) {
  const hasArabic = /[\u0600-\u06FF]/.test(text);

  if (hasArabic) return "arabic";
  return "english";
}

const quran = JSON.parse(fs.readFileSync(`./quran_normalized1.json`, "utf8"));
const enrichedQuran = quran.map((verse) => ({
  ...verse,

  search_text:
    normalizeArabic(verse.ayah_ar) +
    " " +
    normalizeEnglish(verse.ayah_en)
}));

const fuse = new Fuse(enrichedQuran, {
  keys: ["search_text"],
  includeScore: true,
  threshold: 0.5,
  distance: 1000,
  minMatchCharLength: 3,
  ignoreLocation: true,          // Finds the word no matter where it sits in the verse
  findAllMatches: true 
});




function scoreToPercentage(score) {
  return ((1 - score) * 100).toFixed(2) + "%";
}

 async function searchQuran(queryDefault) {
  console.log(`Received search query: "${queryDefault}"`);

  if (!queryDefault || typeof queryDefault !== "string") {
    return "Invalid query.";
  }
  const query =
    normalizeArabic(queryDefault) + " " + normalizeEnglish(queryDefault);

  const results = fuse.search(query);

  if (!results.length) {
    return "No results found.";
  }

  return results.map((result) => ({
    query,
    score: result.score,
    percentage: scoreToPercentage(result.score),

    ...result.item
  }));
}

async function handleSearch(input) {
  const mode = detectInputMode(input);

  if (mode === "arabic") {
    return searchQuran(input);
  }

  return searchQuran(input);
}
export {handleSearch};
