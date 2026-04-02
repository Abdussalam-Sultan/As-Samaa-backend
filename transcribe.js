import { BatchClient } from "@speechmatics/batch-client";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function transcribeFromCloudinary(audioUrl) {
  const client = new BatchClient({
    apiKey: process.env.SPEECHMATICS_API_KEY,
    appId: "quranapp1",
    url: "https://asr.api.speechmatics.com",
  });

  console.log("Downloading audio from Cloudinary...");

  const response = await fetch(audioUrl);

  if (!response.ok) {
    throw new Error("Failed to download audio from Cloudinary");
  }

  const arrayBuffer = await response.arrayBuffer();
  const blob = new Blob([arrayBuffer], {
    type: response.headers.get("content-type") || "audio/mpeg",
  });

  // filename from URL
  const fileName = path.basename(new URL(audioUrl).pathname);

  const file = new File([blob], fileName, { type: blob.type });

  console.log("Sending file for transcription...");

  const transcriptResponse = await client.transcribe(
    file,
    {
      transcription_config: {
        language: "ar",
        operating_point: "enhanced",
      },
    },
    "json-v2"
  );

  console.log("Transcription finished!");

  return typeof transcriptResponse === "string"
    ? transcriptResponse
    : transcriptResponse.results
        .map((r) => r.alternatives?.[0].content)
        .join(" ");
}

export default transcribeFromCloudinary;