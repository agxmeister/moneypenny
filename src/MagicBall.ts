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
import {OnPublish, PublishArguments} from "@/Types";
import Insider from "@/Insider";

export default class MagicBall
{
    readonly client: OpenAI;

    constructor(client: OpenAI)
    {
        this.client = client;
    }

    async statusHandler(client: OpenAI, threadId: string, runId: string, runStatus: string, run: Run, onPublish: OnPublish): Promise<void>
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
                onPublish,
            );
            return this.statusHandler(
                client,
                threadId,
                newRun.id,
                newRun.status,
                newRun,
                onPublish
            );
        } else {
            console.error("Run not completed", runId, runStatus);
        }
    }

    async actionHandler(
        client: OpenAI,
        threadId: string,
        runId: string,
        tools: Array<RequiredActionFunctionToolCall>,
        onPublish: OnPublish,
    ): Promise<Run>
    {
        return await client.beta.threads.runs.submitToolOutputsAndPoll(threadId, runId, {
            tool_outputs: tools.map<RunSubmitToolOutputsAndPollParams.ToolOutput>(
                (tool: RequiredActionFunctionToolCall): RunSubmitToolOutputsAndPollParams.ToolOutput => {
                    if (tool.function.name === "publish") {
                        const publishArgument = JSON.parse(tool.function.arguments) as PublishArguments;
                        onPublish(publishArgument.title, publishArgument.content);
                        return {
                            tool_call_id: tool.id,
                            output: "The article has been published on the website.",
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
            instructions: "The user would like to create an article for his website. He has some ideas about what to write about, and he will share them with you. Your task is to make the article's draft from the user's sayings. You don't need to add any details on your own if they were not mentioned by the user explicitly. The user probably will ask you for some corrections. At some point, the user will ask you to publish the article in its current state - use the corresponding tool with the latest title and content of the article.",
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "article-draft-structured",
                    strict: true,
                    schema: {
                        type: "object",
                        properties: {
                            title: {
                                description: "The title of the article",
                                type: "string",
                            },
                            content: {
                                description: "Content of the article in Markdown format, without the title",
                                type: "string",
                            },
                            comment: {
                                description: "Your comments to this version of the article to continue a dialog with the user",
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
                        name: "publish",
                        description: "Publish the article on the website.",
                        parameters: {
                            type: "object",
                            properties: {
                                title: {
                                    type: "string",
                                    description: "Title of the article",
                                },
                                content: {
                                    description: "Content of the article in Markdown format",
                                    type: "string",
                                },
                            },
                            required: ["title", "content"],
                        },
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

    async runConversation(threadId: string, assistantId: string, onPublish: OnPublish)
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
        await this.statusHandler(this.client, threadId, run.id, run.status, run, onPublish);
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
