import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const managerId = searchParams.get("manager_id");
  if (!managerId) {
    return NextResponse.json({ error: "Missing manager_id" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://fantasy.premierleague.com/api/entry/${managerId}/`
    );
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch manager summary" },
        { status: response.status }
      );
      
    }
    const data = await response.json();
    // console.log(data)
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Error fetching manager summary:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
    
  }
}