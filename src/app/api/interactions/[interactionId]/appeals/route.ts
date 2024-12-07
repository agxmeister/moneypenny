import MagicBall from "@/MagicBall";
import OpenAI from "openai";

export async function POST(
    request: Request,
    {params}: {params: Promise<{interactionId: string}>},
) {
    const interactionId = (await params).interactionId;
    const input: {assistantId: string} = await request.json();

    const tools = {
        publish: async (title: string, content: string): Promise<boolean> => true,
    };

    const magicBall = new MagicBall(new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    }));
    const run = await magicBall.runConversation(interactionId, input.assistantId, tools);

    return Response.json(run);
}
