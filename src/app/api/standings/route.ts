import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const gameweek = parseInt(searchParams.get("gameweek") || "1", 10);

  try {
    const leagueId = searchParams.get("league_id") || "867909";
    const response = await fetch(
      `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch league standings" },
        { status: response.status }
      );
    }

    const data = await response.json();

    interface Team {
      entry: number;
      entry_name: string;
      player_name: string;
      rank: number;
      total: number;
    }

    const standings = await Promise.all(
      data.standings.results.map(async (team: Team) => {
        // Fetch gameweek points
        let gameweek_points = 0;
        try {
          const entryResponse = await fetch(
            `https://fantasy.premierleague.com/api/entry/${team.entry}/event/${gameweek}/picks/`
          );
          if (entryResponse.ok) {
            const entryData = await entryResponse.json();
            gameweek_points = entryData.entry_history.points;
          }
        } catch {}

        // Fetch overall rank
        let overall_rank = null;
        try {
          const summaryResponse = await fetch(
            `https://fantasy.premierleague.com/api/entry/${team.entry}/`
          );
          if (summaryResponse.ok) {
            const summaryData = await summaryResponse.json();
            overall_rank = summaryData.summary_overall_rank ?? null;
          }
        } catch {}

        return {
          entry: team.entry,
          entry_name: team.entry_name,
          player_name: team.player_name,
          rank: team.rank,
          total: team.total,
          gameweek_points,
          overall_rank,
        };
      })
    );

    return NextResponse.json(standings);
  } catch (error) {
    console.error("Error fetching league standings:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}