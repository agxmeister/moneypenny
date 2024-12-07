import {Message} from "openai/resources/beta/threads/messages";
import {Settings, Tools} from "@/Types";

export function getInsight(threadId: string, messages: Message[], settings: Settings)
{
    const lastAssistantMessage = JSON.parse(
        messages
            .filter(message => message.role === "assistant")
            .reduce((acc, message) => acc ?? message).content
            .filter(content => content.type === "text")
            .reduce((acc, content) => acc ?? content)?.text.value
    );
    return {
        id: threadId,
        settings: settings,
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
    }
}

export const getTools = (settings: Settings): Tools => ({
    publish: async (title: string, content: string) => {
        console.log(`Publishing the article titled "${title}". Publication URL: "${settings.publishUrl}"`);
        try {
            const response = await fetch(settings.publishUrl, {
                method: "POST",
                body: JSON.stringify({
                    title: title,
                    content: content,
                }),
                headers: new Headers({
                    "Authorization": `Bearer ${settings.secret}`,
                })
            })
            console.log(`Publication of the article titled "${title}" completed with the status "${response.status}".`);
            return response.ok;
        } catch (error) {
            console.log(`Failed to publish the article titled "${title}".`);
            return false;
        }
    }
});
