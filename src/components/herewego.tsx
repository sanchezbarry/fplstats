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

interface Transfer {
  entry: number;
  entry_name: string;
  player_in: number;
  player_out: number;
  time: string;
  event: number;
  cost: number;
}

export default function HereWeGo() {
  const [gameweek, setGameweek] = useState<number | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [playerMap, setPlayerMap] = useState<Record<string, string>>({});

  // Fetch player names and latest gameweek on mount
  useEffect(() => {
    async function fetchPlayersAndGW() {
      const res = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/");
      const data = await res.json();
      // Build player ID -> name map (string keys)
      const map: Record<string, string> = {};
      type Player = {
        id: number;
        first_name: string;
        second_name: string;
      };
      (data.elements as Player[]).forEach((p) => {
        map[String(p.id)] = `${p.first_name} ${p.second_name}`;
      });
      setPlayerMap(map);

      // Find latest finished or current gameweek
      type Event = {
        id: number;
        finished: boolean;
        is_current: boolean;
      };
      const latest = (data.events as Event[])
        .filter((e: Event) => e.finished || e.is_current)
        .sort((a: Event, b: Event) => b.id - a.id)[0];
      setGameweek(latest ? latest.id : 1);
    }
    fetchPlayersAndGW();
  }, []);

  // Fetch transfers when gameweek changes
  useEffect(() => {
    if (!gameweek) return;
    setLoading(true);
    fetch(`/api/transfers?gameweek=${gameweek}`)
      .then((res) => res.json())
      .then((data) => {
        setTransfers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [gameweek]);

  return (
    <div id="herewego" className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Here we go!</h2>
      <div className="mb-4">
        <Select value={gameweek ? String(gameweek) : ""} onValueChange={val => setGameweek(Number(val))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={gameweek ? `Gameweek ${gameweek}` : "Select Gameweek"} />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            {Array.from({ length: 38 }, (_, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>
                Gameweek {i + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {loading ? (
        <div>Loading transfers...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Manager</TableHead>
              <TableHead>Player In</TableHead>
              <TableHead>Player Out</TableHead>
              {/* <TableHead>Time</TableHead> */}
              {/* <TableHead>Cost</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No transfers for this gameweek.
                </TableCell>
              </TableRow>
            ) : (
              transfers.map((t, idx) => (
                <TableRow key={idx}>
                  <TableCell>{t.entry_name}</TableCell>
<TableCell>{playerMap[String(t.player_in)] || t.player_in}</TableCell>
<TableCell>{playerMap[String(t.player_out)] || t.player_out}</TableCell>
                  {/* <TableCell>{new Date(t.time).toLocaleString()}</TableCell> */}
{/* <TableCell>{t.cost ? t.cost / 10 : 0}</TableCell> */}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}