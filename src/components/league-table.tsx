'use client';


import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

interface LeagueTableProps {
  leagueId: string;
  setLeagueId: (id: string) => void;
  selectedGameweek: string;
  setSelectedGameweek: (gw: string) => void;
}

export default function LeagueTable({
  leagueId,

  selectedGameweek,

}: LeagueTableProps) {

  interface Team {
    entry: number;
    rank: number;
    entry_name: string;
    player_name: string;
    total: number;
    gameweek_points: number;
    overall_rank: number;
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("league_id", leagueId);
    }
  }, [leagueId]);

  const [standings, setStandings] = useState<Team[]>([]);
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/standings?gameweek=${Number(selectedGameweek)}&league_id=${leagueId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch standings");
        }
        const data = await response.json();
        setStandings(data);
      } catch (error) {
        console.error("Error fetching league standings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedGameweek, leagueId]);

  return (
    <Table className="w-full max-w-4xl">
      <TableHeader>
        <TableRow>
          <TableHead>Rank</TableHead>
          <TableHead>Team</TableHead>
          <TableHead className="hidden sm:table-cell">Manager</TableHead>
          <TableHead>Total Pts</TableHead>
          <TableHead>GW Pts</TableHead>
          <TableHead className="hidden sm:table-cell">Overall Rank</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {standings.map((team) => (
          <TableRow key={team.entry}>
            <TableCell>{team.rank}</TableCell>
            <TableCell>{team.entry_name}</TableCell>
            <TableCell className="hidden sm:table-cell">{team.player_name}</TableCell>
            <TableCell>{team.total}</TableCell>
            <TableCell>{team.gameweek_points}</TableCell>
            <TableCell className="hidden sm:table-cell">{team.overall_rank}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}