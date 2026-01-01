/**
 * Script for Consolidating Generative AI Protocols: A Single Server Solution for MCP and A2A
 * Author: Tanaike
 * v1.1.0
 */

// --- Your variables ---
const object = {
  apiKey: "{apiKey}", // Your API key for using Gemini API.
  model: "models/gemini-3-flash-preview",
  accessKey: "sample", // If you want to use an access key for requesting Web Apps, please use this.
  webAppsUrl: "https://script.google.com/macros/s/###/exec", // Your deployed Web Apps URL.
  // logSpreadsheetId: "{spreadsheetId}", // If you use this, the logs are stored to Google Spreadsheet.
};

// --- Entry Points ---
const doGet = (e) => main(e);
const doPost = (e) => main(e);

/**
 * Main Dispatcher Function
 * Routes the request to either A2A handler or MCP handler based on the payload or path.
 *
 * @param {EventObject} e - The event object from doGet/doPost
 * @return {ContentService.TextOutput} The JSON response
 */
function main(e) {
  const m = MCPA2Aserver;
  m.a2a = true; // If this is true, this server is used as the A2A server. You can use both mcp and a2a as true.
  m.mcp = true; // If this is true, this server is used as the MCP server. You can use both mcp and a2a as true.
  m.useToolsForMCPServer = true;
  m.apiKey = object.apiKey;
  m.model = object.model;
  if (object.accessKey) m.accessKey = object.accessKey;
  if (object.logSpreadsheetId) m.logSpreadsheetId = object.logSpreadsheetId;
  m.webAppsUrl = object.webAppsUrl; // If ToolsForMCPServer is used, Web Apps URL is required to be used.
  const res = m.main(e);
  return res;
}
