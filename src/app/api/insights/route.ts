import {writeFileSync} from "node:fs";
import OpenAI from "openai";
import MagicBall from "@/MagicBall";

export async function POST(request: Request)
{
    const input: {userInput: string} = await request.json();

    const assistantId = "asst_0qG06Oe7TKEQRjeW1fk66ecZ";

    const magicBall = new MagicBall(new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    }));

    const thread = await magicBall.createThread();
    await magicBall.addUserMessage(thread.id, input.userInput);
    await magicBall.runConversation(thread.id, assistantId);

    const messages = await magicBall.getMessages(thread.id);
    const lastAssistantMessage = JSON.parse(
        messages
            .filter(message => message.role === "assistant")
            .reduce((acc, message) => acc ?? message).content
                .filter(content => content.type === "text")
                .reduce((acc, content) => acc ?? content)?.text.value
    );

    const insight = {
        id: thread.id,
        title: lastAssistantMessage.title,
        content: lastAssistantMessage.content,
        conversation: messages.map(
            message => ({
                role: message.role,
                message: message.role === "user"
                    ? message.content
                        .filter(content => content.type === "text")
                        .reduce((acc, content) => acc ?? content)?.text.value
                    : JSON.parse(message.content
                        .filter(content => content.type === "text")
                        .reduce((acc, content) => acc ?? content)?.text.value)?.comment
            })
        ),
    };

    writeFileSync(`./insights/${thread.id}.json`, JSON.stringify(insight));

    return Response.json(insight);
}
