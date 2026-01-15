// import { NextRequest } from "next/server";
// import { GoogleGenAI } from "@google/genai";

// export async function GET(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const gw = searchParams.get("gameweek") || "1";
//     const leagueId = searchParams.get("league_id") || "867909";
//     const base = new URL(req.url).origin;

//     // Fetch aggregated data from your internal endpoints (they already proxy to FPL)
//     const [standingsRes, transfersRes, dreamRes, bootstrapRes] = await Promise.all([
//       fetch(`${base}/api/standings?gameweek=${gw}&league_id=${leagueId}`),
//       fetch(`${base}/api/transfers?league_id=${leagueId}&gameweek=${gw}`),
//       fetch(`${base}/api/dream-team?event_id=${gw}`),
//       fetch(`${base}/api/bootstrap-static`),
//     ]);

//     if (!standingsRes.ok || !transfersRes.ok || !dreamRes.ok || !bootstrapRes.ok) {
//       return new Response(JSON.stringify({ error: "Upstream fetch failed" }), { status: 502 });
//     }

//     const standings = await standingsRes.json(); // array of manager standings with gameweek_points
//     const transfers = await transfersRes.json(); // array of transfers
//     const dreamData = await dreamRes.json(); // dream team data
//     const bootstrap = await bootstrapRes.json(); // players, events

//     // Build player map
//     interface Player {
//       id: number;
//       web_name?: string;
//       [key: string]: unknown;
//     }

//     const playerMap: Record<string, Player> = {};
//     (bootstrap.elements || []).forEach((p: unknown) => {
//       const pl = p as Player;
//       if (pl && typeof pl.id === "number") {
//         playerMap[String(pl.id)] = pl;
//       }
//     });

//     // Basic facts
//     interface ManagerStanding {
//       entry: number;
//       entry_name: string;
//       gameweek_points: number;
//       [key: string]: unknown;
//     }

//     const topManager = standings && standings.length
//       ? (standings as ManagerStanding[]).reduce((a: ManagerStanding, b: ManagerStanding) => (b.gameweek_points > a.gameweek_points ? b : a))
//       : null;

//     // transfers: most transferred in / out
//     const inCount: Record<number, number> = {};
//     const outCount: Record<number, number> = {};
//     interface Transfer {
//       player_in: number;
//       player_out: number;
//       [key: string]: unknown;
//     }
//     (transfers as Transfer[]).forEach((t: Transfer) => {
//       inCount[t.player_in] = (inCount[t.player_in] || 0) + 1;
//       outCount[t.player_out] = (outCount[t.player_out] || 0) + 1;
//     });
//     const mostInId = Object.keys(inCount).sort((a, b) => inCount[+b] - inCount[+a])[0];
//     const mostOutId = Object.keys(outCount).sort((a, b) => outCount[+b] - outCount[+a])[0];

//     // Dream picks
//     interface DreamPick {
//       element: number;
//       [key: string]: unknown;
//     }
//     const picks = ((dreamData && (dreamData.team || dreamData.players)) as DreamPick[] | undefined);
//     const dreamPicks = (picks ?? []).map((p: DreamPick) => p.element);

//     const goodTransfers = Object.entries(inCount)
//       .filter(([id]) => dreamPicks.includes(Number(id)))
//       .map(([id, cnt]) => ({ id: Number(id), name: playerMap[id]?.web_name || id, count: cnt }));

//     const badTransfers = Object.entries(outCount)
//       .filter(([id]) => dreamPicks.includes(Number(id)))
//       .map(([id, cnt]) => ({ id: Number(id), name: playerMap[id]?.web_name || id, count: cnt }));

//     const facts = {
//       gameweek: gw,
//       topManager: topManager ? { entry: topManager.entry, entry_name: topManager.entry_name, points: topManager.gameweek_points } : null,
//       mostTransferredIn: mostInId ? { id: Number(mostInId), name: playerMap[String(mostInId)]?.web_name } : null,
//       mostTransferredOut: mostOutId ? { id: Number(mostOutId), name: playerMap[String(mostOutId)]?.web_name } : null,
//       goodTransfers,
//       badTransfers,
//       transfersCount: transfers.length,
//       dreamTeamCount: dreamPicks.length,
//     };

//     const prompt = `
// You are an assistant summarising a Fantasy Premier League gameweek. Use the facts (JSON) and produce a short, user-friendly paragraph (3-6 sentences) summarising:
// - who scored the most points among managers,
// - standout player transfers (name the players and the manager who did) (good/bad),
// - any interesting patterns (captain successes, popular differentials if present),
// - one or two suggestions for next GW,
// - be humorous, have some banter.

// Facts: ${JSON.stringify(facts)}
// Provide a concise summary (no markdown).
// `;

// const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY; 
    
//     let summary = "";
//     let aiError: string | null = null;

//     if (GEMINI_KEY) {
//       try {
//         // 3. Instantiate SDK
//         const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
        
//         // 4. Call the modern Gemini model
//         const response = await ai.models.generateContent({
//           model: "gemini-3-flash-preview", // or "gemini-2.0-flash"
//           contents: prompt, // The SDK handles the object structure automatically
//         });

//         // 5. Extract text (guard against undefined)
//         summary = response?.text?.trim() ?? ""; 

//       } catch (err) {
//         aiError = `Gemini SDK error: ${String(err)}`;
//         console.error(aiError);
//         // Fallback
//         summary = `GW ${gw}: ${facts.topManager ? `${facts.topManager.entry_name} topped the week with ${facts.topManager.points} pts.` : "No standings available."}`;
//       }
//     } else {
//       summary = `GW ${gw}: ${facts.topManager ? `${facts.topManager.entry_name} topped the week with ${facts.topManager.points} pts.` : "No standings available."}`;
//     }

//     return new Response(JSON.stringify({ summary, facts, aiError }), { status: 200 });
//   } catch (err) {
//     console.error("gw-summary error", err);
//     return new Response(JSON.stringify({ error: "Internal error fetching summary" }), { status: 500 });
//   }
// }

import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { unstable_cache } from "next/cache"; // 1. Import this

// 2. Define the AI function separately
// This function takes the prompt and key, returns the text string.
const generateGameweekSummary = async (prompt: string, apiKey: string) => {
  console.log("--- GENERATING NEW AI SUMMARY (Not Cached) ---"); // Log to see when it actually runs
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return null; // Return null so we can handle fallback
  }
};

// 3. Wrap it with unstable_cache
// Next.js will cache the result of this function.
// If the 'prompt' argument is exactly the same as a previous run, it returns the cached value.
const getCachedSummary = unstable_cache(
  generateGameweekSummary,
  ["fpl-gameweek-summary-v1"], // A unique ID for this cache logic
  {
    revalidate: 86400, // Cache lifetime in seconds (86400 = 24 hours)
    tags: ["gameweek-summary"], 
  }
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gw = searchParams.get("gameweek") || "1";
    const leagueId = searchParams.get("league_id") || "867909";
    const base = new URL(req.url).origin;

    // ... (Your existing data fetching logic remains identical) ...
    const [standingsRes, transfersRes, dreamRes, bootstrapRes] = await Promise.all([
      fetch(`${base}/api/standings?gameweek=${gw}&league_id=${leagueId}`),
      fetch(`${base}/api/transfers?league_id=${leagueId}&gameweek=${gw}`),
      fetch(`${base}/api/dream-team?event_id=${gw}`),
      fetch(`${base}/api/bootstrap-static`),
    ]);

    if (!standingsRes.ok || !transfersRes.ok || !dreamRes.ok || !bootstrapRes.ok) {
      return new Response(JSON.stringify({ error: "Upstream fetch failed" }), { status: 502 });
    }

    const standings = await standingsRes.json();
    const transfers = await transfersRes.json();
    const dreamData = await dreamRes.json();
    const bootstrap = await bootstrapRes.json();

    // ... (Your existing processing logic remains identical) ...
    interface Player { id: number; web_name?: string; [key: string]: unknown; }
    const playerMap: Record<string, Player> = {};
    (bootstrap.elements || []).forEach((p: unknown) => {
      const pl = p as Player;
      if (pl && typeof pl.id === "number") playerMap[String(pl.id)] = pl;
    });

    interface ManagerStanding { entry: number; entry_name: string; gameweek_points: number; [key: string]: unknown; }
    const topManager = standings && standings.length
      ? (standings as ManagerStanding[]).reduce((a: ManagerStanding, b: ManagerStanding) => (b.gameweek_points > a.gameweek_points ? b : a))
      : null;

    const inCount: Record<number, number> = {};
    const outCount: Record<number, number> = {};
    interface Transfer { player_in: number; player_out: number; [key: string]: unknown; }
    (transfers as Transfer[]).forEach((t: Transfer) => {
      inCount[t.player_in] = (inCount[t.player_in] || 0) + 1;
      outCount[t.player_out] = (outCount[t.player_out] || 0) + 1;
    });
    
    const mostInId = Object.keys(inCount).sort((a, b) => inCount[+b] - inCount[+a])[0];
    const mostOutId = Object.keys(outCount).sort((a, b) => outCount[+b] - outCount[+a])[0];

    interface DreamPick { element: number; [key: string]: unknown; }
    const picks = ((dreamData && (dreamData.team || dreamData.players)) as DreamPick[] | undefined);
    const dreamPicks = (picks ?? []).map((p: DreamPick) => p.element);

    const goodTransfers = Object.entries(inCount)
      .filter(([id]) => dreamPicks.includes(Number(id)))
      .map(([id, cnt]) => ({ id: Number(id), name: playerMap[id]?.web_name || id, count: cnt }));

    const badTransfers = Object.entries(outCount)
      .filter(([id]) => dreamPicks.includes(Number(id)))
      .map(([id, cnt]) => ({ id: Number(id), name: playerMap[id]?.web_name || id, count: cnt }));

    const facts = {
      gameweek: gw,
      topManager: topManager ? { entry: topManager.entry, entry_name: topManager.entry_name, points: topManager.gameweek_points } : null,
      mostTransferredIn: mostInId ? { id: Number(mostInId), name: playerMap[String(mostInId)]?.web_name } : null,
      mostTransferredOut: mostOutId ? { id: Number(mostOutId), name: playerMap[String(mostOutId)]?.web_name } : null,
      goodTransfers,
      badTransfers,
      transfersCount: transfers.length,
      dreamTeamCount: dreamPicks.length,
    };

    const prompt = `
You are an assistant summarising a Fantasy Premier League gameweek. Use the facts (JSON) and produce a short, user-friendly paragraph (3-6 sentences) summarising:
- who scored the most points among managers (use manager name),
- standout player transfers (good/bad),
- any interesting patterns (captain successes, popular differentials if present (name the players,etc)),
- one or two suggestions for next GW.
- be humorous, have some banter.

Facts: ${JSON.stringify(facts)}
Provide a concise summary (no markdown).
`;

    // --- NEW LOGIC STARTS HERE ---
    
    const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    let summary = "";
    
    // Fallback string in case AI fails or no key
    const fallbackSummary = `GW ${gw}: ${facts.topManager ? `${facts.topManager.entry_name} topped the week with ${facts.topManager.points} pts.` : "No standings available."}`;

    if (GEMINI_KEY) {
      // 4. Call the cached function instead of calling AI directly
      // If 'prompt' has not changed since the last call, this returns instantly from cache.
      const aiResponse = await getCachedSummary(prompt, GEMINI_KEY);
      
      summary = aiResponse || fallbackSummary;
    } else {
      summary = fallbackSummary;
    }

    return new Response(JSON.stringify({ summary, facts }), { status: 200 });

  } catch (err) {
    console.error("gw-summary error", err);
    return new Response(JSON.stringify({ error: "Internal error fetching summary" }), { status: 500 });
  }
}