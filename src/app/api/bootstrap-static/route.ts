import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const res = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/");
  const data = await res.json();
  return new Response(JSON.stringify(data), { status: 200 });
}