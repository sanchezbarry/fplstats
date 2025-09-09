// 'use client'

// import { useState, useEffect } from "react";

// export default function GeneralData() {
//   const [selectedGameweek, setSelectedGameweek] = useState(1);
//   interface DreamTeamPlayer {
//     element: number;
//     points: number;
//     // Add other properties if needed, e.g. position: string;
//   }

//   const [dreamTeam, setDreamTeam] = useState<DreamTeamPlayer[]>([]);
//   interface Player {
//     id: number;
//     web_name: string;
//     // Add other properties as needed from the API response
//   }
//   const [players, setPlayers] = useState<Player[]>([]);
//   const [loading, setLoading] = useState(false);

//   // Fetch all FPL players once
// useEffect(() => {
//   fetch("/api/bootstrap-static")
//     .then((res) => res.json())
//     .then((data) => setPlayers(data.elements || []));
// }, []);

//   // Fetch dream team for selected gameweek
//   useEffect(() => {
//     setLoading(true);
//     fetch(`/api/dream-team?event_id=${selectedGameweek}`)
//       .then((res) => res.json())
//       .then((data) => {
//         setDreamTeam(data.team || data.players || []);
//         setLoading(false);
//       })
//       .catch(() => setLoading(false));
//   }, [selectedGameweek]);

//   // Helper to get player name from element id
// const getPlayerName = (elementId: number | string) => {
//   // Ensure both are numbers for comparison
//   const id = typeof elementId === "string" ? parseInt(elementId, 10) : elementId;
//   const player = players.find((p) => p.id === id);
//   return player ? player.web_name : "Unknown";
// };

// useEffect(() => {
//   console.log("Players:", players);
// }, [players]);

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen">
//       <h1 className="text-2xl font-bold mb-4">General Data</h1>
//       <div className="mb-4">
//         <label htmlFor="gameweek" className="mr-2 font-medium">Select Gameweek:</label>
//         <select
//           id="gameweek"
//           value={selectedGameweek}
//           onChange={e => setSelectedGameweek(Number(e.target.value))}
//           className="border rounded px-2 py-1"
//         >
//           {Array.from({ length: 38 }, (_, i) => (
//             <option key={i + 1} value={i + 1}>
//               Gameweek {i + 1}
//             </option>
//           ))}
//         </select>
//       </div>
//       {loading ? (
//         <p>Loading dream team...</p>
//       ) : Array.isArray(dreamTeam) && dreamTeam.length > 0 ? (
//         <div className="w-full max-w-xl">
//           <h2 className="text-xl font-semibold mb-2">Dream Team - Gameweek {selectedGameweek}</h2>
//           <ul className="space-y-2">
//             {dreamTeam.map((player: DreamTeamPlayer) => (
//               <li key={player.element}>
//                 <span className="font-bold">{getPlayerName(player.element)}</span>
//                 {" "}
//                 {/* ({player.position}) -  */}
//                 - {player.points} pts
//               </li>
//             ))}
//           </ul>
//         </div>
//       ) : (
//         <p>No dream team data available.</p>
//       )}
//     </div>
//   );
// }



'use client'

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GeneralData() {
  const [selectedGameweek, setSelectedGameweek] = useState(1);

  // ---- Types ----
  interface DreamTeamPlayer {
    element: number;
    points: number;
  }

  interface Player {
    id: number;
    web_name: string;
  }

interface EventStatus {
  status: { bonus_added: boolean; date: string | null; event: number; points: string }[];
  leagues: { last_updated_data: string };
}

  // ---- State ----
  const [dreamTeam, setDreamTeam] = useState<DreamTeamPlayer[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [eventStatus, setEventStatus] = useState<EventStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ---- Fetch all FPL players once ----
  useEffect(() => {
    fetch("/api/bootstrap-static")
      .then((res) => res.json())
      .then((data) => setPlayers(data.elements || []));
  }, []);

  // ---- Fetch dream team for selected gameweek ----
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

  // ---- Fetch event status ----
  const fetchEventStatus = () => {
    setRefreshing(true);
    fetch("/api/event-status")
      .then((res) => res.json())
      .then((data) => {
        console.log("Event status:", data);
        setEventStatus(data);
        setRefreshing(false);
      })
      .catch((err) => {
        console.error("Failed to fetch event status:", err);
        setRefreshing(false);
      });
  };

  // Fetch once when page loads
  useEffect(() => {
    fetchEventStatus();
  }, []);

  // ---- Helper to get player name ----
  const getPlayerName = (elementId: number | string) => {
    const id = typeof elementId === "string" ? parseInt(elementId, 10) : elementId;
    const player = players.find((p) => p.id === id);
    return player ? player.web_name : "Unknown";
  };


  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">General Data</h1>

{/* ---- Event Status ---- */}
{eventStatus && (
  <Card>
    <CardHeader className="flex flex-row justify-between items-center">
      <CardTitle>Current Gameweek Status</CardTitle>
      <Button onClick={fetchEventStatus} disabled={refreshing}>
        {refreshing ? "Refreshing..." : "Refresh"}
      </Button>
    </CardHeader>

    <CardContent>
      <CardDescription>
        Use this to check if points/bonuses have been added for the current gameweek.
      </CardDescription>

      {eventStatus.status.length > 0 ? (
        (() => {
          const latest = eventStatus.status[eventStatus.status.length - 1];
          return (
            <div className="mt-2">
              <p>
                GW {latest.event}:{" "}
                {latest.bonus_added ? "Bonus Added" : "Bonus Pending"} |{" "}
                {latest.points === "r" ? "Regular points added" : "Pending"} |{" "}
                Last update:{" "}
                {latest.date ? new Date(latest.date).toLocaleString() : "No update yet"}
              </p>
            </div>
          );
        })()
      ) : (
        <p>No event status available</p>
      )}

      {/* <CardDescription>
<p className="text-xs text-gray-600 mt-2">
  Leagues last updated:{" "}
  {eventStatus.leagues?.last_updated_data
    ? new Date(eventStatus.leagues.last_updated_data).toLocaleString()
    : "No update yet"}
</p>

      </CardDescription> */}
    </CardContent>
  </Card>
)}


      {/* ---- Gameweek Selector ---- */}
      <div className="my-4">
        <label htmlFor="gameweek" className="mr-2 font-medium">
          Select Gameweek:
        </label>
        <select
          id="gameweek"
          value={selectedGameweek}
          onChange={(e) => setSelectedGameweek(Number(e.target.value))}
          className="border rounded px-2 py-1"
        >
          {Array.from({ length: 38 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              Gameweek {i + 1}
            </option>
          ))}
        </select>
      </div>






      {/* ---- Dream Team ---- */}
      {loading ? (
        <p>Loading dream team...</p>
      ) : Array.isArray(dreamTeam) && dreamTeam.length > 0 ? (
        <div className="w-full max-w-xl">
          <h2 className="text-xl font-semibold mb-2">
            Dream Team - Gameweek {selectedGameweek}
          </h2>
          <ul className="space-y-2">
            {dreamTeam.map((player: DreamTeamPlayer) => (
              <li key={player.element}>
                <span className="font-bold">{getPlayerName(player.element)}</span>{" "}
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

