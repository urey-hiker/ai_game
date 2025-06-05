const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/game'; // Assuming api_server.js is running locally

// Helper function to call the API
async function callApi(endpoint, method = 'GET', data = null) {
    try {
        const response = await axios({
            method,
            url: `${API_BASE_URL}${endpoint}`,
            data
        });
        return response.data;
    } catch (error) {
        console.error(`Error calling API ${endpoint}:`, error.response ? error.response.data : error.message);
        throw error;
    }
}

// Function to decide the best action based on game state
function decideAction(gameState) {
    if (!gameState || !gameState.options || gameState.options.length === 0) {
        console.log('No options available or invalid game state.');
        return null;
    }

    const { gameMode, options, targetColor, targetText, promptText } = gameState;
    // Access gameConfig.textMap for advanced mode logic
    // Since gameConfig is global in the Puppeteer context, we can't directly access it here.
    // The API should ideally return textMap if needed, or the MCP needs its own copy.
    // For now, let's hardcode a simplified version or assume the API provides enough info.
    // A better approach: The API's /api/game/state could also return gameConfig.textMap.
    // For this implementation, we'll reconstruct a minimal textMap.
    const textMap = { '红': 'red', '黄': 'yellow', '蓝': 'blue', '绿': 'green', '紫': 'purple', '粉': 'pink' };


    console.log(`
--- New Round ---`);
    console.log(`Current Score: ${gameState.score}, Time: ${gameState.time}, Level: ${gameState.level}, Combo: ${gameState.combo}`);
    console.log(`Game Mode: ${gameMode}`);
    console.log(`Prompt: ${promptText}`);
    // console.log('Options:', options.map(opt => `ID: ${opt.id}, Text: ${opt.text}, Color: ${opt.color}`));


    let chosenOptionId = null;

    if (gameMode === 'basic') {
        console.log(`Basic mode - Target: Color=${targetColor}, Text=${targetText}`);
        for (const option of options) {
            if (option.color === targetColor && option.text === targetText) {
                chosenOptionId = option.id;
                console.log(`Chosen (Basic): Option ${chosenOptionId} - Text: ${option.text}, Color: ${option.color}`);
                break;
            }
        }
    } else if (gameMode === 'advanced') {
        console.log('Advanced mode - Target: Color differs from text meaning');
        for (const option of options) {
            // textMap[option.text] gives the color name associated with the word.
            // We need to find an option where option.color is NOT EQUAL to textMap[option.text].
            if (option.color !== textMap[option.text]) {
                chosenOptionId = option.id;
                console.log(`Chosen (Advanced): Option ${chosenOptionId} - Text: ${option.text}, Color: ${option.color} (Text meaning: ${textMap[option.text]})`);
                break;
            }
        }
    } else {
        console.log('Unknown game mode:', gameMode);
        return null;
    }

    if (chosenOptionId === null) {
        console.log('Could not determine a valid action. Available options were:');
        options.forEach(opt => {
            console.log(`  ID: ${opt.id}, Text: ${opt.text}, Color: ${opt.color}` + (gameMode === 'advanced' ? ` (Mapped Text Color: ${textMap[opt.text]})` : ''));
        });
        // Default to clicking the first option if logic fails (crude fallback)
        // chosenOptionId = gameState.options[0]?.id;
        // console.log('Defaulting to first option:', chosenOptionId);
    }

    return chosenOptionId;
}

// Main game loop for the MCP
async function playGame() {
    console.log('MCP Client starting game...');
    let gameState = await callApi('/start', 'POST');

    while (gameState && gameState.currentScreen !== 'result-screen' && gameState.time > 0) {
        const actionId = decideAction(gameState);

        if (actionId !== null) {
            console.log(`MCP performing action: Click option ${actionId}`);
            const actionResult = await callApi('/action', 'POST', { optionIdentifier: actionId });
            gameState = actionResult.newState;
            console.log(`Action result: ${actionResult.wasCorrect ? 'Correct' : 'Incorrect'}. Score: ${gameState.score}, Combo: ${gameState.combo}`);
        } else {
            console.log('MCP failed to decide an action. Ending game or waiting.');
            // Potentially fetch state again or end
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retrying
            gameState = await callApi('/state', 'GET'); // Get fresh state
            if (!gameState || gameState.options.length === 0) {
                 console.log('Still no options, ending.');
                 break;
            }
        }

        // Small delay to simulate human play and avoid flooding the API
        await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200)); // Random delay between 200ms and 700ms
    }

    console.log('
--- Game Over ---');
    if (gameState) {
        console.log(`Final Score: ${gameState.score}`);
        console.log(`Max Combo: ${gameState.maxCombo}`);
        console.log(`Cleared Levels: ${gameState.clearedLevels}`);
        // If gameState.clickTimes exists and is populated by getGameDetails:
        // const accuracy = gameState.totalClicks > 0 ? Math.round((gameState.correctClicks / gameState.totalClicks) * 100) : 0;
        // console.log(`Accuracy: ${accuracy}%`);
    } else {
        console.log('Game ended prematurely or state was lost.');
    }
    console.log('MCP Client finished.');
}

// Start the MCP client
playGame().catch(error => {
    console.error('MCP Client crashed:', error.message);
});
