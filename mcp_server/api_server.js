const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const port = 3000; // Or any other port you prefer

app.use(express.json());

let browser;
let page;

async function initGamePage() {
    browser = await puppeteer.launch({
        headless: true, // Run headless. Change to false for debugging.
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Necessary for some environments
    });
    page = await browser.newPage();

    // Serve static files from the project root to allow Puppeteer to load game assets.
    // The path to index.html needs to be relative to where the server is run from,
    // or an absolute path. Assuming server is run from repo root.
    const gameHtmlPath = `file://${path.join(process.cwd(), 'index.html')}`;
    console.log(`Loading game from: ${gameHtmlPath}`);

    await page.goto(gameHtmlPath, { waitUntil: 'networkidle0' });

    // Expose a helper function in Puppeteer to wait for game state to settle
    await page.exposeFunction('waitForGameReady', async (timeout = 500) => {
        return new Promise(resolve => setTimeout(resolve, timeout));
    });
    console.log('Game page loaded and initialized.');
}

// Endpoint to start/restart the game
app.post('/api/game/start', async (req, res) => {
    try {
        if (!page) {
            await initGamePage(); // Initialize if not already done
        }
        await page.evaluate(() => window.startGameExternal());
        await page.evaluate(() => waitForGameReady()); // Wait a bit for game to be ready
        const gameState = await page.evaluate(() => window.getGameDetails());
        res.json(gameState);
    } catch (error) {
        console.error('Error starting game:', error);
        res.status(500).json({ error: 'Failed to start game', details: error.message });
    }
});

// Endpoint to get the current game state
app.get('/api/game/state', async (req, res) => {
    try {
        if (!page) {
            return res.status(400).json({ error: 'Game not started. Call /api/game/start first.' });
        }
        const gameState = await page.evaluate(() => window.getGameDetails());
        res.json(gameState);
    } catch (error) {
        console.error('Error getting game state:', error);
        res.status(500).json({ error: 'Failed to get game state', details: error.message });
    }
});

// Endpoint to perform an action (click an option)
app.post('/api/game/action', async (req, res) => {
    try {
        if (!page) {
            return res.status(400).json({ error: 'Game not started. Call /api/game/start first.' });
        }
        const { optionIdentifier } = req.body;
        if (optionIdentifier === undefined) {
            return res.status(400).json({ error: 'optionIdentifier is required.' });
        }

        const previousState = await page.evaluate(() => window.getGameDetails());
        await page.evaluate((id) => window.clickOption(id), optionIdentifier);
        await page.evaluate(() => waitForGameReady()); // Wait for game logic to process click

        const newState = await page.evaluate(() => window.getGameDetails());

        // Determine if action was correct (simple check, can be improved)
        let wasCorrect = false;
        if (newState.score > previousState.score) {
            wasCorrect = true;
        } else if (newState.combo > previousState.combo && previousState.combo > 0) { // Combo increased
             wasCorrect = true;
        } else if (newState.combo === 0 && previousState.combo > 0 && newState.score === previousState.score) { // Combo reset, score same (likely wrong)
            wasCorrect = false;
        } else if (newState.score === previousState.score && newState.time < previousState.time) { // Score same, time decreased (likely wrong)
            wasCorrect = false;
        }


        res.json({
            newState,
            actionTaken: optionIdentifier,
            wasCorrect // This is a basic inference
        });
    } catch (error) {
        console.error('Error performing game action:', error);
        res.status(500).json({ error: 'Failed to perform game action', details: error.message });
    }
});

// Start the server and initialize Puppeteer
async function startServer() {
    await initGamePage();
    app.listen(port, () => {
        console.log(`Game API server listening at http://localhost:${port}`);
        console.log('Make sure you are in the root directory of the repository when running this server.');
    });
}

startServer().catch(error => {
    console.error('Failed to start server:', error);
    if (browser) {
        browser.close();
    }
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down server and browser...');
    if (browser) {
        await browser.close();
    }
    process.exit(0);
});
