// This is the interface to the AI Director. It now makes a real network call.

const API_ENDPOINT = '/api/chronica'; // Placeholder for the real endpoint

function getMockResponse(chosenDifficulty) {
  console.warn('AI Director API call failed or is mocked. Returning mock data.');
  const difficultyDelta = { 'easy': 0.8, 'medium': 1.0, 'hard': 1.5 }[chosenDifficulty];
  const eventHook = { type: 'none', params: {}, flavorText: 'The path ahead seems quiet... for now.' };

  if (chosenDifficulty === 'hard' && Math.random() > 0.5) {
    eventHook.type = 'drones';
    eventHook.params = { count: 5 };
    eventHook.flavorText = 'Hostile drone signatures detected ahead!';
  }

  // Example of a fog event for testing
  const visualTheme = { palette: 'default', fog: null };
  if (Math.random() > 0.5) {
      visualTheme.fog = { color: 0xaaaaaa, near: 10, far: 200 };
  }

  return {
    difficultyDelta,
    eventHook,
    rewards: { soft: 100 * difficultyDelta },
    visualTheme,
  };
}

export const AIDirector = {
  getRunParameters: async (playerState, chosenDifficulty) => {
    const requestBody = {
      playerState,
      chosenDifficulty,
      // In a real scenario, more context would be sent
      // e.g., session ID, run history, etc.
    };

    try {
      // Since we can't make real fetch calls in this environment,
      // we will immediately fall back to the mock response.
      // In a real project, the fetch call would be here:
      /*
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
      */

      // Simulate a network delay
      await new Promise(res => setTimeout(res, 250));

      // For now, let's throw an error to test the fallback mechanism.
      throw new Error("Simulated network failure");

    } catch (error) {
      console.error("AI Director Error:", error);
      return getMockResponse(chosenDifficulty);
    }
  },
};
