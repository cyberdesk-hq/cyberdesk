import type { ThreadMessage } from "@assistant-ui/react";
import { anthropic } from '@ai-sdk/anthropic';
import { executeComputerAction } from '../../../utils/computer-use';
import { executeBashCommand } from '../../../utils/bash';
import { streamText } from 'ai';

// Define the result type for computer actions
interface ComputerActionResult {
  type: "image";
  data: string;
}

export const maxDuration = 300;

export async function POST(req: Request) {
  // Extract desktopId from headers
  const desktopId = req.headers.get('X-Desktop-Id');

  // Get the request body
  const rawBody = await req.text();

  // Parse the JSON
  const { messages } = JSON.parse(rawBody);

  // Ensure desktopId is provided
  if (!desktopId) {
    console.error("[API] Error: Desktop ID is missing");
    return Response.json({ error: "Desktop ID is required" }, { status: 400 });
  }

  const lastMessage = messages[messages.length - 1] as ThreadMessage;

  // For debugging - log the structure of content
  console.log("[API] Content structure:", JSON.stringify(lastMessage?.content, null, 2));
  console.log("[API] Using desktop ID:", desktopId);

  // Extract text from content parts array or default to empty string
  const userContent: string = Array.isArray(lastMessage?.content)
    ? lastMessage.content
      .filter(part => part.type === 'text')
      .map(part => 'text' in part ? part.text : JSON.stringify(part))
      .join('\n')
    : "";

  // You can define any variables you need here that should be accessible to the tools
  // For example:
  // const someContextVariable = "value from route scope";

  const computerTool = anthropic.tools.computer_20250124({
    displayWidthPx: 1024,
    displayHeightPx: 768,
    execute: async ({ action, coordinate, duration, scroll_amount, scroll_direction, start_coordinate, text }) => {
      // Convert coordinate array to x,y object if needed
      const coordinateObj = coordinate ? { x: coordinate[0], y: coordinate[1] } : undefined;
      const startCoordinateObj = start_coordinate ? { x: start_coordinate[0], y: start_coordinate[1] } : undefined;

      // Pass all parameters to executeComputerAction with the updated parameter order
      const result = await executeComputerAction(
        action,
        desktopId,
        coordinateObj,
        text,
        duration,
        scroll_amount,
        scroll_direction,
        startCoordinateObj
      );

      // Convert string results to the expected ComputerActionResult format
      if (typeof result === 'string') {
        // Return text response in the expected format for the tool
        return {
          type: "text" as const,
          text: result
        };
      } else {

        return {
          type: "image" as const,
          data: result.data
        };
      }
    },
    experimental_toToolResultContent(result: { type: "text"; text: string } | ComputerActionResult) {
      return result.type === 'text'
        ? [{ type: 'text', text: result.text }]
        : [{ type: 'image', data: result.data, mimeType: 'image/jpeg' }];
    },
  });

  const bashTool = anthropic.tools.bash_20250124({
    execute: async ({ command, restart }) => await executeBashCommand(command, desktopId)
  });

  try {
    const response = streamText({
      model: anthropic("claude-3-7-sonnet-20250219"),
      prompt: userContent,
      system: "You are an AI assistant that can control a computer. If needed, click the globe icon to open Firefox, then wait 5 seconds. When you open Firefox, you'll see their welcome steps. Ignore all of it. No need to click 'Skip this step'. Just click on the search bar. Use DuckDuckGo as the default search engine. ",
      tools: {
        computer: computerTool,
        bash: bashTool
      },
      maxSteps: 100
    });

    return response.toDataStreamResponse();
  } catch (error) {
    console.error("Error calling Anthropic:", error);
    return Response.json({ error: "Failed to process request" }, { status: 500 });
  }
}