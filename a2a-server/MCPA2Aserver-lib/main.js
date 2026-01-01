/**
 * MCPA2Aserver: Google Apps Script Library for Consolidating Generative AI Protocols: A Single Server Solution for MCP and A2A
 * Author: Tanaike
 * v1.0.1
 * library key: 1xRlK6KPhqp374qAyumrtVXXNEtb7iZ_rD7yRuYxccQuYieKCCao9VuB6
 */
var apiKey = "";
var model = "models/gemini-3-flash-preview";
var accessKey = "";
var logSpreadsheetId = "";
var useToolsForMCPServer = false; // If this is true, the tools of ToolsForMCPServer are used. https://github.com/tanaikech/ToolsForMCPServer
var webAppsUrl = "";

var mcp = false; // If this is true, this server is used as the MCP server. You can use both mcp and a2a as true.
var a2a = false; // If this is true, this server is used as the A2A server. You can use both mcp and a2a as true.

const CONFIG = {
  API_KEY: apiKey,
  MODEL: model,
  WELL_KNOWN_PATHS: [".well-known/agent-card.json", ".well-known/agent.json"],
  METHODS: {
    A2A: ["tasks/send", "message/send"],
    MCP: [
      "initialize",
      "notifications/initialized",
      "notifications/cancelled",
      "resources/list",
      "prompts/list",
      "tools/list",
      "tools/call",
    ],
  },
};

/**
 * Main Dispatcher Function
 * Routes the request to either A2A handler or MCP handler based on the payload or path.
 *
 * @param {EventObject} e - The event object from doGet/doPost
 * @return {ContentService.TextOutput} The JSON response
 */
function main(e, context = null) {
  if (!apiKey) {
    return ContentService.createTextOutput(
      "Set your API key for using Gemini API."
    );
  }
  if (useToolsForMCPServer === true && !webAppsUrl) {
    return ContentService.createTextOutput(
      "When you use ToolsForMCPServer, set webAppsUrl."
    );
  }
  CONFIG.API_KEY = apiKey;
  CONFIG.MODEL = model;
  webAppsUrl = accessKey ? `${webAppsUrl}?accessKey=${accessKey}` : webAppsUrl;
  if (useToolsForMCPServer === true) {
    context = createServerContext_();
  } else if (useToolsForMCPServer === false && !context) {
    return ContentService.createTextOutput("No tools.");
  }

  const route = determineRoute_(e);

  if (route.type === "A2A" && a2a === true) {
    return handleA2ARequest_(e, context.A2AObj);
  }

  if (route.type === "MCP" && mcp === true) {
    return handleMCPRequest_(e, context.MCPObj);
  }

  // Fallback / Empty response
  return ContentService.createTextOutput("{}").setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * Creates the context objects (Tools, Functions) required for the handlers.
 */
function createServerContext_() {
  const m = ToolsForMCPServer;
  m.apiKey = CONFIG.API_KEY;
  m.model = CONFIG.MODEL;

  const tools = m.getTools();

  // Transform MCP tools into A2A compatible function map
  const functions = [...tools]
    .filter((e) => e.type === "tools/list")
    .reduce(
      (acc, tool) => {
        const funcName = tool.value.name;
        // Map for Function Calling schema
        acc.params_[funcName] = {
          description: tool.value.description,
          parameters: tool.value.inputSchema,
        };
        // Actual function execution reference
        acc[funcName] = tool.function;
        return acc;
      },
      { params_: {} }
    );

  agentCard_ToolsForMCPServer.url = webAppsUrl;

  return {
    A2AObj: {
      functions: () => functions,
      agentCard: () => agentCard_ToolsForMCPServer,
    },
    MCPObj: tools,
  };
}

/**
 * Determines the routing type based on the event object.
 */
function determineRoute_(e) {
  // 1. Check Path Info (e.g. for Agent Discovery)
  if (e.pathInfo && CONFIG.WELL_KNOWN_PATHS.includes(e.pathInfo)) {
    return { type: "A2A" };
  }

  // 2. Check POST Data (JSON-RPC Methods)
  if (e.postData && e.postData.contents) {
    try {
      const obj = JSON.parse(e.postData.contents);
      if (obj.method) {
        if (CONFIG.METHODS.A2A.includes(obj.method)) {
          return { type: "A2A" };
        }
        if (CONFIG.METHODS.MCP.includes(obj.method)) {
          return { type: "MCP" };
        }
      }
    } catch (err) {
      console.warn("Invalid JSON in request", err);
    }
  }
  return { type: "UNKNOWN" };
}

/**
 * Handles requests destined for the A2A Server.
 */
function handleA2ARequest_(e, A2AObj) {
  try {
    const { agentCard, functions } = A2AObj;
    const object = {
      eventObject: e,
      agentCard: agentCard, // Pass the getter function
      functions: functions, // Pass the getter function
      apiKey: apiKey,
      agentCardUrls: [],
    };

    // Initialize A2A Application
    const o = { model: CONFIG.MODEL };
    if (accessKey) {
      o.accessKey = accessKey;
    }
    if (logSpreadsheetId) {
      o.log = true;
      o.spreadsheetId = logSpreadsheetId;
    }
    const res = new A2AApp(o)
      .setServices({ lock: LockService.getScriptLock() })
      .server(object);
    return res;
  } catch (err) {
    console.error(err.stack);
    return ContentService.createTextOutput(err.stack);
  }
}

/**
 * Handles requests destined for the MCP Server.
 */
function handleMCPRequest_(e, MCPObj) {
  try {
    const object = { eventObject: e, items: MCPObj };
    const o = {};
    if (accessKey) {
      o.accessKey = accessKey;
    }
    if (logSpreadsheetId) {
      o.log = true;
      o.spreadsheetId = logSpreadsheetId;
    }
    const res = new MCPApp(o)
      .setServices({ lock: LockService.getScriptLock() })
      .server(object);
    return res;
  } catch (err) {
    console.error(err.stack);
    return ContentService.createTextOutput(err.stack);
  }
}
