import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const gameweek = parseInt(searchParams.get("gameweek") || "1", 10);
  const leagueId = "298749"; // Replace with your league ID

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

    // Get all managers in the league
    const leagueRes = await fetch(
      `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`
    );
    const leagueData = await leagueRes.json();
    const managers = leagueData.standings?.results || [];

    // For each manager, fetch their transfers for the selected gameweek
    type Manager = {
      entry: number;
      entry_name: string;
      // Add other properties if needed
    };

    const transfers = await Promise.all(
      managers.map(async (manager: Manager) => {
        try {
          const transfersRes = await fetch(
            `https://fantasy.premierleague.com/api/entry/${manager.entry}/transfers/`
          );
          const transfersData = await transfersRes.json();
          // Define a type for transfer objects
          type Transfer = {
            element_in: number;
            element_out: number;
            time: string;
            event: number;
            cost: number;
          };
          // Filter transfers for the selected gameweek
          const gwTransfers = (transfersData as Transfer[]).filter(
            (t: Transfer) => t.event === gameweek
          );
          return gwTransfers.map((t: Transfer) => ({
            entry: manager.entry,
            entry_name: manager.entry_name,
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

    // Flatten the array
    const allTransfers = transfers.flat();

    return NextResponse.json(allTransfers);
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}