'use client'

import { useState, useEffect } from "react";

export default function GeneralData() {
  const [selectedGameweek, setSelectedGameweek] = useState(1);
  const [dreamTeam, setDreamTeam] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all FPL players once
useEffect(() => {
  fetch("/api/bootstrap-static")
    .then((res) => res.json())
    .then((data) => setPlayers(data.elements || []));
}, []);

  // Fetch dream team for selected gameweek
  useEffect(() => {
    setLoading(true);
    fetch(`/api/dream-team?event_id=${selectedGameweek}`)
      .then((res) => res.json())
      .then((data) => {
        setDreamTeam(data.team || data.players || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedGameweek]);

  // Helper to get player name from element id
const getPlayerName = (elementId: number | string) => {
  // Ensure both are numbers for comparison
  const id = typeof elementId === "string" ? parseInt(elementId, 10) : elementId;
  const player = players.find((p) => p.id === id);
  return player ? player.web_name : "Unknown";
};

useEffect(() => {
  console.log("Players:", players);
}, [players]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">General Data</h1>
      <div className="mb-4">
        <label htmlFor="gameweek" className="mr-2 font-medium">Select Gameweek:</label>
        <select
          id="gameweek"
          value={selectedGameweek}
          onChange={e => setSelectedGameweek(Number(e.target.value))}
          className="border rounded px-2 py-1"
        >
          {Array.from({ length: 38 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              Gameweek {i + 1}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <p>Loading dream team...</p>
      ) : Array.isArray(dreamTeam) && dreamTeam.length > 0 ? (
        <div className="w-full max-w-xl">
          <h2 className="text-xl font-semibold mb-2">Dream Team - Gameweek {selectedGameweek}</h2>
          <ul className="space-y-2">
            {dreamTeam.map((player: any) => (
              <li key={player.element}>
                <span className="font-bold">{getPlayerName(player.element)}</span>
                {" "}
                {/* ({player.position}) -  */}
                - {player.points} pts
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>No dream team data available.</p>
      )}
    </div>
  );
}