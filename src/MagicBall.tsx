import OpenAI from "openai";
import {Thread} from "openai/resources/beta/threads/threads";
import {
    Run,
    RequiredActionFunctionToolCall,
    RunSubmitToolOutputsAndPollParams
} from "openai/resources/beta/threads/runs/runs";
import {Message} from "openai/resources/beta/threads/messages";
import {Assistant} from "openai/resources/beta/assistants";

export default class MagicBall
{
    readonly client: OpenAI;

    constructor(client: OpenAI)
    {
        this.client = client;
    }

    async statusHandler(client: OpenAI, threadId: string, runId: string, runStatus: string, run: Run): Promise<void>
    {
        if (runStatus === "completed") {
            console.error("Run completed:", runId, runStatus);
            return;
        } else if (
            runStatus === "requires_action" &&
            run.required_action &&
            run.required_action.submit_tool_outputs &&
            run.required_action.submit_tool_outputs.tool_calls
        ) {
            console.error("Run require actions:", runId, runStatus);
            const newRun = await this.actionHandler(
                client,
                threadId,
                runId,
                run.required_action.submit_tool_outputs.tool_calls,
            );
            return this.statusHandler(
                client,
                threadId,
                newRun.id,
                newRun.status,
                newRun,
            );
        } else {
            console.error("Run not completed", runId, runStatus);
        }
    }

    async actionHandler(
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

    async createThread(userInputs: Array<string> = []): Promise<Thread>
    {
        return this.client.beta.threads.create({
            messages: userInputs.map((userInput) => ({
                content: userInput,
                role: "user",
            })),
        });
    }

    async addUserMessage(threadId: string, userInput: string): Promise<Message>
    {
        return this.client.beta.threads.messages.create(threadId, {
            content: userInput,
            role: "user",
        });
    }

    async createAssistant(model: string, instructions: string): Promise<Assistant>
    {
        return this.client.beta.assistants.create({
            model: "gpt-4o-mini",
            instructions: instructions,
            tools: [
                {
                    type: "function",
                    function: {
                        name: "publishWebsite",
                        description: "Publish website.",
                        parameters: {},
                    },
                },
            ],
        });
    }

    async runConversation(threadId: string, assistantId: string)
    {
        const run = await this.client.beta.threads.runs.createAndPoll(threadId, {
            assistant_id: assistantId,
        });
        await this.statusHandler(this.client, threadId, run.id, run.status, run);
        return run;
    }

    async getMessages(threadId: string)
    {
        return this.client.beta.threads.messages.list(threadId);
    }
}
