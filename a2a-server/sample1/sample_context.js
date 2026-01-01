function createServerContext_() {
  const functions = {
    params_: {
      get_exchange_rate: {
        description: "Use this to get current exchange rate.",
        parameters: {
          type: "object",
          properties: {
            currency_from: {
              type: "string",
              description: "Source currency (major currency). Default is USD.",
            },
            currency_to: {
              type: "string",
              description:
                "Destination currency (major currency). Default is EUR.",
            },
            currency_date: {
              type: "string",
              description:
                "Date of the currency. Default is latest. It should be ISO format (YYYY-MM-DD).",
            },
          },
          required: ["currency_from", "currency_to", "currency_date"],
        },
      },

      get_current_weather: {
        description: [
          "Use this to get the weather using the latitude and the longitude.",
          "At that time, convert the location to the latitude and the longitude and provide them to the function.",
          `The date is required to be included. The date format is "yyyy-MM-dd HH:mm"`,
          `If you cannot know the location, decide the location using the timezone.`,
        ].join("\n"),
        parameters: {
          type: "object",
          properties: {
            latitude: {
              type: "number",
              description: "The latitude of the inputed location.",
            },
            longitude: {
              type: "number",
              description: "The longitude of the inputed location.",
            },
            date: {
              type: "string",
              description: `Date for searching the weather. The date format is "yyyy-MM-dd HH:mm"`,
            },
            timezone: {
              type: "string",
              description: `The timezone. In the case of Japan, "Asia/Tokyo" is used.`,
            },
          },
          required: ["latitude", "longitude", "date", "timezone"],
        },
      },
    },

    /**
     * Ref: https://github.com/google/A2A/blob/main/samples/python/agents/langgraph/agent.py#L19
     */
    get_exchange_rate: (object) => {
      console.log("Run the function get_exchange_rate.");
      console.log(object); // Check arguments.
      const {
        currency_from = "USD",
        currency_to = "EUR",
        currency_date = "latest",
      } = object;
      let res;
      try {
        const resStr = UrlFetchApp.fetch(
          `https://api.frankfurter.app/${currency_date}?from=${currency_from}&to=${currency_to}`
        ).getContentText();
        const obj = JSON.parse(resStr);
        res = [
          `The raw data from the API is ${resStr}. The detailed result is as follows.`,
          `The currency rate at ${currency_date} from "${currency_from}" to "${currency_to}" is ${obj.rates[currency_to]}.`,
        ].join("\n");
      } catch ({ stack }) {
        res = stack;
      }
      console.log(res); // Check response.
      return {
        mcp: {
          jsonrpc: "2.0",
          result: { content: [{ type: "text", text: res }], isError: false },
        },
        a2a: { result: res },
      };
    },

    /**
     * This function returns the current weather.
     * The API is from https://open-meteo.com/
     *
     * { latitude = "35.681236", longitude = "139.767125", date = "2025-05-27 12:00", timezone = "Asia/Tokyo" } is Tokyo station.
     */
    get_current_weather: (object) => {
      console.log("Run the function get_current_weather.");
      console.log(object); // Check arguments.
      const {
        latitude = "35.681236",
        longitude = "139.767125",
        date = "2025-05-27 12:00",
        timezone = "Asia/Tokyo",
      } = object;
      let res;
      try {
        // Ref: https://open-meteo.com/en/docs?hourly=weather_code&current=weather_code#weather_variable_documentation
        const code = {
          0: "Clear sky",
          1: "Mainly clear, partly cloudy, and overcast",
          2: "Mainly clear, partly cloudy, and overcast",
          3: "Mainly clear, partly cloudy, and overcast",
          45: "Fog and depositing rime fog",
          48: "Fog and depositing rime fog",
          51: "Drizzle: Light, moderate, and dense intensity",
          53: "Drizzle: Light, moderate, and dense intensity",
          55: "Drizzle: Light, moderate, and dense intensity",
          56: "Freezing Drizzle: Light and dense intensity",
          57: "Freezing Drizzle: Light and dense intensity",
          61: "Rain: Slight, moderate and heavy intensity",
          63: "Rain: Slight, moderate and heavy intensity",
          65: "Rain: Slight, moderate and heavy intensity",
          66: "Freezing Rain: Light and heavy intensity",
          67: "Freezing Rain: Light and heavy intensity",
          71: "Snow fall: Slight, moderate, and heavy intensity",
          73: "Snow fall: Slight, moderate, and heavy intensity",
          75: "Snow fall: Slight, moderate, and heavy intensity",
          77: "Snow grains",
          80: "Rain showers: Slight, moderate, and violent",
          81: "Rain showers: Slight, moderate, and violent",
          82: "Rain showers: Slight, moderate, and violent",
          85: "Snow showers slight and heavy",
          86: "Snow showers slight and heavy",
          95: "Thunderstorm: Slight or moderate",
          96: "Thunderstorm with slight and heavy hail",
          99: "Thunderstorm with slight and heavy hail",
        };
        const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=weather_code&timezone=${encodeURIComponent(
          timezone
        )}`;
        const resObj = UrlFetchApp.fetch(endpoint, {
          muteHttpExceptions: true,
        });
        if (resObj.getResponseCode() == 200) {
          const obj = JSON.parse(resObj.getContentText());
          const {
            hourly: { time, weather_code },
          } = obj;
          const widx = time.indexOf(date.replace(" ", "T").trim());
          if (widx != -1) {
            res = code[weather_code[widx]];
          } else {
            res = "No value was returned. Please try again.";
          }
        } else {
          res = "No value was returned. Please try again.";
        }
      } catch ({ stack }) {
        res = stack;
      }
      console.log(res); // Check response.
      return {
        mcp: {
          jsonrpc: "2.0",
          result: { content: [{ type: "text", text: res }], isError: false },
        },
        a2a: { result: res },
      };
    },
  };

  /**
   * If you want to return the file content to MCP client, please set the return value as follows.
   * {
   *   jsonrpc: "2.0",
   *   result: {
   *    content: [
   *      {
   *        type: "text",
   *         text: "sample text",
   *       },
   *       {
   *         type: "image",
   *         data: "base64 data",
   *         mimeType: "mimetype",
   *       },
   *     ],
   *     isError: false,
   *   }
   * }
   *
   * If you want to return the file content to A2A client, please set the return value as follows.
   * {
   *   result: {
   *     type: "file",
   *     kind: "file",
   *     file: {
   *       name: "filename",
   *       bytes: "base64 data",
   *       mimeType: "mimetype",
   *     },
   *     metadata: null
   *   }
   * }
   *
   */

  // for A2A
  const agentCard = {
    name: "API Manager",
    description: [
      `Provide management for using various APIs.`,
      `- Run with exchange values between various currencies. For example, this answers "What is the exchange rate between USD and GBP?".`,
      `- Return the weather information by providing the location and the date, and the time.`,
    ].join("\n"),
    provider: {
      organization: "Tanaike",
      url: "https://github.com/tanaikech",
    },
    version: "1.0.0",
    // "url": "https://script.google.com/macros/s/###/exec?accessKey=sample", // <--- Please replace this to your Web Apps URL.
    url: `${webAppsUrl}?accessKey=${accessKey}`,
    defaultInputModes: ["text/plain"],
    defaultOutputModes: ["text/plain"],
    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: false,
    },
    skills: [
      {
        id: "get_exchange_rate",
        name: "Currency Exchange Rates Tool",
        description: "Helps with exchange values between various currencies",
        tags: ["currency conversion", "currency exchange"],
        examples: ["What is exchange rate between USD and GBP?"],
        inputModes: ["text/plain"],
        outputModes: ["text/plain"],
      },
      {
        id: "get_current_weather",
        name: "Get current weather",
        description:
          "This agent can return the weather information by providing the location and the date, and the time.",
        tags: ["weather"],
        examples: [
          "Return the weather in Tokyo for tomorrow's lunchtime.",
          "Return the weather in Tokyo for 9 AM on May 27, 2025.",
        ],
        inputModes: ["text/plain"],
        outputModes: ["text/plain"],
      },
    ],
  };

  // for MCP
  const itemsForMCP = [
    {
      type: "initialize",
      value: {
        protocolVersion: "2024-11-05", // or "2025-03-26"
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "API Manager", version: "1.0.0" },
      },
    },
    ...Object.keys(functions.params_).map((f) => ({
      type: "tools/list",
      function: functions[f],
      value: {
        name: f,
        description: functions.params_[f].description,
        inputSchema: functions.params_[f].parameters,
      },
    })),
  ];

  return {
    A2AObj: { functions: (_) => functions, agentCard: (_) => agentCard },
    MCPObj: itemsForMCP,
  };
}
