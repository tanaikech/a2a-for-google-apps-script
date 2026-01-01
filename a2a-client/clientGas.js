import { execSync } from "child_process";

export class ClientGAS {
  constructor(ClientFactory = null) {
    if (!ClientFactory) {
      throw new Error("Set ClientFactory of '@a2a-js/sdk/client'.");
    }
    this.ClientFactory = ClientFactory;
  }

  /**
   * Retrieves the Google Cloud access token by executing the gcloud CLI.
   * This token is necessary to authenticate requests to the Google Apps Script Web App.
   *
   * The method performs two main steps:
   * 1. Checks if the `gcloud` command is available in the system environment.
   * 2. Executes `gcloud auth print-access-token` to fetch the current valid token.
   *
   * If the CLI is missing or authentication fails, the process will exit with an error message.
   *
   * @returns {string} The raw Google Cloud access token (trimmed).
   */
  getAccessToken() {
    // 1. Check if gcloud CLI is installed
    try {
      // Use stdio: 'ignore' to discard output and only detect errors (exit code != 0)
      execSync("gcloud --version", { stdio: "ignore" });
    } catch (error) {
      console.error(
        "\n[Error] Google Cloud SDK (gcloud CLI) not found or failed to run."
      );
      console.error(
        "Please install it by following the official instructions:"
      );
      console.error("https://cloud.google.com/sdk/gcloud");
      process.exit(1);
    }

    // 2. Obtain access token
    try {
      // Specify encoding: 'utf8' to receive as a String instead of a Buffer
      return execSync("gcloud auth print-access-token", {
        encoding: "utf8",
      }).trim();
    } catch (error) {
      console.error("\nError obtaining access token:");
      console.error(error.message);
      console.error(
        "Please ensure you are authenticated with gcloud CLI. Run 'gcloud auth application-default login'."
      );
      process.exit(1);
    }
  }

  /**
   * Receives the GAS Web Apps URL and returns an A2A Client instance.
   * Intercepts fetch to rewrite requests for .well-known/agent-card.json to the GAS format.
   *
   * @param {string} a2aUrl - Google Apps Script Web Apps URL
   * @returns {Promise<import("@a2a-js/sdk/client").Client>} A2A Client instance
   */
  async createFromUrl(a2aUrl) {
    const factory = new this.ClientFactory();

    // The a2a URL is not GAS Web Apps.
    if (!a2aUrl.includes("script.google.com")) {
      return await new ClientFactory().createFromUrl(a2aUrl);
    }

    // Retrieve the token using the static method within the class
    const token = this.getAccessToken();

    const originalFetch = globalThis.fetch;

    globalThis.fetch = async (input, init = {}) => {
      // Add the Authorization header to every request
      init.headers = { ...init.headers, authorization: `Bearer ${token}` };
      const urlStr = input.toString();

      /**
       * Get agent card from A2A server built by Google Apps Script Web Apps.
       * Google Apps Script Web Apps do not support standard static file serving logic directly,
       * so we rewrite the path to point to the correct endpoint.
       */
      if (urlStr.includes("script.google.com")) {
        const u = new URL(a2aUrl);
        // Construct the specific URL for retrieving the agent card
        const initUrl = `${u.origin}${u.pathname}/.well-known/agent-card.json${
          u.search || ""
        }`;

        const response = await originalFetch(initUrl, init);

        if (!response.ok) {
          const err = await response.text();
          throw new Error(`HTTP error ${response.status} Error: ${err}.`);
        }
        return response;
      }

      return originalFetch(input, init);
    };

    let client;
    try {
      client = await factory.createFromUrl(a2aUrl);
    } finally {
      // Always restore the original fetch, even if creation fails
      globalThis.fetch = originalFetch;
    }

    return client;
  }
}
