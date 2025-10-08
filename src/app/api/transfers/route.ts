
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const gameweek = parseInt(searchParams.get("gameweek") || "1", 10);
  const leagueId = searchParams.get("league_id") || "298749";

  try {
    // Fetch all players for mapping
    const playersRes = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/");
    const playersData = await playersRes.json();
    const playerMap: Record<string, string> = {};
    type Player = {
      id: number;
      first_name: string;
      second_name: string;
    };
    playersData.elements.forEach((p: Player) => {
      playerMap[String(p.id)] = `${p.first_name} ${p.second_name}`;
    });

    // Fetch all pages of managers in the league
    let managers: Manager[] = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const leagueRes = await fetch(
        `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/?page_new_entries=1&page_standings=${page}&phase=1`
      );
      const leagueData = await leagueRes.json();
      const results = leagueData.standings?.results || [];
      managers = managers.concat(results);
      hasMore = leagueData.standings?.has_next || false;
      page += 1;
    }

    // For each manager, fetch their transfers for the selected gameweek
    type Manager = {
      entry: number;
      entry_name: string;
    };

    const transfers = await Promise.all(
      managers.map(async (manager: Manager) => {
        try {
          const transfersRes = await fetch(
            `https://fantasy.premierleague.com/api/entry/${manager.entry}/transfers/`
          );
          const transfersData = await transfersRes.json();
          type Transfer = {
            element_in: number;
            element_out: number;
            time: string;
            event: number;
            cost: number;
          };
          const gwTransfers = (transfersData as Transfer[]).filter(
            (t: Transfer) => t.event === gameweek
          );
          // After fetching managers, build a map of entry -> player_name
          const managerNameMap: Record<number, string> = {};
          managers.forEach((m: Manager) => {
            managerNameMap[m.entry] = (m as Manager & { player_name?: string }).player_name || "";
          });
          return gwTransfers.map((t: Transfer) => ({
            entry: manager.entry,
            entry_name: manager.entry_name,
             player_name: managerNameMap[manager.entry], // manager name
            player_in: playerMap[String(t.element_in)] || t.element_in,
            player_out: playerMap[String(t.element_out)] || t.element_out,
            time: t.time,
            event: t.event,
            cost: t.cost,
          }));
        } catch {
          return [];
        }
      })
    );

    const allTransfers = transfers.flat();

    return NextResponse.json(allTransfers);
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}