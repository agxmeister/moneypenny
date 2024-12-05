import OpenAI from "openai";
import {Thread, ThreadDeleted} from "openai/resources/beta/threads/threads";
import {
    Run,
    RequiredActionFunctionToolCall,
    RunSubmitToolOutputsAndPollParams
} from "openai/resources/beta/threads/runs/runs";
import {Message} from "openai/resources/beta/threads/messages";
import {Assistant, AssistantDeleted} from "openai/resources/beta/assistants";
import {FileLike} from "openai/uploads";
import EmulatedTranscription from "@/emulated/EmulatedTranscription";
import EmulatedRun from "@/emulated/EmulatedRun";
import {Transcription} from "openai/resources/audio/transcriptions";
import {testData} from "@/TestData"

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

    async removeThread(threadId: string): Promise<ThreadDeleted>
    {
        return this.client.beta.threads.del(threadId);
    }

    async addUserMessage(threadId: string, userInput: string): Promise<Message>
    {
        return this.client.beta.threads.messages.create(threadId, {
            content: userInput,
            role: "user",
        });
    }

    async addAssistantMessage(threadId: string, assistantInput: string): Promise<Message>
    {
        return this.client.beta.threads.messages.create(threadId, {
            content: assistantInput,
            role: "assistant",
        });
    }

    async createAssistant(model: string, instructions: string): Promise<Assistant>
    {
        return this.client.beta.assistants.create({
            model: model,
            instructions: instructions,
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "article-draft-structured",
                    strict: true,
                    schema: {
                        type: "object",
                        properties: {
                            title: {
                                description: "Title of an article",
                                type: "string",
                            },
                            content: {
                                description: "Content of an article in Markdown format",
                                type: "string",
                            },
                            comment: {
                                description: "Your comments to this version of an article to continue a dialog with a user",
                                type: "string",
                            }
                        },
                        required: [
                            "title",
                            "content",
                            "comment",
                        ],
                        additionalProperties: false,
                    },
                },
            },
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

    async getAssistants(): Promise<Array<Assistant>>
    {
        const assistants: Array<Assistant> = [];
        const list = await this.client.beta.assistants.list();
        for await (const page of list.iterPages()) {
            assistants.push(...page.getPaginatedItems())
        }
        return assistants;
    }

    async removeAssistant(assistantId: string): Promise<AssistantDeleted>
    {
        return this.client.beta.assistants.del(assistantId);
    }

    async runConversation(threadId: string, assistantId: string)
    {
        if (process.env.EMULATE_OPENAI_CALLS === 'true') {
            await this.addAssistantMessage(threadId, JSON.stringify({
                title: testData.insight.title,
                content: testData.insight.content,
                comment: testData.insight.comment,
            }));
            return new EmulatedRun("run-id", threadId, assistantId, "Do your best!");
        }
        const run = await this.client.beta.threads.runs.createAndPoll(threadId, {
            assistant_id: assistantId,
        });
        await this.statusHandler(this.client, threadId, run.id, run.status, run);
        return run;
    }

    async getMessages(threadId: string)
    {
        const messages: Array<Message> = [];
        const list = await this.client.beta.threads.messages.list(threadId);
        for await (const page of list.iterPages()) {
            messages.push(...page.getPaginatedItems())
        }
        return messages;
    }

    async getTranscription(file: FileLike): Promise<Transcription>
    {
        if (process.env.EMULATE_OPENAI_CALLS === 'true') {
            return new EmulatedTranscription(testData.transcription);
        }
        return this.client.audio.transcriptions.create({
            file: file,
            model: "whisper-1",
            language: "en",
        });
    }
}
