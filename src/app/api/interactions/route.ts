import MagicBall from "@/MagicBall";
import OpenAI from "openai";
import {writeFileSync, readdirSync, unlinkSync} from "node:fs";

export async function POST()
{
    const magicBall = new MagicBall(new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    }));
    const thread = await magicBall.createThread();

    writeFileSync("./interaction.json", JSON.stringify(thread));

    return Response.json(thread);
}

export async function DELETE()
{
    const magicBall = new MagicBall(new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    }));

    for (const file of readdirSync("./insights")) {
        const interactionId = file.match(/(?<interactionId>.*).json/i)?.groups?.interactionId
        if (!interactionId) {
            continue;
        }
        try {
            await magicBall.removeThread(interactionId);
        } catch (error) {
            console.log(error);
        } finally {
            unlinkSync(`./insights/${file}`);
        }
    }

    return Response.json([]);
}
