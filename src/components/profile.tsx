import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import Image from "next/image";



// import { ScrollArea } from "@/components/ui/scroll-area"; 

interface Manager {
  entry: number;
  entry_name: string;
  player_name?: string;
}

interface SeasonHistory {
  season_name: string;
  total_points: number;
  rank: number;
  overall_rank: number;
  points_on_bench: number;
}

interface PlayerPick {
  element: number;          // player ID
  position: number;         // lineup position (1-15)
  multiplier: number;       // 0 if bench, >0 if starting
  is_captain: boolean;
  is_vice_captain: boolean;
}

interface Player {
  id: number;
  web_name: string;      // short display name (e.g. "Haaland")
  first_name: string;
  second_name: string;
  team: number;          // maps to team.id
  photo: string;         // e.g. "12345.jpg"
  element_type: number;  // 1 GK, 2 DEF, 3 MID, 4 FWD
}

interface ManagerSummary {
  id: number;
  name: string; // Team name
  player_first_name: string;
  player_last_name: string;
  joined_time: string; // ISO timestamp
  favourite_team: number; // team ID (not the name, needs mapping)
  started_event: number;
  player_region_name: string;
  player_region_iso_code_short: string;
  player_region_iso_code_long: string;
  summary_overall_points: number;
  summary_overall_rank: number;
  summary_event_points: number;
  summary_event_rank: number;
  current_event: number;
  kit: string;
  name_change_blocked: boolean;
}

interface ProfileProps {
  leagueId: string;
}
export default function Profile({ leagueId }: ProfileProps) {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null); 
  const [seasonHistory, setSeasonHistory] = useState<SeasonHistory[]>([]); // array
  const [managerProfile, setManagerProfile] = useState<ManagerSummary | null>(null); //object not array
  const [latestTeam, setLatestTeam] = useState<PlayerPick[]>([]);
  const [players, setPlayers] = useState<Record<number, Player>>({});

  const [loadingManagers, setLoadingManagers] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  
  

  const [teams, setTeams] = useState<Record<number, { name: string; short_name: string; badge: string }>>({});


  //get teams
  useEffect(() => {
  fetch("/api/teams")
    .then((res) => res.json())
    .then((data) => setTeams(data))
    .catch((err) => console.error("Failed to load teams", err));
}, []);

  // Fetch managers from league
useEffect(() => {
  setLoadingManagers(true);
  fetch(`/api/standings?league_id=${leagueId}`)
    .then((res) => res.json())
    .then((data) => {
      setManagers(data);
      setLoadingManagers(false);
      setSelectedManager(null); // Reset selected manager when league changes
      setSeasonHistory([]);     // Reset history
      setManagerProfile(null); 
    })
    .catch(() => setLoadingManagers(false));
}, [leagueId]);

//get all players once
useEffect(() => {
  fetch("/api/bootstrap-static")
    .then((res) => res.json())
    .then((data) => {
      console.log("Bootstrap-static elements count:", data.elements.length);
      const map: Record<number, Player> = {};
      data.elements.forEach((p: Player) => {
        map[p.id] = p;
      });
      setPlayers(map);
    })
    .catch((err) => console.error("Failed to fetch players", err));
}, []);




  // Fetch manager history when selected
  useEffect(() => {
    if (!selectedManager) return;
    setLoadingHistory(true);
    fetch(`/api/profile?manager_id=${selectedManager.entry}`)
      .then((res) => res.json())
      .then((data) => {
        setSeasonHistory(data.past || []);
        setLoadingHistory(false);
      })
      .catch(() => setLoadingHistory(false));
      // console.log("Fetching history for manager ID:", seasonHistory.season_name);
  }, [selectedManager]);

  

// Fetch manager summary when a manager is selected
useEffect(() => {
  if (!selectedManager) return;
  console.log("Selected manager 1:", selectedManager);
  console.log("Manager profile 1:", managerProfile);


  console.log("Fetching manager summary for:", selectedManager.entry);
  setLoadingProfile(true);

  fetch(`/api/profilesummary?manager_id=${selectedManager.entry}`)
    .then((res) => res.json())
    .then((data) => {
      console.log("Manager summary loaded:", data);
      setManagerProfile(data);
    })
    .catch((err) => console.error("Error fetching manager summary:", err))
    .finally(() => setLoadingProfile(false));
}, [selectedManager]);

// Fetch latest team after managerProfile is loaded
useEffect(() => {
  if (!selectedManager) return;
    console.log("Selected manager:", selectedManager);
  console.log("Manager profile:", managerProfile);

  if (!selectedManager || !managerProfile?.current_event) return;


  const gw = managerProfile.current_event;
  console.log(`Fetching latest team for manager ${selectedManager.entry}, GW ${gw}`);
  setLatestTeam([]); // reset

  fetch(`/api/latest-team?manager_id=${selectedManager.entry}&gw=${gw}`)
    .then((res) => res.json())
    .then((data) => {
      if (data?.picks) {
        console.log("Latest team picks loaded:", data.picks);
        setLatestTeam(data.picks as PlayerPick[]);
      } else {
        console.log("No picks returned", data);
      }
    })
    .catch((err) => console.error("Failed to fetch latest team:", err));
}, [selectedManager, managerProfile]);


function Formation({ picks, players }: { picks: PlayerPick[]; players: Record<number, Player> }) {
  if (!picks.length || !Object.keys(players).length) return null;

  // Starting XI only
  const starting = picks.filter((p) => p.position <= 11);
    // Bench
  const bench = picks.filter((p) => p.position > 11);


  const byType = {
    GK: starting.filter((p) => players[p.element]?.element_type === 1),
    DEF: starting.filter((p) => players[p.element]?.element_type === 2),
    MID: starting.filter((p) => players[p.element]?.element_type === 3),
    FWD: starting.filter((p) => players[p.element]?.element_type === 4),
  };

  return (
    <div className="bg-green-700 rounded-2xl p-6 text-white">
      {Object.entries(byType).map(([type, picksByType]) => (
        <div
          key={type}
          className={`flex justify-center gap-4 mb-6 ${type === 'GK' ? 'justify-center mb-6' : ''}`}
        >
          {picksByType.map((pick) => {
            const pl = players[pick.element];
            return pl ? <PlayerCard key={pick.element} pick={pick} player={pl} /> : null;
          })}
        </div>
      ))}

            {/* Bench */}
      {bench.length > 0 && (
        <div className="mt-8">
          <h4 className="text-center text-base font-semibold mb-2">Bench</h4>
          <div className="flex justify-center gap-4">
            {bench.map((pick) => {
              const pl = players[pick.element];
              return pl ? <PlayerCard key={pick.element} pick={pick} player={pl} /> : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}


function getHeadshotUrl(photo: string, size: '110x140' | '250x250' = '110x140') {
  // photo comes like "141746.jpg" – we need just the numeric part and PNGs
  const code = photo.split('.')[0];
  return `https://resources.premierleague.com/premierleague/photos/players/${size}/p${code}.png`;
}

function PlayerCard({ pick, player }: { pick: PlayerPick; player: Player }) {
  const [src, setSrc] = React.useState<string>(getHeadshotUrl(player.photo));

  return (
    <div className="flex flex-col items-center">
      <Image
        src={src}
        alt={player.web_name}
        width={60}
        height={60}
        className="rounded-full border-2 border-white bg-white"
        onError={() => {
          // Try the larger size as a fallback (occasionally helps),
          // and if that ever fails in practice you can point to a local placeholder.
          setSrc(getHeadshotUrl(player.photo, '250x250'));
        }}
        unoptimized
      />
      <span className="text-xs mt-1">{player.web_name}</span>
      {pick.is_captain && <span className="text-yellow-400 font-bold">C</span>}
      {pick.is_vice_captain && <span className="text-gray-300 text-xs">VC</span>}
    </div>
  );
}




  return (
    <div id="profile" className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Manager Profile</h2>
      <p className="mb-4">See a manager&#39;s profile & past performance.</p>
      <div className="mb-6">
        <Select
          onValueChange={(val) => {
            const manager = managers.find((m) => String(m.entry) === val);
            setSelectedManager(manager || null);
            setSeasonHistory([]);
            setManagerProfile(null);
          }}
          disabled={loadingManagers}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingManagers ? "Loading managers..." : "Select a manager"} />
          </SelectTrigger>
          {/* <ScrollArea > */}
<SelectContent className="max-h-60">
  {managers.map((manager) => (
    <SelectItem key={manager.entry} value={String(manager.entry)}>
      {manager.entry_name} {manager.player_name ? `(${manager.player_name})` : ""}
    </SelectItem>
  ))}
</SelectContent>
          {/* </ScrollArea> */}
        </Select>
      </div>

      {selectedManager && (
        <>


          <div>
          <Card className="mt-6">
        <CardHeader>
          <CardTitle>{selectedManager.player_name}&apos;s Profile</CardTitle>
          <CardDescription>{selectedManager.entry_name}</CardDescription>
        </CardHeader>
        <CardContent>
{loadingProfile ? (
  <div>Loading profile...</div>
) : !managerProfile ? (
  <div>No profile found.</div>
) : (

  <div key={managerProfile.id}>

Favourite Team: {teams[managerProfile.favourite_team] ? (
    <>
      <Image
        src={teams[managerProfile.favourite_team].badge}
        alt={teams[managerProfile.favourite_team].name}
        width={36}
        height={36}
        className="rounded-full object-contain"
      />
      <span>{teams[managerProfile.favourite_team].name}</span>
    </>
  ) : (
    "Unknown"
  )}
<br />
Region: {managerProfile.player_region_name}
<br />
Joined: {new Date(managerProfile.joined_time).toLocaleDateString()}
<br />
Season&apos;s Points: {managerProfile.summary_overall_points}
     <br />
Season&apos;s Rank: {managerProfile.summary_overall_rank}
  </div>

)}
        </CardContent>
        </Card>
      </div>

{selectedManager && (
  <div className="text-xs text-muted-foreground mb-2">
    {/* XI picks: {latestTeam.filter(p => p.position <= 11).length} ·
    Players loaded: {Object.keys(players).length} */}
  </div>
)}
<div className="mt-6">
  {latestTeam.length > 0 ? (
    Object.keys(players).length === 0 ? (
      <div>Loading players...</div>
    ) : (
      <Formation picks={latestTeam} players={players} />
    )
  ) : (
    managerProfile && <div>No picks available for this gameweek.</div>
  )}
</div>


                  <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">
            {selectedManager.entry_name}&#39;s Season History
          </h3>
          {loadingHistory ? (
            <div>Loading history...</div>
          ) : seasonHistory.length === 0 ? (
            <div>No history found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Season</TableHead>
                  <TableHead>Total Points</TableHead>
                  <TableHead>Overall Rank</TableHead>
                  {/* <TableHead>Points on Bench</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {seasonHistory.map((season) => (
                  <TableRow key={season.season_name}>
                    <TableCell>{season.season_name}</TableCell>
                    <TableCell>{season.total_points}</TableCell>
                    <TableCell>{season.rank}</TableCell>
                    {/* <TableCell>{season.points_on_bench}</TableCell> */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
       </>
      )}
    </div>
  );
}