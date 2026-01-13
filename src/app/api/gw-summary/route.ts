// import { NextRequest } from "next/server";

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
//       // allow other fields coming from the bootstrap payload without using `any`
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
//       // allow other fields coming from the standings payload without using `any`
//       [key: string]: unknown;
//     }

//     const topManager = standings && standings.length
//       ? (standings as ManagerStanding[]).reduce((a: ManagerStanding, b: ManagerStanding) => (b.gameweek_points > a.gameweek_points ? b : a))
//       : null;

//     // transfers: most transferred in / out
//         const inCount: Record<number, number> = {};
//         const outCount: Record<number, number> = {};
//         interface Transfer {
//           player_in: number;
//           player_out: number;
//           [key: string]: unknown;
//         }
//         (transfers as Transfer[]).forEach((t: Transfer) => {
//           inCount[t.player_in] = (inCount[t.player_in] || 0) + 1;
//           outCount[t.player_out] = (outCount[t.player_out] || 0) + 1;
//         });
//         const mostInId = Object.keys(inCount).sort((a, b) => inCount[+b] - inCount[+a])[0];
//         const mostOutId = Object.keys(outCount).sort((a, b) => outCount[+b] - outCount[+a])[0];

//     // Good transfers: players with many ins who scored >=6 (use dream team + player fixtures if available)
//     // For simplicity, look up dream team and transfers intersection
//     interface DreamPick {
//       element: number;
//       [key: string]: unknown;
//     }
//     const picks = ((dreamData && (dreamData.team || dreamData.players)) as DreamPick[] | undefined);
//     const dreamPicks = (picks ?? []).map((p: DreamPick) => p.element);

//     const goodTransfers = Object.entries(inCount)
//       .filter(([id]) => dreamPicks.includes(Number(id)))
//       .map(([id, cnt]) => ({ id: Number(id), name: playerMap[id]?.web_name || id, count: cnt }));

//     // Bad transfers: players transferred out who appear in dream team (quick heuristic)
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

//     // Build prompt for the LLM
//     const prompt = `
// You are an assistant summarising a Fantasy Premier League gameweek. Use the facts (JSON) and produce a short, user-friendly paragraph (3-6 sentences) summarising:
// - who scored the most points among managers,
// - standout player transfers (good/bad),
// - any interesting patterns (captain successes, popular differentials if present),
// - one or two suggestions for next GW.
// - be humorous, have some banter.

// Facts: ${JSON.stringify(facts)}
// Provide a concise summary (no markdown).
// `;

//     // Call OpenAI (requires OPENAI_API_KEY env var)
//     const OPENAI_KEY = process.env.OPENAI_API_KEY;
//     let summary = "";

//     if (OPENAI_KEY) {
//       const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${OPENAI_KEY}`,
//         },
//         body: JSON.stringify({
//           model: "gpt-3.5-turbo", // change to a model you have access to
//           messages: [{ role: "system", content: "You are a concise FPL assistant." }, { role: "user", content: prompt }],
//           max_tokens: 300,
//           temperature: 0.6,
//         }),
//       });

//       if (aiRes.ok) {
//         const aiJson = await aiRes.json();
//         // Chat completion: get first message
//         summary = aiJson?.choices?.[0]?.message?.content?.trim() || "";
//       } else {
//         summary = "AI summary unavailable (LLM call failed).";
//       }
//     } else {
//       // fallback quick summary if no API key
//       summary = `GW ${gw}: ${facts.topManager ? `${facts.topManager.entry_name} topped the week with ${facts.topManager.points} pts.` : "No standings available."} ${facts.mostTransferredIn?.name ? `Most transferred in: ${facts.mostTransferredIn.name}.` : ""}`;
//     }

//     return new Response(JSON.stringify({ summary, facts }), { status: 200 });
//   } catch (err) {
//     console.error("gw-summary error", err);
//     return new Response(JSON.stringify({ error: "Internal error fetching summary" }), { status: 500 });
//   }
// }


// console.log("OPENAI key present:", !!process.env.OPENAI_API_KEY);

import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gw = searchParams.get("gameweek") || "1";
    const leagueId = searchParams.get("league_id") || "867909";
    const base = new URL(req.url).origin;

    // Fetch aggregated data from your internal endpoints (they already proxy to FPL)
    const [standingsRes, transfersRes, dreamRes, bootstrapRes] = await Promise.all([
      fetch(`${base}/api/standings?gameweek=${gw}&league_id=${leagueId}`),
      fetch(`${base}/api/transfers?league_id=${leagueId}&gameweek=${gw}`),
      fetch(`${base}/api/dream-team?event_id=${gw}`),
      fetch(`${base}/api/bootstrap-static`),
    ]);

    if (!standingsRes.ok || !transfersRes.ok || !dreamRes.ok || !bootstrapRes.ok) {
      return new Response(JSON.stringify({ error: "Upstream fetch failed" }), { status: 502 });
    }

    const standings = await standingsRes.json(); // array of manager standings with gameweek_points
    const transfers = await transfersRes.json(); // array of transfers
    const dreamData = await dreamRes.json(); // dream team data
    const bootstrap = await bootstrapRes.json(); // players, events

    // Build player map
    interface Player {
      id: number;
      web_name?: string;
      [key: string]: unknown;
    }

    const playerMap: Record<string, Player> = {};
    (bootstrap.elements || []).forEach((p: unknown) => {
      const pl = p as Player;
      if (pl && typeof pl.id === "number") {
        playerMap[String(pl.id)] = pl;
      }
    });

    // Basic facts
    interface ManagerStanding {
      entry: number;
      entry_name: string;
      gameweek_points: number;
      [key: string]: unknown;
    }

    const topManager = standings && standings.length
      ? (standings as ManagerStanding[]).reduce((a: ManagerStanding, b: ManagerStanding) => (b.gameweek_points > a.gameweek_points ? b : a))
      : null;

    // transfers: most transferred in / out
    const inCount: Record<number, number> = {};
    const outCount: Record<number, number> = {};
    interface Transfer {
      player_in: number;
      player_out: number;
      [key: string]: unknown;
    }
    (transfers as Transfer[]).forEach((t: Transfer) => {
      inCount[t.player_in] = (inCount[t.player_in] || 0) + 1;
      outCount[t.player_out] = (outCount[t.player_out] || 0) + 1;
    });
    const mostInId = Object.keys(inCount).sort((a, b) => inCount[+b] - inCount[+a])[0];
    const mostOutId = Object.keys(outCount).sort((a, b) => outCount[+b] - outCount[+a])[0];

    // Dream picks
    interface DreamPick {
      element: number;
      [key: string]: unknown;
    }
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

    // Build prompt for the model
//     const prompt = `
// You are an assistant summarising a Fantasy Premier League gameweek. Use the facts (JSON) and produce a short, user-friendly paragraph (3-6 sentences) summarising:
// - who scored the most points among managers,
// - standout player transfers (good/bad),
// - any interesting patterns (captain successes, popular differentials if present),
// - one or two suggestions for next GW,
// - be humorous, have some banter.

// Facts: ${JSON.stringify(facts)}
// Provide a concise summary (no markdown).
// `;

//     // Use Google's Generative Language API (AI Studio / Text-Bison) via API key
//     const GOOGLE_KEY = process.env.GOOGLE_API_KEY;
//     let summary = "";
//     let aiError: string | null = null;

//     if (GOOGLE_KEY) {
//       const url = `https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText?key=${GOOGLE_KEY}`;
//       try {
//         const controller = new AbortController();
//         const timeout = setTimeout(() => controller.abort(), 10000);

//         const res = await fetch(url, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           signal: controller.signal,
//           body: JSON.stringify({
//             prompt: { text: prompt },
//             temperature: 0.6,
//             max_output_tokens: 300,
//             candidate_count: 1,
//           }),
//         });

//         const text = await res.text();
//         clearTimeout(timeout);

//         if (!res.ok) {
//           aiError = `Google API error ${res.status}: ${text}`;
//           console.error(aiError);
//           // fallback deterministic summary
//           summary = `GW ${gw}: ${facts.topManager ? `${facts.topManager.entry_name} topped the week with ${facts.topManager.points} pts.` : "No standings available."} ${facts.mostTransferredIn?.name ? `Most transferred in: ${facts.mostTransferredIn.name}.` : ""}`;
//         } else {
//           const json = JSON.parse(text);
//           // Generative API returns candidates array with "output"
//           const candidate = json?.candidates?.[0]?.output ?? json?.candidates?.[0]?.content?.[0]?.text ?? null;
//           summary = candidate ? String(candidate).trim() : "";
//         }
//       } catch (err) {
//         aiError = `Google fetch error: ${String(err)}`;
//         console.error(aiError);
//         summary = `GW ${gw}: ${facts.topManager ? `${facts.topManager.entry_name} topped the week with ${facts.topManager.points} pts.` : "No standings available."}`;
//       }
//     } else {
//       // No key -> deterministic fallback
//       summary = `GW ${gw}: ${facts.topManager ? `${facts.topManager.entry_name} topped the week with ${facts.topManager.points} pts.` : "No standings available."} ${facts.mostTransferredIn?.name ? `Most transferred in: ${facts.mostTransferredIn.name}.` : ""}`;
//     }

//     return new Response(JSON.stringify({ summary, facts, aiError }), { status: 200 });
//   } catch (err) {
//     console.error("gw-summary error", err);
//     return new Response(JSON.stringify({ error: "Internal error fetching summary" }), { status: 500 });
//   }
// }

    const prompt = `
You are an assistant summarising a Fantasy Premier League gameweek. Use the facts (JSON) and produce a short, user-friendly paragraph (3-6 sentences) summarising:
- who scored the most points among managers,
- standout player transfers (good/bad),
- any interesting patterns (captain successes, popular differentials if present),
- one or two suggestions for next GW,
- be humorous, have some banter.

Facts: ${JSON.stringify(facts)}
Provide a concise summary (no markdown).
`;

const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY; 
    
    let summary = "";
    let aiError: string | null = null;

    if (GEMINI_KEY) {
      try {
        // 3. Instantiate SDK
        const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
        
        // 4. Call the modern Gemini model
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview", // or "gemini-2.0-flash"
          contents: prompt, // The SDK handles the object structure automatically
        });

        // 5. Extract text (guard against undefined)
        summary = response?.text?.trim() ?? "";

      } catch (err) {
        aiError = `Gemini SDK error: ${String(err)}`;
        console.error(aiError);
        // Fallback
        summary = `GW ${gw}: ${facts.topManager ? `${facts.topManager.entry_name} topped the week with ${facts.topManager.points} pts.` : "No standings available."}`;
      }
    } else {
      summary = `GW ${gw}: ${facts.topManager ? `${facts.topManager.entry_name} topped the week with ${facts.topManager.points} pts.` : "No standings available."}`;
    }

    return new Response(JSON.stringify({ summary, facts, aiError }), { status: 200 });
  } catch (err) {
    console.error("gw-summary error", err);
    return new Response(JSON.stringify({ error: "Internal error fetching summary" }), { status: 500 });
  }
}