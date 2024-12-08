import OpenAI from "openai";
import {Thread, ThreadDeleted} from "openai/resources/beta/threads/threads";
import {
    Run,
    RequiredActionFunctionToolCall,
    RunSubmitToolOutputsParams,
} from "openai/resources/beta/threads/runs/runs";
import {Message} from "openai/resources/beta/threads/messages";
import {Assistant, AssistantDeleted} from "openai/resources/beta/assistants";
import {FileLike} from "openai/uploads";
import EmulatedTranscription from "@/emulated/EmulatedTranscription";
import EmulatedRun from "@/emulated/EmulatedRun";
import {Transcription} from "openai/resources/audio/transcriptions";
import {testData} from "@/TestData"
import {Tools} from "@/Types";
import {assistantData} from "@/AssistantData";

export default class MagicBall
{
    readonly client: OpenAI;

    constructor(client: OpenAI)
    {
        this.client = client;
    }

    async statusHandler(threadId: string, run: Run, tools: Tools): Promise<void>
    {
        if (run.status !== "requires_action") {
            return;
        }

        const actions = run?.required_action?.submit_tool_outputs?.tool_calls;
        if (!actions) {
            console.error(`Cannot complete the run "${run.id}" in the status "${run.status}": no actions requested.`);
            return;
        }

        return this.statusHandler(
            threadId,
            await this.client.beta.threads.runs.submitToolOutputsAndPoll(threadId, run.id, {
                tool_outputs: await this.actionHandler(actions, tools),
            }),
            tools,
        );
    }

    async actionHandler(
        actions: RequiredActionFunctionToolCall[],
        tools: Tools,
    ): Promise<RunSubmitToolOutputsParams.ToolOutput[]>
    {
        const toolOutputs = [];
        for (const action of actions) {
            if (action.function.name === "publish") {
                const {title, content}: {title: string, content: string} = JSON.parse(action.function.arguments);
                toolOutputs.push({
                    tool_call_id: action.id,
                    output: await tools.publish(title, content)
                        ? "The article has been published on the website."
                        : "Failed to publish the article on the website",
                });
            } else {
                toolOutputs.push({
                    tool_call_id: action.id,
                    output: "This tool is unknown.",
                })
            }
        }
        return toolOutputs;
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

    async createAssistant(model: string): Promise<Assistant>
    {
        return this.client.beta.assistants.create({
            model: model,
            instructions: assistantData.instructions,
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "article-draft-structured",
                    strict: true,
                    schema: {
                        type: "object",
                        properties: {
                            title: {
                                description: "The title of the article. Leave it empty if you don't have enough information at the moment.",
                                type: "string",
                            },
                            content: {
                                description: "Draft of the article in Markdown format, without a title. This draft should be created by joining together all the texts collected at the moment and ensuring a smooth narration. Leave it empty if you don't have enough information at the moment.",
                                type: "string",
                            },
                            comment: {
                                description: "Short description of the latest changes in the draft of the article you have made, coupled with your comments to continue a dialog with the user.",
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
                        strict: true,
                        description: "Publish the article on the website.",
                        parameters: {
                            type: "object",
                            properties: {
                                title: {
                                    type: "string",
                                    description: "Title of the article.",
                                },
                                content: {
                                    description: "Content of the article. Markdown markup must be converted to HTML markup.",
                                    type: "string",
                                },
                            },
                            required: ["title", "content"],
                            additionalProperties: false,
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

    async runConversation(threadId: string, assistantId: string, tools: Tools)
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
        await this.statusHandler(threadId, run, tools);
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
