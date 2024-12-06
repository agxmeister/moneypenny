import {readFileSync} from 'fs';
import MagicBall from "@/MagicBall";
import OpenAI from "openai";
import {getInsight} from "@/Helpers";
import {writeFileSync} from "node:fs";
import {Input} from "@/Types";
import Insider from "@/Insider";

export async function POST(
    request: Request,
    {params}: {params: Promise<{insightId: string}>},
)
{
    const insightId = (await params).insightId;
    const insightData = JSON.parse(readFileSync(`./insights/${insightId}.json`, 'utf-8'));

    const input: Input = await request.json();

    const assistantId = "asst_7U94fY2szmcFRe1IlMxCAfxq";

    const magicBall = new MagicBall(new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    }));

    const onPublish = async (title: string, content: string): Promise<boolean> => {
        const insiderClient = new Insider(input.settings.url, input.settings.secret);
        return insiderClient.publish(title, content);
    };

    await magicBall.addUserMessage(insightId, input.userInput);
    await magicBall.runConversation(insightId, assistantId, onPublish);

    const messages = await magicBall.getMessages(insightId);

    const insight = getInsight(insightId, messages, input.settings);

    writeFileSync(`./insights/${insightId}.json`, JSON.stringify(insight));

    return Response.json(insight);
}
