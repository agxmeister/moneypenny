import getMagicBall from "@/MagicBall";


export async function POST(request: Request) {
    const data = await request.json();

    const magicBall = getMagicBall(process.env.OPENAI_API_KEY ?? '');
    const output = await magicBall.askForIntention(data.input);

    return Response.json(output);
}
