// 'use client';

// import { useEffect, useState } from "react";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
// import { Button } from "@/components/ui/button";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"


// export default function Home() {
//   interface Team {
//     entry: number;
//     rank: number;
//     entry_name: string;
//     player_name: string;
//     total: number;
//   }

//   const [standings, setStandings] = useState<Team[]>([]);
//   const [loading, setLoading] = useState(false);

//   const fetchStandings = async () => {
//     setLoading(true);
//     try {
//       const response = await fetch("/api/standings");
//       if (!response.ok) {
//         throw new Error("Failed to fetch standings");
//       }
//       const data = await response.json();
//       setStandings(data);
//     } catch (error) {
//       console.error("Error fetching league standings:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchStandings();
//   }, []);

//   return (
//     <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
//       <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
//         <h1 className="text-2xl font-bold">FPL League Standings</h1>
//         <Button variant="outline" onClick={fetchStandings} disabled={loading}>
//           {loading ? "Refreshing..." : "Refresh Standings"}
//         </Button>
//         <Select>
//         <SelectTrigger className="w-[180px]">
//           <SelectValue placeholder="Theme" />
//         </SelectTrigger>
//         <SelectContent>
//           <SelectItem value="light">Light</SelectItem>
//           <SelectItem value="dark">Dark</SelectItem>
//           <SelectItem value="system">System</SelectItem>
//         </SelectContent>
//       </Select>

//         <Table className="w-full max-w-4xl">
//           <TableHeader>
//             <TableRow>
//               <TableHead>Rank</TableHead>
//               <TableHead>Team Name</TableHead>
//               <TableHead>Manager</TableHead>
//               <TableHead>Points</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {standings.map((team) => (
//               <TableRow key={team.entry}>
//                 <TableCell>{team.rank}</TableCell>
//                 <TableCell>{team.entry_name}</TableCell>
//                 <TableCell>{team.player_name}</TableCell>
//                 <TableCell>{team.total}</TableCell>
//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>
//       </main>
//     </div>
//   );
// }

'use client';

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LineChartComponent } from "@/components/line-chart";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Profile from "@/components/profile";
import HereWeGo from "@/components/herewego";
// import { ScrollArea } from "@/components/ui/scroll-area";
import { NavigationMenuDemo } from "@/components/nav-bar";
import Footer from "@/components/footer";
import BackToTopButton from "@/components/backtotop";


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

  const [standings, setStandings] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGameweek, setSelectedGameweek] = useState(1); // Default to gameweek 1

  const fetchStandings = async (gameweek: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/standings?gameweek=${gameweek}`);
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
    fetchStandings(selectedGameweek);
  }, [selectedGameweek]);

  return (
    <>
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen pb-20 sm:px-5 px-2.5 gap-16 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div>
          <NavigationMenuDemo />
          <Separator className="my-4" />
        </div>
        <h1 className="text-2xl font-bold">S.a.G FPL League Standings</h1>
        <div className="flex gap-4 items-center">
          <Button variant="outline" onClick={() => fetchStandings(selectedGameweek)} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh Standings"}
          </Button>

<Select onValueChange={(value) => setSelectedGameweek(Number(value))}>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder={`Gameweek ${selectedGameweek}`} />
  </SelectTrigger>
  {/* Wrap SelectContent with ScrollArea */}
{/* <ScrollArea className="max-h-60"> */}
  <SelectContent className="max-h-60 overflow-y-auto">
    {Array.from({ length: 38 }, (_, i) => (
      <SelectItem key={i + 1} value={(i + 1).toString()}>
        Gameweek {i + 1}
      </SelectItem>
    ))}
  </SelectContent>
{/* </ScrollArea> */}
</Select>
        </div>
        <Table className="w-full max-w-4xl">
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="hidden sm:table-cell">Manager</TableHead>
              <TableHead>Total Pts</TableHead>
              <TableHead>GW Pts</TableHead> {/* New column */}
              <TableHead>Overall Rank</TableHead> {/* New column */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {standings.map((team) => (
              <TableRow key={team.entry}>
                <TableCell>{team.rank}</TableCell>
                <TableCell>{team.entry_name}</TableCell>
                <TableCell className="hidden sm:table-cell">{team.player_name}</TableCell>
                <TableCell>{team.total}</TableCell>
                <TableCell>{team.gameweek_points}</TableCell> {/* New data */}
                <TableCell>{team.overall_rank}</TableCell> {/* New data */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
            <Separator className="my-4" />
            <Alert>
  {/* <Terminal className="h-4 w-4" /> */}
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>
    Historic League Chart takes long to load, give it some time. 
  </AlertDescription>
</Alert>
          
        <LineChartComponent />
        <Separator className="my-4" />
        <HereWeGo />
        <Separator className="my-4" />
        <Profile />
        
  
      </main>
    </div>
    <Footer />
    <BackToTopButton />
    </>
  );
}