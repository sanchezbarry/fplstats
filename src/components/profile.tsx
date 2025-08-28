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

  // useEffect(() => {
  //   setLoadingManagers(true);
  //   fetch("/api/standings")
  //     .then((res) => res.json())
  //     .then((data) => {
  //       setManagers(data);
  //       setLoadingManagers(false);
  //     })
  //     .catch(() => setLoadingManagers(false));
  // }, []);

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

    // Fetch manager summary when selected
  useEffect(() => {
    if (!selectedManager) return;
    setLoadingHistory(true);
    fetch(`/api/profilesummary?manager_id=${selectedManager.entry}`)
      .then((res) => res.json())
      .then((data) => {
        setManagerProfile(data);   
        setLoadingProfile(false);
        
      })
      .catch(() => setLoadingProfile(false));
      console.log("Fetching profile for manager ID:", selectedManager.entry);
  }, [selectedManager]);

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