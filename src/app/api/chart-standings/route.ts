import { NextResponse } from "next/server";

async function fetchWithRetry(url: string, retries = 3, delay = 1000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
    } catch (error) {
      console.error(`Retry ${i + 1} failed for ${url}`);
    }
    await new Promise((resolve) => setTimeout(resolve, delay)); // Wait before retrying
  }
  throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}

export async function GET() {
  try {
    const leagueId = "298749"; // Replace with your league ID

    // Fetch the initial league standings to get the list of managers
    const leagueResponse = await fetchWithRetry(
      `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`
    );

    const leagueData = await leagueResponse.json();

    // Extract the list of managers (teams)
    const managers = leagueData.standings.results;

    // Fetch league-specific rank for all managers across all gameweeks (1–38)
    const historicStandings = await Promise.all(
      Array.from({ length: 38 }, (_, i) => i + 1).map(async (gameweek) => {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Throttle requests
        const gameweekData = await Promise.all(
          managers.map(async (manager: { entry: number; entry_name: string }) => {
            try {
              const entryResponse = await fetchWithRetry(
                `https://fantasy.premierleague.com/api/entry/${manager.entry}/event/${gameweek}/picks/`
              );

              const entryData = await entryResponse.json();

              return {
                gameweek,
                entry_name: manager.entry_name,
                rank: entryData.entry_history.rank, // Use the league rank from the gameweek data
              };
            } catch (error) {
              console.error(
                `Failed to fetch gameweek ${gameweek} data for team ${manager.entry_name} (entry: ${manager.entry})`
              );
              return {
                gameweek,
                entry_name: manager.entry_name,
                rank: null, // Default to null if the fetch fails
              };
            }
          })
        );

        return gameweekData;
      })
    );

    // Flatten the array of gameweek standings
    const flattenedStandings = historicStandings.flat();

    return NextResponse.json(flattenedStandings);
  } catch (error) {
    console.error("Error fetching historic league standings:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}