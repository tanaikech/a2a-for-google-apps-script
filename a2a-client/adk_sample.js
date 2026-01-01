/**
 * ref: https://google.github.io/adk-docs/get-started/typescript/
 *
 * ADK web interface
 * npx @google/adk-devtools web adk_sample.js
 * http://localhost:8000
 */
/**
 * Sample prompt
 * Show the information of the A2A server built by Google Apps Script.
 * How much is 10,000 yen in USD? Answer using the A2A server built by Google Apps Script.
 * What is the weather forecast for Tokyo at noon today? Answer using the A2A server built by Google Apps Script.
 */

import { FunctionTool, LlmAgent } from "@google/adk";
import { ClientFactory } from "@a2a-js/sdk/client";
import { ClientGAS } from "./clientGas.js";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import "dotenv/config";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
const A2A_URL = process.env.A2A_WEB_APPS_URL || "";

const url_err_ = (_) => {
  const msg =
    "Error: No Web Apps URL as the A2A server was found. Set it to 'A2A_WEB_APPS_URL' of the environment variable.";
  console.error(msg);
  return { status: "failure", report: msg };
};

const getInfGasA2a = new FunctionTool({
  name: "get_inf_gas_a2a",
  description:
    "Use this to get the information of the A2A server built by Google Apps Script.",
  parameters: z.object({}).describe("No arguments."),
  execute: async (object = {}) => {
    if (!A2A_URL) {
      return url_err_();
    }
    try {
      const client = await new ClientGAS(ClientFactory).createFromUrl(A2A_URL);
      const { name, description, skills } = client.agentCard;
      const agentInf = [
        "--- Agent Information ---",
        `Name        : ${name || "Unknown"}`,
        `Description : ${description || "No description"}`,
        `Skills      : ${skills.length}`,
        "-------------------------",
      ].join("\n");
      return { status: "success", report: agentInf };
    } catch (err) {
      return { status: "failure", report: err };
    }
  },
});

const toGasA2a = new FunctionTool({
  name: "to_gas_a2a",
  description:
    "Use this to ask a question to the A2A server built by Google Apps Script. This A2A server can be used for the following situations. This agent acts as a comprehensive interface for the Google Workspace ecosystem and associated Google APIs. It provides extensive capabilities to manage and automate tasks across Gmail (sending, organizing, retrieving), Google Drive (file management, search, permission handling, content generation), and Google Calendar (schedule management). It features deep integration with Google Classroom for managing courses, assignments, and rosters, as well as Google Analytics for reporting. Additionally, it controls Google Docs, Sheets, and Slides for document creation and data manipulation. Advanced features include RAG (Retrieval-Augmented Generation) via File Search stores, image generation, YouTube video summarization, and Google Maps utilities. It serves as a central hub for executing complex workflows involving multiple Google services.",
  parameters: z.object({
    prompt: z.string().describe("Prompt from user."),
  }),
  execute: async (object = {}) => {
    if (!A2A_URL) {
      return url_err_();
    }
    try {
      const { prompt = "" } = object;
      const client = await new ClientGAS(ClientFactory).createFromUrl(A2A_URL);
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
      const text = sendResponse.parts
        .map((e) => (e.kind == "text" ? e.text : ""))
        .join("\n");
      return { status: "success", report: text };
    } catch (err) {
      return { status: "failure", report: err };
    }
  },
});

export const rootAgent = new LlmAgent({
  name: "test_gas_a2a",
  model: GEMINI_MODEL,
  description:
    "This agent is used for testing the A2A server built by Google Apps Script. The information of the A2A server can be obtained through the function 'getInfGasA2a' of the function calling. The A2A server can be used through a function 'toGasA2a' of the function calling.",
  tools: [getInfGasA2a, toGasA2a],
});

// async function test() {
//   const res = await getInfGasA2a.execute();
//   console.log(res);
// }
// test();
