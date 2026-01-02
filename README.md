<a name="top"></a>

# Overcoming Tool Space Interference: Bridging Google ADK and A2A SDK via Google Apps Script

[![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENCE)

This repository serves as a bridge between **Google Apps Script (GAS)** and the **Agent2Agent (A2A)** protocol. It enables the creation of scalable, distributed AI agent networks using Google's low-code environment, designed specifically to mitigate **Tool Space Interference (TSI)**.

This solution overcomes the limitations of standard A2A SDKs when connecting to GAS (dynamic URLs and OAuth redirects) by using a custom proxy.

![](images/fig1.jpg)

<a name="overview"></a>

## 📝 Overview

As AI agents integrate more tools, "Tool Space Interference" (TSI) occurs—verbose metadata saturates the context window, causing hallucinations. While centralized gateways (like [Nexus-MCP](https://medium.com/google-cloud/nexus-mcp-a-unified-gateway-for-scalable-and-deterministic-mcp-server-aggregation-3211f0adc603)) help, a distributed **Agent2Agent** architecture is more efficient for complex tasks.

**Key Features:**

- **Distributed Architecture:** Run multiple GAS servers in parallel (e.g., one for Office tools, one for Data tools).
- **TSI Mitigation:** Uses deterministic logic to dynamically "install" only the necessary tools into the context window (tested with 160+ tools).
- **Custom Proxy:** Solves the compatibility gap between the standard A2A SDK and GAS dynamic URLs/OAuth.
- **Dual Protocol:** Works as an A2A server and a Remote MCP server.

Detailed information can be found in my Medium article: [**Beyond Nexus-MCP: Distributed Task Execution and TSI Mitigation via Google Apps Script A2A Servers**](https://medium.com/google-cloud/nexus-mcp-a-unified-gateway-for-scalable-and-deterministic-mcp-server-aggregation-3211f0adc603)

---

<a name="architecture"></a>

## 🏗 Architecture and Workflow

While Nexus-MCP aggregates tools into one gateway, this A2A architecture allows us to group tools by category and execute tasks in a distributed manner.

![](images/fig2.jpg)

1.  **User Prompt:** The user sends a request to the Client.
2.  **Proxy Resolution:** The custom proxy (`clientGas.js`) handles GAS redirects and authentication.
3.  **Discovery:** The GAS A2A Server returns only relevant tool definitions to avoid context saturation.
4.  **Execution:** The Server dynamically loads the specific tool required (Nexus-MCP logic) and executes it.

---

<a name="prerequisites"></a>

## 🛠 Prerequisites

- **Node.js**: (Latest LTS recommended)
- **Google Account**: To host the GAS server.
- **Gemini API Key**: [Get one here](https://ai.google.dev/gemini-api/docs/api-key).
- **Google Cloud SDK**: For local authentication (`gcloud` CLI).

---

<a name="usage"></a>

## 🚀 Usage

### 1. Server-Side Setup (Google Apps Script)

You can deploy the sample A2A server (containing 160 tools) to your Google Drive.

1.  **Copy the Script**
    Run the following GAS script to copy the project to your Drive, or manually copy the code from `a2a-server/sample2/a2a-server.js`.

    ```javascript
    function copyA2AServer() {
      const fileId =
        "1mylSOTzCuui95Amk-kRufA9ffMqcnjqk8HSaoatoxaSPwkv-hg1q7uRC";
      const file = DriveApp.getFileById(fileId);
      file.makeCopy(file.getName());
    }
    ```

2.  **Deploy as Web App**

    - Open the script editor.
    - Click **Deploy** > **New deployment**.
    - Select **Web App**.
    - **Execute as**: Me.
    - **Who has access**: Anyone.
    - Copy the **Web App URL**.

3.  **Configuration**
    Update the `object` variable in the GAS script:

    ```javascript
    const object = {
      apiKey: "YOUR_GEMINI_API_KEY",
      model: "models/gemini-3-flash-preview",
      accessKey: "sample", // Optional security key
      webAppsUrl: "YOUR_WEB_APP_URL",
    };
    ```

    _Note: Redeploy the Web App after updating the code._

### 2. Client-Side Setup (Node.js)

1.  **Clone and Install**

    ```bash
    git clone https://github.com/tanaikech/a2a-for-google-apps-script
    cd a2a-for-google-apps-script/a2a-client
    npm install
    ```

2.  **Set Environment Variables**
    Create a `.env` file in the `a2a-client` directory:

    ```text
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
    GEMINI_MODEL="models/gemini-3-flash-preview"
    A2A_WEB_APPS_URL="https://script.google.com/macros/s/###/exec?accessKey=sample"
    ```

3.  **Authentication**
    This client uses a custom proxy that requires a Google Access Token. Login via gcloud:
    ```bash
    gcloud auth application-default login --scopes="https://www.googleapis.com/auth/drive.readonly"
    ```

---

<a name="testing"></a>

## 🧪 Testing

### Test 1: Terminal Check

Verify basic connectivity and TSI logic.

```bash
npm run test1
```

**Result:**

```text
Prompt: How much is 10 yen in USD?
Response: 10 yen is approximately **0.0641 USD**...
Prompt: What is the weather forecast for Tokyo?
Response: The weather forecast for Tokyo... is clear sky.
```

### Test 2: Browser Interface (ADK)

Launch the Agent Development Kit chat interface.

```bash
npm run test2
```

Access `http://localhost:8000` in your browser.

**Example Prompt:**

> Write a comprehensive article about developing Google Apps Script (GAS) using generative AI. The article should include an introductory overview, formatted lists for best practices, and a table comparing different AI-assisted coding techniques. Once generated, please create a new Google Document, insert the content, convert the Google Document to a PDF file, and send an email to `tanaike@hotmail.com` including the shareable URL of the PDF file by giving a suitable title and email body.

**Outcome:**
The agent seamlessly handles multiple tools (Drive, Docs, Gmail) without TSI errors.

![](images/fig4a.gif)

---

<a name="advanced"></a>

## 💡 Advanced: Remote MCP

This server can also be used as a remote MCP server with the Gemini CLI. Add this to your `.gemini/setting.json`:

```json
"mcpServers": {
  "gas_web_apps": {
    "command": "npx",
    "args": [
      "mcp-remote",
      "https://script.google.com/macros/s/###/exec?accessKey=sample"
    ],
    "timeout": 300000
  }
}
```

## MCPA2Aserver

The repository of MCPA2Aserver is [https://github.com/tanaikech/MCPA2Aserver-GAS-Library](https://github.com/tanaikech/MCPA2Aserver-GAS-Library).

---

<a name="license"></a>

## Licence

[MIT](LICENCE)

<a name="author"></a>

## Author

[Tanaike](https://tanaikech.github.io/about/)

[Donate](https://tanaikech.github.io/donate/)

<a name="history"></a>

## Update History

- v1.0.0 (January 1, 2026)
  - Initial release.

[TOP](#top)
