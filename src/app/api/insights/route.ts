import {writeFileSync} from "node:fs";
import OpenAI from "openai";
import MagicBall from "@/MagicBall";
import {getInsight} from "@/Helpers";
import {Input} from "@/Types";
import Insider from "@/Insider";

export async function POST(request: Request)
{
    const input: Input = await request.json();

    const assistantId = "asst_7U94fY2szmcFRe1IlMxCAfxq";

    const magicBall = new MagicBall(new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    }));

    const onPublish = async (title: string, content: string): Promise<boolean> => {
        const insiderClient = new Insider(input.settings.url, input.settings.secret);
        return insiderClient.publish(title, content);
    };

    const thread = await magicBall.createThread();
    await magicBall.addUserMessage(thread.id, input.userInput);
    await magicBall.runConversation(thread.id, assistantId, onPublish);

    const messages = await magicBall.getMessages(thread.id);

    const insight = getInsight(thread.id, messages, input.settings);

    writeFileSync(`./insights/${thread.id}.json`, JSON.stringify(insight));

    return Response.json(insight);
}
