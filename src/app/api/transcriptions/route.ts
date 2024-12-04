import {writeFile} from "node:fs";
import OpenAI from "openai";
import MagicBall from "@/MagicBall";

export async function POST(request: Request)
{
    const blob = await request.blob();

    const magicBall = new MagicBall(new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    }));
    const transcription = await magicBall.getTranscription(new File([blob], 'last-recording.mp4', {
        type: 'audio/mp4',
    }));

    if (process.env.SAVE_VOICE_RECORDINGS === 'true') {
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        writeFile("./recordings/last-recording.mp4", buffer, (err) => {
            if (err) {
                console.error(`Failed to save recording: ${err}`);
            }
        });
    }

    return Response.json({
        message: transcription.text,
        date: Date.now(),
    });
}
