// import { NextResponse } from "next/server";

// export async function GET(req: Request) {
//   const { searchParams } = new URL(req.url);
//   const gameweek = parseInt(searchParams.get("gameweek") || "1", 10);

//   try {
//     const leagueId = searchParams.get("league_id") || "867909";
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

//     interface Team {
//       entry: number;
//       entry_name: string;
//       player_name: string;
//       rank: number;
//       total: number;
//     }

//     const standings = await Promise.all(
//       data.standings.results.map(async (team: Team) => {
//         // Fetch gameweek points
//         let gameweek_points = 0;
//         try {
//           const entryResponse = await fetch(
//             `https://fantasy.premierleague.com/api/entry/${team.entry}/event/${gameweek}/picks/`
//           );
//           if (entryResponse.ok) {
//             const entryData = await entryResponse.json();
//             gameweek_points = entryData.entry_history.points;
//           }
//         } catch {}

//         // Fetch overall rank
//         let overall_rank = null;
//         try {
//           const summaryResponse = await fetch(
//             `https://fantasy.premierleague.com/api/entry/${team.entry}/`
//           );
//           if (summaryResponse.ok) {
//             const summaryData = await summaryResponse.json();
//             overall_rank = summaryData.summary_overall_rank ?? null;
//           }
//         } catch {}

//         return {
//           entry: team.entry,
//           entry_name: team.entry_name,
//           player_name: team.player_name,
//           rank: team.rank,
//           total: team.total,
//           gameweek_points,
//           overall_rank,
//         };
//       })
//     );

//     return NextResponse.json(standings);
//   } catch (error) {
//     console.error("Error fetching league standings:", error);
//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }


//working last load
// import { NextResponse } from "next/server";

// export async function GET(req: Request) {
//   const { searchParams } = new URL(req.url);
//   const gameweek = parseInt(searchParams.get("gameweek") || "1", 10);
//   const leagueId = searchParams.get("league_id") || "867909";

//   try {
//     // Fetch current gameweek league standings
//     const response = await fetch(
//       `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/?page_standings=1`
//     );

//     if (!response.ok) {
//       return NextResponse.json(
//         { error: "Failed to fetch league standings" },
//         { status: response.status }
//       );
//     }

//     const data = await response.json();

//     interface Team {
//       entry: number;
//       entry_name: string;
//       player_name: string;
//       rank: number;
//       total: number;
//     }

//     const standings = await Promise.all(
//       data.standings.results.map(async (team: Team) => {
//         // Fetch previous rank from entry history (if not GW 1)
//         let prev_rank = null;
//         if (gameweek > 1) {
//           try {
//             const historyResponse = await fetch(
//               `https://fantasy.premierleague.com/api/entry/${team.entry}/history/`
//             );
//             if (historyResponse.ok) {
//               const historyData = await historyResponse.json();
//               // Find the event for the previous gameweek
//               const prevEvent = historyData.past?.find(
//                 (e: { event: number }) => e.event === gameweek - 1
//               );
//               if (prevEvent) {
//                 prev_rank = prevEvent.rank;
//               }
//             }
//           } catch (e) {
//             console.error(`Failed to fetch history for entry ${team.entry}:`, e);
//           }
//         }

//         // Fetch gameweek points for current GW
//         let gameweek_points = 0;
//         try {
//           const entryResponse = await fetch(
//             `https://fantasy.premierleague.com/api/entry/${team.entry}/event/${gameweek}/picks/`
//           );
//           if (entryResponse.ok) {
//             const entryData = await entryResponse.json();
//             gameweek_points = entryData.entry_history?.points || 0;
//           }
//         } catch (e) {
//           console.error(`Failed to fetch GW points for entry ${team.entry}:`, e);
//         }

//         // Fetch overall rank
//         let overall_rank = null;
//         try {
//           const summaryResponse = await fetch(
//             `https://fantasy.premierleague.com/api/entry/${team.entry}/`
//           );
//           if (summaryResponse.ok) {
//             const summaryData = await summaryResponse.json();
//             overall_rank = summaryData.summary_overall_rank ?? null;
//           }
//         } catch (e) {
//           console.error(`Failed to fetch overall rank for entry ${team.entry}:`, e);
//         }

//         return {
//           entry: team.entry,
//           entry_name: team.entry_name,
//           player_name: team.player_name,
//           rank: team.rank,
//           prev_rank: prev_rank,
//           total: team.total,
//           gameweek_points,
//           overall_rank,
//         };
//       })
//     );

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

// // Simple in-memory cache for standings per GW
// interface StandingsData {
//   standings: {
//     results: Array<{
//       entry: number;
//       entry_name: string;
//       player_name: string;
//       rank: number;
//       total: number;
//     }>;
//   };
// }

// declare global {
//   // eslint-disable-next-line no-var
//   var __standingsCache: Map<string, { data: StandingsData; timestamp: number }>;
// }
// if (!global.__standingsCache) {
//   // eslint-disable-next-line no-var
//   global.__standingsCache = new Map();
// }
// const standingsCache = global.__standingsCache;
// const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

// async function fetchLeagueStandings(leagueId: string) {
//   const response = await fetch(
//     `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/?page_standings=1`
//   );

//   if (!response.ok) {
//     throw new Error("Failed to fetch league standings");
//   }

//   return response.json();
// }

// export async function GET(req: Request) {
//   const { searchParams } = new URL(req.url);
//   const gameweek = parseInt(searchParams.get("gameweek") || "1", 10);
//   const leagueId = searchParams.get("league_id") || "867909";

//   try {
//     // Fetch current standings
//     const cacheKey = `${leagueId}:current`;
//     const cachedStandings = standingsCache.get(cacheKey);
//     let currentData;

//     if (cachedStandings && Date.now() - cachedStandings.timestamp < CACHE_TTL_MS) {
//       currentData = cachedStandings.data;
//     } else {
//       currentData = await fetchLeagueStandings(leagueId);
//       standingsCache.set(cacheKey, { data: currentData, timestamp: Date.now() });
//     }

//     // Fetch previous gameweek standings (if not GW 1)
//     let prevData = null;
//     if (gameweek > 1) {
//       const prevCacheKey = `${leagueId}:gw${gameweek - 1}`;
//       const cachedPrev = standingsCache.get(prevCacheKey);

//       if (cachedPrev && Date.now() - cachedPrev.timestamp < CACHE_TTL_MS) {
//         prevData = cachedPrev.data;
//       } else {
//         try {
//           prevData = await fetchLeagueStandings(leagueId);
//           standingsCache.set(prevCacheKey, { data: prevData, timestamp: Date.now() });
//         } catch (e) {
//           console.error("Failed to fetch previous standings:", e);
//         }
//       }
//     }

//     interface Team {
//       entry: number;
//       entry_name: string;
//       player_name: string;
//       rank: number;
//       total: number;
//     }

//     const standings = await Promise.all(
//       currentData.standings.results.map(async (team: Team) => {
//         // Find previous rank from prevData
//         let prev_rank = null;
//         if (prevData) {
//           const prevTeam = prevData.standings.results.find(
//             (t: Team) => t.entry === team.entry
//           );
//           if (prevTeam) {
//             prev_rank = prevTeam.rank;
//           }
//         }

//         // Fetch gameweek points for current GW
//         let gameweek_points = 0;
//         try {
//           const entryResponse = await fetch(
//             `https://fantasy.premierleague.com/api/entry/${team.entry}/event/${gameweek}/picks/`
//           );
//           if (entryResponse.ok) {
//             const entryData = await entryResponse.json();
//             gameweek_points = entryData.entry_history?.points || 0;
//           }
//         } catch (e) {
//           console.error(`Failed to fetch GW points for entry ${team.entry}:`, e);
//         }

//         // Fetch overall rank
//         let overall_rank = null;
//         try {
//           const summaryResponse = await fetch(
//             `https://fantasy.premierleague.com/api/entry/${team.entry}/`
//           );
//           if (summaryResponse.ok) {
//             const summaryData = await summaryResponse.json();
//             overall_rank = summaryData.summary_overall_rank ?? null;
//           }
//         } catch (e) {
//           console.error(`Failed to fetch overall rank for entry ${team.entry}:`, e);
//         }

//         return {
//           entry: team.entry,
//           entry_name: team.entry_name,
//           player_name: team.player_name,
//           rank: team.rank,
//           prev_rank: prev_rank,
//           total: team.total,
//           gameweek_points,
//           overall_rank,
//         };
//       })
//     );

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

interface StandingsData {
  standings: {
    results: Array<{
      entry: number;
      entry_name: string;
      player_name: string;
      rank: number;
      total: number;
    }>;
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __standingsByGW: Map<string, { data: StandingsData; timestamp: number }>;
}
if (!global.__standingsByGW) {
  // eslint-disable-next-line no-var
  global.__standingsByGW = new Map();
}
const standingsByGW = global.__standingsByGW;
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

async function fetchLeagueStandings(leagueId: string): Promise<StandingsData> {
  const response = await fetch(
    `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/?page_standings=1`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch league standings");
  }

  return response.json();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const gameweek = parseInt(searchParams.get("gameweek") || "1", 10);
  const leagueId = searchParams.get("league_id") || "867909";

  try {
    // Fetch current standings
    const currentCacheKey = `${leagueId}:gw${gameweek}`;
    let currentData: StandingsData;

    const cachedCurrent = standingsByGW.get(currentCacheKey);
    if (cachedCurrent && Date.now() - cachedCurrent.timestamp < CACHE_TTL_MS) {
      currentData = cachedCurrent.data;
    } else {
      currentData = await fetchLeagueStandings(leagueId);
      standingsByGW.set(currentCacheKey, { data: currentData, timestamp: Date.now() });
    }

    // Fetch previous gameweek standings (if not GW 1)
    let prevData: StandingsData | null = null;
    if (gameweek > 1) {
      const prevCacheKey = `${leagueId}:gw${gameweek - 1}`;
      const cachedPrev = standingsByGW.get(prevCacheKey);

      if (cachedPrev) {
        prevData = cachedPrev.data;
      }
      // Note: we can only get prevData if it was cached previously
      // If not cached, we can't fetch historical data (FPL API limitation)
    }

    interface Team {
      entry: number;
      entry_name: string;
      player_name: string;
      rank: number;
      total: number;
    }

    const standings = await Promise.all(
      currentData.standings.results.map(async (team: Team) => {
        // Find previous rank from prevData (if available)
        let prev_rank: number | null = null;
        if (prevData) {
          const prevTeam = prevData.standings.results.find(
            (t: Team) => t.entry === team.entry
          );
          if (prevTeam) {
            prev_rank = prevTeam.rank;
          }
        }

        // Fetch gameweek points for current GW
        let gameweek_points = 0;
        try {
          const entryResponse = await fetch(
            `https://fantasy.premierleague.com/api/entry/${team.entry}/event/${gameweek}/picks/`
          );
          if (entryResponse.ok) {
            const entryData = await entryResponse.json();
            gameweek_points = entryData.entry_history?.points || 0;
          }
        } catch (e) {
          console.error(`Failed to fetch GW points for entry ${team.entry}:`, e);
        }

        // Fetch overall rank
        let overall_rank: number | null = null;
        try {
          const summaryResponse = await fetch(
            `https://fantasy.premierleague.com/api/entry/${team.entry}/`
          );
          if (summaryResponse.ok) {
            const summaryData = await summaryResponse.json();
            overall_rank = summaryData.summary_overall_rank ?? null;
          }
        } catch (e) {
          console.error(`Failed to fetch overall rank for entry ${team.entry}:`, e);
        }

        return {
          entry: team.entry,
          entry_name: team.entry_name,
          player_name: team.player_name,
          rank: team.rank,
          prev_rank: prev_rank,
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