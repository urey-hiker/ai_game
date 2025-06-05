# MCP Server and Game API

This directory contains a Node.js-based API server and a Master Control Program (MCP) client designed to interact with and play the "头文字R" game.

## Components

1.  **Game API Server (`api_server.js`)**
    *   **Purpose:** Exposes the game's functionality via an HTTP API.
    *   **Technology:** Node.js, Express.js, Puppeteer.
    *   **Functionality:**
        *   Launches the main game (`index.html`) in a headless Chrome browser using Puppeteer.
        *   Provides endpoints to:
            *   Start/restart the game (`POST /api/game/start`).
            *   Get the current game state (`GET /api/game/state`), including prompt, options, score, time, etc.
            *   Perform an action (click an option) in the game (`POST /api/game/action`).
    *   **Interaction:** It calls JavaScript functions exposed on the `window` object in `game.js`.

2.  **MCP Client (`mcp_client.js`)**
    *   **Purpose:** Automatically plays the "头文字R" game by consuming the Game API.
    *   **Technology:** Node.js, Axios.
    *   **Functionality:**
        *   Starts a new game via the API.
        *   Continuously fetches the game state.
        *   Implements the game logic to decide the correct option based on the current mode (basic or advanced) and prompt.
        *   Submits its chosen action to the API.
        *   Logs its decisions and game progress.
        *   Plays until the game is over.

## Running the System

1.  **Start the Game API Server:**
    *   Navigate to the **root directory** of this repository.
    *   Run the command: `node mcp_server/api_server.js`
    *   The server will start, launch a headless browser with the game, and listen on `http://localhost:3000`.

2.  **Run the MCP Client:**
    *   Ensure the Game API Server is running.
    *   Navigate to the `mcp_server` directory (or run from root as `node mcp_server/mcp_client.js`).
    *   Run the command: `node mcp_client.js`
    *   The client will connect to the API server and start playing the game. Console logs will show its progress.

For detailed testing instructions, including `curl` commands for manual API testing and troubleshooting, please see the [Testing Guide](./testing_guide.md).

## Dependencies

All Node.js dependencies for both the server and client are listed in `mcp_server/package.json` and can be installed by running `npm install` within the `mcp_server` directory.
*   `express`: Web framework for the API server.
*   `puppeteer`: Headless Chrome browser automation for game interaction.
*   `axios`: HTTP client for the MCP to communicate with the API.
