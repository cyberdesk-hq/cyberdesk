import { anthropic } from "@ai-sdk/anthropic";
import { streamText, type UIMessage } from "ai";
import { prunedMessages } from "@/utils/playground/misc-demo-utils";
import { bashTool, computerTool } from "@/utils/playground/tools";
import client from "@/utils/playground/cyberdesk-client";

// Allow streaming responses up to 5 minutes
export const maxDuration = 300;

export async function POST(req: Request) {
  const { messages, sandboxId }: { messages: UIMessage[]; sandboxId: string } =
    await req.json();
  try {
    const result = streamText({
      model: anthropic("claude-3-7-sonnet-20250219"), // Using Sonnet for computer use
      system:
        "You are a helpful assistant with access to a computer. " +
        "Use the computer tool to help the user with their requests. " +
        "Use the bash tool to execute commands on the computer. You can create files and folders using the bash tool. Always prefer the bash tool where it is viable for the task. " +
        "Be sure to advise the user when waiting is necessary. " +
        "If the browser opens with a setup wizard, YOU MUST IGNORE IT and move straight to the next step (e.g. input the url in the search bar)." +
        "Use DuckDuckGo to search the web.",
      messages: prunedMessages(messages),
      tools: { computer: computerTool(sandboxId), bash: bashTool(sandboxId) },
      providerOptions: {
        anthropic: { cacheControl: { type: "ephemeral" } },
      },
      maxSteps: 100,
    });

    // Create response stream
    const response = result.toDataStreamResponse({
      // @ts-expect-error eheljfe
      getErrorMessage(error) {
        console.error("Error in streamText:", error);
        return error;
      },
    });

    return response;
  } catch (error) {
    console.error("Chat API error:", error);
    await client.terminateDesktop({
      path: {
        id: sandboxId,
      },
    });
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
