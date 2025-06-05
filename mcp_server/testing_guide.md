# Testing Guide for Game API Server and MCP Client

This guide provides instructions on how to set up and run the API server and the MCP client for the game.

## Prerequisites

*   **Node.js:** Ensure Node.js is installed on your system. You can download it from [nodejs.org](https://nodejs.org/).
*   **Chrome/Chromium:** Puppeteer, used by the API server, requires a Chrome or Chromium browser installation.

## Setup

1.  **Navigate to the Server Directory:**
    Open your terminal or command prompt.
    Navigate to the `mcp_server` directory located in the root of this repository:
    ```bash
    cd path/to/repository/mcp_server
    ```

2.  **Install Dependencies:**
    If you haven't already, or if you've pulled new changes, install the necessary Node.js packages:
    ```bash
    npm install
    ```
    This will install `express`, `puppeteer`, and `axios` as defined in `package.json`.

## Running the API Server

The API server uses Puppeteer to interact with the game (`index.html`). It's crucial to run the server from the **root directory** of the repository so that it can correctly locate `index.html`.

1.  **Navigate to the Repository Root:**
    In your terminal, make sure you are in the main project directory (the one containing `index.html` and the `mcp_server` directory).
    ```bash
    cd path/to/repository
    ```

2.  **Start the API Server:**
    Run the following command:
    ```bash
    node mcp_server/api_server.js
    ```

3.  **Expected Output:**
    You should see messages indicating the server is starting, including the path it's using for `index.html`:
    ```
    Loading game from: file:///path/to/repository/index.html
    Game page loaded and initialized.
    Game API server listening at http://localhost:3000
    Make sure you are in the root directory of the repository when running this server.
    ```

## Manual API Testing (using curl)

Once the API server is running, you can test its endpoints using `curl` or a tool like Postman.

1.  **Start/Restart the Game:**
    Open a new terminal window.
    ```bash
    curl -X POST http://localhost:3000/api/game/start
    ```
    *   **Server Console:** You should see activity related to starting the game.
    *   **Curl Output:** A JSON object representing the initial game state.

2.  **Get Game State:**
    ```bash
    curl http://localhost:3000/api/game/state
    ```
    *   **Curl Output:** A JSON object with the current game details.

3.  **Perform an Action (Click an Option):**
    The `optionIdentifier` is the index of the button you want to click (0, 1, 2, etc.).
    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{"optionIdentifier": 0}' http://localhost:3000/api/game/action
    ```
    Replace `0` with the desired option ID.
    *   **Server Console:** Logs related to processing the action.
    *   **Curl Output:** A JSON object showing the `newState` after the action, the `actionTaken`, and whether it `wasCorrect`.

## Running the MCP Client

The MCP (Master Control Program) client automatically plays the game using the API.

1.  **Ensure API Server is Running:** The API server must be running (see previous section).

2.  **Navigate to the Server Directory (if not already there):**
    In a new terminal window:
    ```bash
    cd path/to/repository/mcp_server
    ```

3.  **Start the MCP Client:**
    ```bash
    node mcp_client.js
    ```

4.  **Expected Output:**
    *   **MCP Client Console:** You'll see logs from the client as it:
        *   Starts the game.
        *   Receives game state.
        *   Makes decisions on which option to click (e.g., "Basic mode - Target: ...", "Chosen (Basic): ...").
        *   Performs actions.
        *   Reports whether the action was correct or incorrect.
        *   Finally, shows "Game Over" with the final score.
    *   **API Server Console:** You'll see corresponding logs for each API request made by the MCP client (game start, state requests, actions).

## Troubleshooting Tips

*   **Port Conflicts:**
    *   If you see an error like `Error: listen EADDRINUSE: address already in use :::3000`, it means another application is using port 3000.
    *   You can either stop the other application or change the `port` variable in `mcp_server/api_server.js` to something else (e.g., 3001) and update `API_BASE_URL` in `mcp_server/mcp_client.js` accordingly.
*   **Puppeteer Errors:**
    *   `Error: Failed to launch the browser process!`: This often means Chrome/Chromium cannot be found or there are issues with its installation/permissions. Ensure it's installed correctly and accessible. The `args: ['--no-sandbox', '--disable-setuid-sandbox']` in `api_server.js` help in some environments, but further OS-specific troubleshooting might be needed.
    *   `Protocol error (Page.navigate): Target closed.` or similar: Could indicate issues with the game page loading or crashing within Puppeteer. Check the `gameHtmlPath` log from the API server.
*   **Path Issues (API Server):**
    *   If `api_server.js` reports it cannot find `index.html`, double-check that you are running the `node mcp_server/api_server.js` command from the **repository root directory**, not from within `mcp_server`.
    *   The log `Loading game from: file:///...` will show the exact path it's trying to use.
*   **MCP Client Errors:**
    *   `Error calling API /start: connect ECONNREFUSED 127.0.0.1:3000`: This means the API server is not running or not accessible at `http://localhost:3000`. Ensure the API server is started first.
    *   If the MCP client reports "Could not determine a valid action" repeatedly, check the game state logs it prints. There might be an issue with the game logic itself or how the MCP client is interpreting the state. The enhanced logging should show the options it was evaluating.
*   **File Not Found `index.html`:**
    *   The `api_server.js` tries to load `index.html` using `file://${path.join(process.cwd(), 'index.html')}`. `process.cwd()` refers to the directory from which the `node` command was executed. If you run `node api_server.js` from within the `mcp_server` directory, `process.cwd()` will be `path/to/repository/mcp_server`, and `index.html` will not be found. **Always run `node mcp_server/api_server.js` from the repository root.**

This guide should help in testing the basic functionality of the API server and the MCP client.
