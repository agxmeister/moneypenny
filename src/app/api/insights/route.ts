import OpenAI from "openai";
import MagicBall from "@/MagicBall";
import {writeFileSync} from "node:fs";

export async function POST(request: Request)
{
    const assistantId = "asst_0qG06Oe7TKEQRjeW1fk66ecZ";

    const magicBall = new MagicBall(new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    }));

    const blob = await request.blob();
    const file = new File([blob], 'last-recording.mp4', {
        type: 'audio/mp4',
    });

    const transcription = await magicBall.getTranscription(file);

    const thread = await magicBall.createThread();
    const message = await magicBall.addUserMessage(thread.id, transcription.text);
    const run = await magicBall.runConversation(thread.id, assistantId);

    const insight = {
        threadId: thread.id,
        assistantId: assistantId,
        userMessageId: message.id,
        runId: run.id,
        date: Date.now(),
    };

    writeFileSync(`./insights/${thread.id}.json`, JSON.stringify(insight));

    return Response.json(insight);
}
