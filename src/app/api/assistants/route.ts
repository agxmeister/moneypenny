import MagicBall from "@/MagicBall";
import OpenAI from "openai";
import {writeFileSync} from "node:fs";

export async function POST(request: Request) {
    const input: {model: string, instructions: string} = await request.json();

    const magicBall = new MagicBall(new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    }));
    const assistant = await magicBall.createAssistant(input.model, input.instructions);

    writeFileSync("./assistant.json", JSON.stringify(assistant));

    return Response.json(assistant);
}
