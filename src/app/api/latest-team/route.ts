import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const managerId = searchParams.get("manager_id");
  const gw = searchParams.get("gw");

  console.log("API latest-team called with:", managerId, gw); // 👈

  if (!managerId || !gw) {
    return NextResponse.json({ error: "Missing manager_id or gw" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://fantasy.premierleague.com/api/entry/${managerId}/event/${gw}/picks/`);
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch picks" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error fetching team picks:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
