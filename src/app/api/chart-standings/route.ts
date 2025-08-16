import { NextResponse } from "next/server";

async function fetchWithRetry(url: string, retries = 3, delay = 1000): Promise<unknown> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response.json();
      }
    } catch {
      console.error(`Retry ${i + 1} failed for ${url}`);
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  try {
    
    const leagueId = searchParams.get("league_id") || "867909";
    // 1. Get all managers in the league (first 50, or fetch all pages if needed)
    const leagueResponse = await fetchWithRetry(
      `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`
    ) as {
      standings?: { results?: { entry: number; entry_name: string }[] }
    };
    type Manager = { entry: number; entry_name: string };
    const managers = leagueResponse.standings?.results?.map((m: Manager) => ({
      entry: m.entry,
      entry_name: m.entry_name,
    })) || [];

    // 2. For each manager, fetch their total points for each gameweek
    type ManagerGameweekData = {
      gameweek: number;
      entry: number;
      entry_name: string;
      total_points: number | null;
      rank?: number;
    };
    const allData: ManagerGameweekData[] = [];
    for (let gameweek = 1; gameweek <= 38; gameweek++) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Throttle to avoid rate limits
      const gwData = await Promise.all(managers.map(async (manager: Manager) => {
        try {
          const entryData = await fetchWithRetry(
            `https://fantasy.premierleague.com/api/entry/${manager.entry}/event/${gameweek}/picks/`
          ) as { entry_history: { total_points: number } };
          return {
            gameweek,
            entry: manager.entry,
            entry_name: manager.entry_name,
            total_points: entryData.entry_history.total_points,
          };
        } catch {
          return {
            gameweek,
            entry: manager.entry,
            entry_name: manager.entry_name,
            total_points: null,
          };
        }
      }));
      allData.push(...gwData);
    }

    // 3. For each gameweek, rank managers by total_points
for (let gameweek = 1; gameweek <= 38; gameweek++) {
  const gwManagers = allData.filter(d => d.gameweek === gameweek && d.total_points !== null);
  gwManagers.sort((a, b) => (b.total_points ?? 0) - (a.total_points ?? 0));
  gwManagers.forEach((manager, idx) => {
    manager.rank = idx + 1;
  });
}



    return NextResponse.json(allData);
    
  } catch (error: unknown) {
    console.error("Error fetching league standings by points:", error);
    let message = "Unknown error";
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === "string") {
      message = error;
    }
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 }
    );
  }
}