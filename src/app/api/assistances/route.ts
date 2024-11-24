import MagicBall from "@/MagicBall";
import OpenAI from "openai";

export async function POST(request: Request) {
    const data = await request.json();

    const magicBall = new MagicBall(new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    }));

    const thread = await magicBall.createThread([data.input]);
    console.log(thread);

    const assistant = await magicBall.createAssistant(
        "You are a website's content manager. Answer in JSON in accordance with the schema.",
    );

    const output = await magicBall.runConversation(thread.id, assistant.id);

    return Response.json(output);
}
