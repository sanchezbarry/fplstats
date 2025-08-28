import { NextResponse } from "next/server";

let cachedTeams: Record<number, { name: string; short_name: string; badge: string }> | null = null;
let lastFetched: number | null = null;

export async function GET() {
  const now = Date.now();

  if (cachedTeams && lastFetched && now - lastFetched < 60 * 60 * 1000) {
    return NextResponse.json(cachedTeams);
  }

  try {
    const res = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/");
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch teams" }, { status: res.status });
    }

    const data = await res.json();
    const teams: Record<number, { name: string; short_name: string; badge: string }> = {};

    for (const team of data.teams) {
      teams[team.id] = {
        name: team.name,
        short_name: team.short_name,
        badge: `https://resources.premierleague.com/premierleague/badges/50/t${team.code}.png`,
      };
    }

    cachedTeams = teams;
    lastFetched = now;

    return NextResponse.json(teams);
  } catch (err) {
    console.error("Error fetching FPL teams:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
