import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("event_id");

  if (!eventId) {
    return new Response(JSON.stringify({ error: "Missing event_id" }), { status: 400 });
  }

  const res = await fetch(`https://fantasy.premierleague.com/api/dream-team/${eventId}`);
  const data = await res.json();

  return new Response(JSON.stringify(data), { status: 200 });
}

