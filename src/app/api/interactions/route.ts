import MagicBall from "@/MagicBall";
import OpenAI from "openai";
import {writeFileSync} from "node:fs";

export async function POST() {
    const magicBall = new MagicBall(new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    }));
    const thread = await magicBall.createThread();

    writeFileSync("./interaction.json", JSON.stringify(thread));

    return Response.json(thread);
}
