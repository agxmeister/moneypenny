import MagicBall from "@/MagicBall";
import OpenAI from "openai";

export async function DELETE(
    _: Request,
    {params}: {params: Promise<{interactionId: string}>},
) {
    const threadId = (await params).interactionId;

    const magicBall = new MagicBall(new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    }));
    await magicBall.removeThread(threadId);

    return Response.json(null);
}
