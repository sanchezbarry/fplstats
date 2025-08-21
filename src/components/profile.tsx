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

interface ProfileProps {
  leagueId: string;
}
export default function Profile({ leagueId }: ProfileProps) {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [seasonHistory, setSeasonHistory] = useState<SeasonHistory[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

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
  }, [selectedManager]);

  return (
    <div id="profile" className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Manager Profile</h2>
      <p className="mb-4">See a manager&#39;s past performance</p>
      <div className="mb-6">
        <Select
          onValueChange={(val) => {
            const manager = managers.find((m) => String(m.entry) === val);
            setSelectedManager(manager || null);
            setSeasonHistory([]);
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
        <div>
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
      )}
    </div>
  );
}