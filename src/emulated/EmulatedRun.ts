import {Run, RunStatus} from "openai/resources/beta/threads/runs/runs";
import {AssistantTool} from "openai/resources/beta/assistants";

export default class EmulatedRun implements Run
{
    id: string;
    assistant_id: string;
    cancelled_at: null;
    completed_at: null;
    created_at: number;
    expires_at: null;
    failed_at: null;
    incomplete_details: null;
    instructions: string;
    last_error: null;
    max_completion_tokens: null;
    max_prompt_tokens: null;
    metadata: null;
    model: string;
    object: "thread.run";
    parallel_tool_calls: boolean;
    required_action: null;
    response_format: null;
    started_at: null;
    status: RunStatus;
    thread_id: string;
    tool_choice: null;
    tools: Array<AssistantTool>;
    truncation_strategy: null;
    usage: null;

    constructor(id: string, threadId: string, assistantId: string, instructions: string, model: string = "gpt-4o-mini") {
        this.id = id;
        this.assistant_id = assistantId;
        this.cancelled_at = null;
        this.completed_at = null;
        this.created_at = 0;
        this.expires_at = null;
        this.failed_at = null;
        this.incomplete_details = null;
        this.instructions = instructions;
        this.last_error = null;
        this.max_completion_tokens = null;
        this.max_prompt_tokens = null;
        this.metadata = null;
        this.model = model;
        this.object = "thread.run";
        this.parallel_tool_calls = false;
        this.required_action = null;
        this.response_format = null;
        this.started_at = null;
        this.status = "completed";
        this.thread_id = threadId;
        this.tool_choice = null;
        this.tools = [];
        this.truncation_strategy = null;
        this.usage = null;
    }
}
