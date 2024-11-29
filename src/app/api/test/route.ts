import {writeFile} from "node:fs";
import OpenAI from "openai";

export async function GET() {
    return Response.json({
        message: "Hello, world!",
        date: Date.now(),
    });
}

export async function POST(request: Request) {
    const blob = await request.blob();

    const file = new File([blob], 'last-recording.mp4', {
        type: 'audio/mp4',
    });

    const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    })
    const transcription = await client.audio.transcriptions.create({
        file: file,
        model: "whisper-1",
    });

    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    writeFile("./last-recording.mp4", buffer, (err) => {
        if (err) {
            console.error('Error saving Blob:', err);
        } else {
            console.log('Blob saved successfully to:', "./last-recording.mp4");
        }
    });

    return Response.json({
        message: transcription.text,
        date: Date.now(),
    });
}
