import OpenAI from "openai";
import {createReadStream} from "node:fs";

export async function GET() {
    const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    })

    const transcription = await client.audio.transcriptions.create({
        file: createReadStream("./recording.mp4"),
        model: "whisper-1",
    });

    return Response.json({
        message: transcription,
        date: Date.now(),
    });
}
