import { openAsBlob } from "node:fs";
import { BatchClient } from "@speechmatics/batch-client";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

async function transcribeFile(filePath) {
  const client = new BatchClient({
    apiKey: process.env.SPEECHMATICS_API_KEY,
    appId: "quranapp1",
    url: "https://asr.api.speechmatics.com",
  });

  const blob = await openAsBlob(filePath);
  const file = new File([blob], path.basename(filePath), { type: blob.type });

  console.log("Sending file for transcription...");

 const response = await client.transcribe(file,
    {
      transcription_config: {
        language: "ar",
        operating_point: "enhanced",
      },
    },
    "json-v2"
  );

  console.log("Transcription finished!");

  return typeof response === "string"
    ? response
    : response.results.map((r) => r.alternatives?.[0].content).join(" ");
}

export default transcribeFile;