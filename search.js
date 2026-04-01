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
//remove basmala from any ayah if it's not surah 1 or 9 using startsWith for better performance, since basmala is always at the beginning of the text if it exists. This is more efficient than using a regex for every ayah.

function removeBasmala(text) {
  const bismillah = 'بسم الله الرحمن الرحيم';
  const normalizedText = normalizeArabic(text);
  if (normalizedText.startsWith(bismillah)) {
    text = text.slice(bismillah.length).trim();
  }
  return text;
}
console.log("Basmala removed:", removeBasmala('بسم الله الرحمن الرحيم الحمد لله رب العالمين'));


const quran = JSON.parse(fs.readFileSync(`../quran.json`, "utf8"));

const fuse = new Fuse(quran.verses, {
  keys: ["normalizedText"],
  includeScore: true,
  threshold: 0.5,
  minMatchCharLength: 4,
});

function scoreToPercentage(score) {
  return ((1 - score) * 100).toFixed(2) + "%";
}

async function searchQuran(query) {
  query = normalizeArabic(query);
  if (query.split(" ").length < 2) {
    console.log(query);
  return "Query too short, please use 2+ words for accurate results.";
}
  const results = fuse.search(query);
  if (results.length === 0) {
    return "No results found.";
  }
  console.log(`Found ${results.length} results for query: "${query}"`);
  return results.map(result => ({ query, ... result.item, percentage: scoreToPercentage(result.score) }));
}

async function enrichAyahs(ayahsArray) {

    // Map each ayah to a promise fetching its metadata
    const promises = ayahsArray.map(async (ayah) => {
        try {
            const verse = quran.verses.find((s) => s.surah === ayah.surah && s.ayah === ayah.ayah);
            const chapter = quran.chapters.find((c) => c.surah_number === verse.surah);

            return {
                  query: ayah.query,
                 surahName: chapter.name_ar,
                 surahEnglishName: chapter.name_en,
                 // surahEnglishTranslation: chapter.name_en,
                 surahAyahCount: chapter.verses_count,
                // translation: ayahData.translation,
                text: verse.text_ar,
                surah: verse.surah,
                ayah: verse.ayah,
                  matchPercentage: ayah.percentage, // Include match percentage
                 
            };
        } catch (err) {
            console.error(`Error fetching surah ${ayah.surah} ayah ${ayah.ayah}:`, err.message);
            // Return original ayah in case of error
            return {  error: 'Could not fetch metadata' };
        }
    });

    // Wait for all promises to resolve
    const enrichedAyahs = await Promise.all(promises);
    return enrichedAyahs;
}

export {searchQuran, enrichAyahs as getAyah};