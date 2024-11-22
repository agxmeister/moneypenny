import OpenAI from "openai";
import {Thread} from "openai/resources/beta/threads/threads";
import {
    Run,
    RequiredActionFunctionToolCall,
    RunSubmitToolOutputsAndPollParams
} from "openai/resources/beta/threads/runs/runs";
import {Message} from "openai/resources/beta/threads/messages";
import {Assistant} from "openai/resources/beta/assistants";

export async function statusHandler(client: OpenAI, run: Run, threadId: string, actionHandler: Function)
{
    console.log(run.status);
    if (run.status === "completed") {
        let messages = await client.beta.threads.messages.list(threadId);
        console.log(messages.data);
        return messages.data;
    } else if (
        run.status === "requires_action" &&
        run.required_action &&
        run.required_action.submit_tool_outputs &&
        run.required_action.submit_tool_outputs.tool_calls
    ) {
        return await statusHandler(
            client,
            await actionHandler(
                client,
                threadId,
                run.id,
                run.required_action.submit_tool_outputs.tool_calls,
            ),
            threadId,
            actionHandler,
        );
    } else {
        console.error("Run did not complete:", run);
    }
}

export async function actionHandler(
    client: OpenAI,
    threadId: string,
    runId: string,
    tools: Array<RequiredActionFunctionToolCall>
): Promise<Run>
{
    return await client.beta.threads.runs.submitToolOutputsAndPoll(threadId, runId, {
        tool_outputs: tools.map<RunSubmitToolOutputsAndPollParams.ToolOutput>(
            (tool: { function: { name: string; }; id: any; }): RunSubmitToolOutputsAndPollParams.ToolOutput => {
                if (tool.function.name === "publishWebsite") {
                    console.log('Make the publication...')
                    return {
                        tool_call_id: tool.id,
                        output: "Website was published!",
                    };
                } else {
                    return {
                        tool_call_id: tool.id,
                        output: "",
                    };
                }
            },
        )
    });
}

interface MagicBall {
    askForIntention: Function,
    createThread: Function,
    addUserMessage: Function,
    createAssistant: Function,
    runConversation: Function,
}

export default function getMagicBall(apiKey: string): MagicBall {
    const client = new OpenAI({
        apiKey: apiKey,
    });
    return {
        askForIntention: async (input: string) => await client.chat.completions.create({
         messages: [{ role: 'user', content: `
            Classify the input text into one of these topics:
            - Add a completely new article
            - Expand an existing article with new thoughts
            Put only a topic name in the output.
            
            Input: "${input}"
            Output:`
         }],
         model: 'gpt-4o-mini',
        }),

        createThread: async (): Promise<Thread> => await client.beta.threads.create(),

        addUserMessage: async (threadId: string, userInput: string): Promise<Message> => client.beta.threads.messages.create(threadId, {
            role: "user",
            content: userInput,
        }),

        createAssistant: async (): Promise<Assistant> => await client.beta.assistants.create({
            model: "gpt-4o",
            instructions:
                "You are assisting with changing the content on the user's website. Use the provided functions to help the user.",
            tools: [
                {
                    type: "function",
                    function: {
                        name: "publishWebsite",
                        description: "Publish new version of website.",
                        parameters: {},
                    },
                },
            ],
        }),

        runConversation: async (threadId: string, assistantId: string, statusHandler: Function, actionHandler: Function) => {
            const run = await client.beta.threads.runs.createAndPoll(threadId, {
                assistant_id: assistantId,
            });
            return await statusHandler(client, run, threadId, actionHandler);
        },
    };
}
