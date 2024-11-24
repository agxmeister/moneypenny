import MagicBall from "@/MagicBall";
import OpenAI from "openai";
import {writeFileSync} from "node:fs";

export async function GET(
    _: Request,
    {params}: {params: Promise<{interactionId: string}>}
) {
    const interactionId = (await params).interactionId;

    const magicBall = new MagicBall(new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    }));
    const messages = await magicBall.getMessages(interactionId);

    writeFileSync("./messages.json", JSON.stringify(messages));

    return Response.json(messages);
}

export async function POST(
    request: Request,
    {params}: {params: Promise<{interactionId: string}>},
) {
    const interactionId = (await params).interactionId;
    const inout: {userMessage: string} = await request.json();

    const magicBall = new MagicBall(new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    }));
    const message = await magicBall.addUserMessage(interactionId, inout.userMessage);

    return Response.json(message);
}
