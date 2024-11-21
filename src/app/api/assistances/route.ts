import getMagicBall from "@/MagicBall";


export async function POST(request: Request) {
    const data = await request.json();

    const magicBall = getMagicBall(process.env.OPENAI_API_KEY ?? '');

    const thread = await magicBall.createThread();
    await magicBall.addUserMessage(thread.id, data.input);
    const assistant = await magicBall.createAssistant();
    const output = await magicBall.runConversation(thread.id, assistant.id);

    return Response.json(output);
}
