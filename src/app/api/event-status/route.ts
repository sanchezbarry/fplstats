import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://fantasy.premierleague.com/api/event-status/");
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch event status" },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error fetching event status:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
