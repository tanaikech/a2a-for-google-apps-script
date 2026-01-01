import { v4 as uuidv4 } from "uuid";
import { ClientFactory } from "@a2a-js/sdk/client";
import { ClientGAS } from "./clientGas.js";
import "dotenv/config";

const A2A_URL = process.env.A2A_WEB_APPS_URL || "";

// Sample prompts for testing the above A2A server.
const prompts = [
  "How much is 10 yen in USD?",
  "What is the weather forecast for Tokyo at noon today?",
];

async function run() {
  if (!A2A_URL) {
    console.error(
      "Error: No Web Apps URL as the A2A server was found. Set it to 'A2A_WEB_APPS_URL' of the environment variable."
    );
    process.exit(1);
  }
  try {
    const client = await new ClientGAS(ClientFactory).createFromUrl(A2A_URL);
    for (let prompt of prompts) {
      const messageId = uuidv4();
      const sendParams = {
        message: {
          messageId: messageId,
          role: "user",
          parts: [{ kind: "text", text: prompt }],
          kind: "message",
        },
        configuration: {
          blocking: true,
          acceptedOutputModes: ["text/plain"],
        },
      };
      const sendResponse = await client.sendMessage(sendParams);
      sendResponse.parts.forEach((e) => {
        if (e.kind == "text") {
          console.log(`Prompt: ${prompt}`);
          console.log(`Response: ${e.text}`);
        }
      });
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

await run();
