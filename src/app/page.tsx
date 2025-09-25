'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import LineChartComponent from "@/components/line-chart";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Profile from "@/components/profile";
import HereWeGo from "@/components/herewego";
// import { ScrollArea } from "@/components/ui/scroll-area";
import { NavigationMenuDemo } from "@/components/nav-bar";
import LeagueTable from "@/components/league-table";
import BackToTopButton from "@/components/backtotop";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function Home() {
  interface Team {
    entry: number;
    rank: number;
    entry_name: string;
    player_name: string;
    total: number;
    gameweek_points: number; // New field for points scored in the selected gameweek
    overall_rank: number; // Added property for overall rank
  }

  const [leagueId, setLeagueId] = useState("867909");
  const [selectedGameweek, setSelectedGameweek] = useState("1"); // Use string for Select
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [standings, setStandings] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("league_id", leagueId);
    }
  }, [leagueId]);

  useEffect(() => {
    async function fetchLatestGameweek() {
      const res = await fetch("/api/bootstrap-static");
      const data = await res.json();
      type Event = {
        id: number;
        finished: boolean;
        is_current: boolean;
      };
      const latest = (data.events as Event[] || [])
        .filter((e: Event) => e.finished || e.is_current)
        .sort((a: Event, b: Event) => b.id - a.id)[0];
      if (latest) setSelectedGameweek(latest.id.toString());
    }
    fetchLatestGameweek();
  }, []);

  const fetchStandings = async (gameweek: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/standings?gameweek=${gameweek}&league_id=${leagueId}`);
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/standings?gameweek=${selectedGameweek}&league_id=${leagueId}`);
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
    <>
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen pb-20 sm:px-5 px-2.5 gap-16 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
          <div>
            <NavigationMenuDemo />
            <Separator className="my-4" />
          </div>
          <h1 className="text-2xl font-bold">S.a.G FPL League Standings</h1>
          <p className="mb-4">Want to take a look at another league? Enter league ID here.</p>
          <div className="mb-4 flex gap-2 items-center">
            <Input
              className="w-[200px]"
              placeholder="Enter League ID"
              value={leagueId}
              onChange={e => setLeagueId(e.target.value)}
            />
            <Button variant="outline" onClick={() => fetchStandings(selectedGameweek)} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh Standings"}
            </Button>

                        <Select value={selectedGameweek} onValueChange={setSelectedGameweek}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={`Gameweek ${selectedGameweek}`} />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {Array.from({ length: 38 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    Gameweek {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <LeagueTable
            leagueId={leagueId}
            setLeagueId={setLeagueId}
            selectedGameweek={selectedGameweek}
            setSelectedGameweek={setSelectedGameweek}
          />
          <Separator className="my-4" />
          <Alert>
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>
              Historic League Chart takes long to load, give it some time.
            </AlertDescription>
          </Alert>
          <LineChartComponent leagueId={leagueId} />
          <Separator className="my-4" />
          <HereWeGo leagueId={leagueId} />
          <Separator className="my-4" />
          <Profile leagueId={leagueId} />
        </main>
      </div>
      <BackToTopButton />
    </>
  );
}
