

// import { NextResponse } from "next/server";

// export async function GET(req: Request) {
//   const { searchParams } = new URL(req.url);
//   const gameweek = parseInt(searchParams.get("gameweek") || "1", 10); // Default to gameweek 1

//   try {
//     const leagueId = "298749"; // Replace with your league ID
//     const response = await fetch(
//       `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`
//     );

//     if (!response.ok) {
//       return NextResponse.json(
//         { error: "Failed to fetch league standings" },
//         { status: response.status }
//       );
//     }

//     const data = await response.json();

//     // Fetch gameweek-specific data for each team
//     // const standings = await Promise.all(
//     //   data.standings.results.map(async (team: { entry: number; id: number; name: string; total_points: number }) => {
//     //     const entryResponse = await fetch(
//     //       `https://fantasy.premierleague.com/api/entry/${team.entry}/event/${gameweek}/picks/`
//     //     );

//     //     if (!entryResponse.ok) {
//     //       console.error(`Failed to fetch gameweek data for team ${team.entry}`);
//     //       return {
//     //         ...team,
//     //         gameweek_points: 0, // Default to 0 if the fetch fails
//     //       };
//     //     }

//     //     const entryData = await entryResponse.json();

//     //     return {
//     //       ...team,
//     //       gameweek_points: entryData.entry_history.points, // Points for the selected gameweek
          
//     //     };
//     //   })
//     // );

//     interface Team {
//       entry: number;
//       entry_name: string;
//       player_name: string;
//       rank: number;
//       total: number;
//       overall_rank?: number;
//       entry_rank?: number;
//     }

//     const standings = await Promise.all(
//   data.standings.results.map(async (team: Team) => {
//     const entryResponse = await fetch(
//       `https://fantasy.premierleague.com/api/entry/${team.entry}/event/${gameweek}/picks/`
//     );

//     let gameweek_points = 0;
//     if (entryResponse.ok) {
//       const entryData = await entryResponse.json();
//       gameweek_points = entryData.entry_history.points;
//     }

//     return {
//       entry: team.entry,
//       entry_name: team.entry_name,
//       player_name: team.player_name,
//       rank: team.rank,
//       total: team.total,
//       gameweek_points,
//       overall_rank: team.overall_rank ?? team.entry_rank ?? null, // Add this line
//     };
//   })
// );

//     // ...inside your API handler for /api/standings
// interface Manager {
//   entry: number;
//   entry_name: string;
//   player_name: string;
//   rank: number;
//   total: number;
//   event_total: number;
//   overall_rank?: number;
//   entry_rank?: number;
// }

// const managers = data.standings?.results?.map((m: Manager) => ({
//   entry: m.entry,
//   entry_name: m.entry_name,
//   player_name: m.player_name,
//   rank: m.rank,
//   total: m.total,
//   gameweek_points: m.event_total,
//   overall_rank: m.overall_rank ?? m.entry_rank, // Use the correct property
// })) || [];

//     return NextResponse.json(standings);
//   } catch (error) {
//     console.error("Error fetching league standings:", error);
//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const gameweek = parseInt(searchParams.get("gameweek") || "1", 10);

  try {
    const leagueId = "298749";
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