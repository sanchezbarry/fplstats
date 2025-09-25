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

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import { IconArrowBigLeftFilled , IconArrowBigRightFilled } from "@tabler/icons-react";

interface Transfer {
  entry: number;
  entry_name: string;
  player_in: number;
  player_out: number;
  time: string;
  event: number;
  cost: number;
}

interface HereWeGoProps {
  leagueId: string;
}

export default function HereWeGo({ leagueId }: HereWeGoProps) {
  const [gameweek, setGameweek] = useState<number | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [playerMap, setPlayerMap] = useState<Record<string, string>>({});

  // Fetch player names and latest gameweek on mount
useEffect(() => {
  async function fetchPlayersAndGW() {
    // Fetch player data and events from your own API route
    const res = await fetch("/api/bootstrap-static");
    const data = await res.json();

    // Build player ID -> name map
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
    const latest = (data.events as Event[] || [])
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
    fetch(`/api/transfers?league_id=${leagueId}&gameweek=${gameweek}`)
      .then((res) => res.json())
      .then((data) => {
        setTransfers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [gameweek,leagueId]);

  const transfersByManager: Record<string, Transfer[]> = {};
transfers.forEach((t) => {
  if (!transfersByManager[t.entry_name]) {
    transfersByManager[t.entry_name] = [];
  }
  transfersByManager[t.entry_name].push(t);
});

  return (
  <div id="herewego" className="max-w-2xl mx-auto p-4">
    <h2 className="text-xl font-bold mb-2">Here we go!</h2>
    <p className="mb-4">Note: You can only see transfers of a gameweek after the gameweek has passed.</p>
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
      <Accordion type="multiple" className="w-full">
        {Object.entries(transfersByManager).length === 0 ? (
          <div className="text-center py-4">No transfers for this gameweek.</div>
        ) : (
          Object.entries(transfersByManager).map(([manager, managerTransfers]) => (
            <AccordionItem key={manager} value={manager}>
              <AccordionTrigger>
                      {manager} <span className="ml-2 text-xs text-gray-400">({managerTransfers.length} transfer{managerTransfers.length !== 1 ? "s" : ""})</span>
              </AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader className="">
                    <TableRow className="">
                      <TableCell className="">
                        <TableHead className="flex items-center">Player In &nbsp;<IconArrowBigLeftFilled color="green" /></TableHead>
                      </TableCell>

                      <TableCell>
                        <TableHead className="flex items-center">Player Out &nbsp;<IconArrowBigRightFilled color="red" /></TableHead>
                      </TableCell>
                      {/* <TableHead>Time</TableHead> */}
                      {/* <TableHead>Cost</TableHead> */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {managerTransfers.map((t, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{playerMap[String(t.player_in)] || t.player_in}</TableCell>
                        <TableCell>{playerMap[String(t.player_out)] || t.player_out}</TableCell>
                        {/* <TableCell>{new Date(t.time).toLocaleString()}</TableCell> */}
                        {/* <TableCell>{t.cost ? t.cost / 10 : 0}</TableCell> */}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          ))
        )}
      </Accordion>
    )}
  </div>
)}