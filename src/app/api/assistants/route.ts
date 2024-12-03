import MagicBall from "@/MagicBall";
import OpenAI from "openai";
import {writeFileSync} from "node:fs";

export async function POST(request: Request)
{
    const input: {model: string, instructions: string} = await request.json();

    const magicBall = new MagicBall(new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    }));
    const assistant = await magicBall.createAssistant(input.model, input.instructions);

    writeFileSync("./assistant.json", JSON.stringify(assistant));

    return Response.json(assistant);
}

export async function GET()
{
    const magicBall = new MagicBall(new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    }));
    const assistants = await magicBall.getAssistants();
    console.log(assistants.length);
    return Response.json(assistants);
}

export async function DELETE()
{
    const magicBall = new MagicBall(new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    }));
    const assistants = await magicBall.getAssistants();
    await Promise.all(assistants.map(assistant => magicBall.removeAssistant(assistant.id)));
    return Response.json([]);
}
