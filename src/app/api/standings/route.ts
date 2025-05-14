// import { NextResponse } from "next/server";

// export async function GET() {
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
//     return NextResponse.json(data.standings.results);
//   } catch (error) {
//     console.error("Error fetching league standings:", error);
//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }

// import { NextResponse } from "next/server";

// export async function GET(req: Request) {
//   const { searchParams } = new URL(req.url);
//   const gameweek = searchParams.get("gameweek") || "1"; // Default to gameweek 1

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

//     // Simulate gameweek points (replace with actual logic if available)
//     interface Team {
//       id: number;
//       name: string;
//       total_points: number;
//       // Add other fields as per the API response
//     }

//     const standings = data.standings.results.map((team: Team) => ({
//       ...team,
//       gameweek_points: Math.floor(Math.random() * 100), // Replace with actual gameweek points logic
//     }));

//     return NextResponse.json(standings);
//   } catch (error) {
//     console.error("Error fetching league standings:", error);
//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }

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

//     // Simulate gameweek points and calculate total points up to the selected gameweek
//     interface Team {
//       id: number;
//       name: string;
//       total_points: number;
//       gameweek_points: number[];
//       // Add other fields as per the API response
//     }

//     const standings = data.standings.results.map((team: Team) => {
//       // Simulate gameweek points for each gameweek (replace with actual logic if available)
//       const simulatedGameweekPoints = Array.from({ length: 38 }, () =>
//         Math.floor(Math.random() * 100)
//       );

//       // Calculate total points up to the selected gameweek
//       const totalPointsUpToGameweek = simulatedGameweekPoints
//         .slice(0, gameweek)
//         .reduce((sum, points) => sum + points, 0);

//       return {
//         ...team,
//         gameweek_points: simulatedGameweekPoints[gameweek - 1], // Points for the selected gameweek
//         total_points: totalPointsUpToGameweek, // Total points up to the selected gameweek
//       };
//     });

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
  const gameweek = parseInt(searchParams.get("gameweek") || "1", 10); // Default to gameweek 1

  try {
    const leagueId = "298749"; // Replace with your league ID
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

    // Fetch gameweek-specific data for each team
    const standings = await Promise.all(
      data.standings.results.map(async (team: { entry: number; id: number; name: string; total_points: number }) => {
        const entryResponse = await fetch(
          `https://fantasy.premierleague.com/api/entry/${team.entry}/event/${gameweek}/picks/`
        );

        if (!entryResponse.ok) {
          console.error(`Failed to fetch gameweek data for team ${team.entry}`);
          return {
            ...team,
            gameweek_points: 0, // Default to 0 if the fetch fails
          };
        }

        const entryData = await entryResponse.json();

        return {
          ...team,
          gameweek_points: entryData.entry_history.points, // Points for the selected gameweek
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

// import { NextResponse } from "next/server";

// export async function GET(req: Request) {
//   const { searchParams } = new URL(req.url);
//   const isHistoric = searchParams.get("historic") === "true";

//   try {
//     const leagueId = "298749"; // Replace with your league ID

//     if (isHistoric) {
//       // Fetch league standings for all gameweeks (1–38)
//       const historicStandings = await Promise.all(
//         Array.from({ length: 38 }, (_, i) => i + 1).map(async (gameweek) => {
//           const response = await fetch(
//             `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`
//           );

//           if (!response.ok) {
//             console.error(`Failed to fetch standings for gameweek ${gameweek}`);
//             return [];
//           }

//           const data = await response.json();

//           // Map standings to include gameweek and rank
//           return data.standings.results.map((team: { entry_name: string; rank: number }) => ({
//             gameweek,
//             entry_name: team.entry_name,
//             rank: team.rank,
//           }));
//         })
//       );

//       // Flatten the array of gameweek standings
//       const flattenedStandings = historicStandings.flat();

//       return NextResponse.json(flattenedStandings);
//     }

//     // Default behavior for current standings
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
//     return NextResponse.json(data.standings.results);
//   } catch (error) {
//     console.error("Error fetching league standings:", error);
//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }

// import { NextResponse } from "next/server";

// export async function GET(req: Request) {
//   const { searchParams } = new URL(req.url);
//   const isHistoric = searchParams.get("historic") === "true";

//   try {
//     const leagueId = "298749"; // Replace with your league ID

//     if (isHistoric) {
//       // Fetch league standings for all gameweeks (1–38)
//       const historicStandings = await Promise.all(
//         Array.from({ length: 38 }, (_, i) => i + 1).map(async (gameweek) => {
//           const response = await fetch(
//             `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`
//           );

//           if (!response.ok) {
//             console.error(`Failed to fetch standings for gameweek ${gameweek}`);
//             return [];
//           }

//           const data = await response.json();

//           // Map standings to include gameweek and rank
//           return data.standings.results.map((team: { entry_name: string; rank: number }) => ({
//             gameweek,
//             entry_name: team.entry_name,
//             rank: team.rank,
//           }));
//         })
//       );

//       // Flatten the array of gameweek standings
//       const flattenedStandings = historicStandings.flat();

//       return NextResponse.json(flattenedStandings);
//     }

//     // Default behavior for current standings
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
//     return NextResponse.json(data.standings.results);
//   } catch (error) {
//     console.error("Error fetching league standings:", error);
//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }