import {writeFileSync} from "node:fs";
import OpenAI from "openai";
import MagicBall from "@/MagicBall";
import {getInsight} from "@/Helpers";
import {Input} from "@/Types";

export async function POST(request: Request)
{
    const input: Input = await request.json();

    const assistantId = "asst_0qG06Oe7TKEQRjeW1fk66ecZ";

    const magicBall = new MagicBall(new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    }));

    const thread = await magicBall.createThread();
    await magicBall.addUserMessage(thread.id, input.userInput);
    await magicBall.runConversation(thread.id, assistantId);

    const messages = await magicBall.getMessages(thread.id);

    const insight = getInsight(thread.id, messages, input.settings);

    writeFileSync(`./insights/${thread.id}.json`, JSON.stringify(insight));

    return Response.json(insight);
}
