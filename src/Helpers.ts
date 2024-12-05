import {Message} from "openai/resources/beta/threads/messages";

export function getInsight(threadId: string, messages: Message[])
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
