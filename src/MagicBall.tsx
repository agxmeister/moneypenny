import OpenAI from "openai";

async function statusHandler(client: any, run: any, threadId: string)
{
    if (run.status === "completed") {
        let messages = await client.beta.threads.messages.list(threadId);
        console.log(messages.data);
        return messages.data;
    } else if (run.status === "requires_action") {
        console.log(run.status);
        const newRun = await actionHandler(client, run, threadId);
        return await statusHandler(client, newRun, threadId);
    } else {
        console.error("Run did not complete:", run);
    }
}

async function actionHandler(client: any, run: any, threadId: string)
{
    if (
        run.required_action &&
        run.required_action.submit_tool_outputs &&
        run.required_action.submit_tool_outputs.tool_calls
    ) {
        const toolOutputs = run.required_action.submit_tool_outputs.tool_calls.map(
            (tool: { function: { name: string; }; id: any; }) => {
                if (tool.function.name === "publishWebsite") {
                    console.log('Make the publication...')
                    return {
                        tool_call_id: tool.id,
                        output: "It's published!",
                    };
                }
            },
        );

        if (toolOutputs.length === 0) {
            console.log("No tool outputs to submit.");
            return;
        }

        const nextRun = await client.beta.threads.runs.submitToolOutputsAndPoll(
            threadId,
            run.id,
            { tool_outputs: toolOutputs },
        );
        console.log("Tool outputs submitted successfully.");
        return nextRun;
    }
}

export default function getMagicBall(apiKey: string) {
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

        createThread: async () => await client.beta.threads.create(),

        addUserMessage: async (threadId: string, userInput: string) => client.beta.threads.messages.create(threadId, {
            role: "user",
            content: userInput,
        }),

        createAssistant: async () => await client.beta.assistants.create({
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

        runConversation: async (threadId: string, assistantId: string) => {
            const run = await client.beta.threads.runs.createAndPoll(threadId, {
                assistant_id: assistantId,
            });
            return await statusHandler(client, run, threadId);
        },
    };
}
