// import { useEffect, useState } from "react";
// import { Progress } from "@/components/ui/progress"

// import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   ChartContainer,
//   ChartTooltip,
//   ChartTooltipContent,
// } from "@/components/ui/chart";

// interface ManagerData {
//   gameweek: number;
//   [manager: string]: number | undefined; // manager name to rank
// }

// export function LineChartComponent() {
//   const [chartData, setChartData] = useState<ManagerData[]>([]);
//   const [chartConfig, setChartConfig] = useState<Record<string, { label: string; color: string }>>(
//     {}
//   );

//   useEffect(() => {
//     async function fetchHistoricData() {
//       try {
//         const response = await fetch("/api/chart-standings");
//         if (!response.ok) throw new Error("Failed to fetch historic data");
//         const data = await response.json();

//         // Get unique manager names
//         const managers: string[] = Array.from(
//           new Set(data.map((item: { entry_name: string }) => item.entry_name))
//         );

//         // Define the type for the items in the data array
//         interface ChartStanding {
//           gameweek: number;
//           entry_name: string;
//           rank: number | null;
//         }

//         // Transform data: [{gameweek, Alice: 1, Bob: 2, ...}, ...]
//         const transformedData = Array.from({ length: 38 }, (_, i) => {
//           const gw = i + 1;
//           const gwData = data.filter((item: ChartStanding) => item.gameweek === gw);
//           const obj: ManagerData = { gameweek: gw };
//           gwData.forEach((item: ChartStanding) => {
//             obj[item.entry_name] = item.rank !== null ? item.rank : undefined;
//           });
//           return obj;
//         });

//         // Chart config for colors/labels
//         const config = managers.reduce<Record<string, { label: string; color: string }>>(
//           (acc, manager, index) => {
//             acc[manager] = {
//               label: manager,
//               color: `hsl(${index * 40}, 70%, 50%)`,
//             };
//             return acc;
//           },
//           {}
//         );

//         setChartData(transformedData);
//         setChartConfig(config);
//       } catch (error) {
//         console.error("Error fetching historic data:", error);
//       }
//     }

//     fetchHistoricData();
//   }, []);

//   return (
//     <Card className="w-full max-w-6xl h-[600px]">
//       <CardHeader>
//         <CardTitle>Historic League Standings</CardTitle>
//         <CardDescription>Gameweek 1 - 38</CardDescription>
//       </CardHeader>
//       <CardContent>
//         <ChartContainer config={chartConfig}>
//           <LineChart
//             accessibilityLayer
//             data={chartData}
//             margin={{
//               left: 12,
//               right: 12,
//             }}
//           >
//             <CartesianGrid vertical={false} />
//             <XAxis
//               dataKey="gameweek"
//               tickLine={false}
//               axisLine={false}
//               tickMargin={8}
//               label={{ value: "Gameweek", position: "insideBottom", offset: -5 }}
//             />
//             <YAxis
//               reversed
//               tickLine={false}
//               axisLine={false}
//               tickMargin={8}
//               label={{ value: "Rank", angle: -90, position: "insideLeft" }}
//             />
//             <ChartTooltip cursor={false} content={<ChartTooltipContent 
//             labelFormatter={(_, payload) => {
//         // payload[0]?.payload?.gameweek is the hovered gameweek
//         const gw = payload?.[0]?.payload?.gameweek;
//         return gw ? `Gameweek ${gw}` : "";
//       }}
//             />} />
//             {Object.keys(chartConfig).map((key) => (
//               <Line
//                 key={key}
//                 dataKey={key}
//                 type="monotone"
//                 stroke={chartConfig[key].color}
//                 strokeWidth={2}
//                 dot={false}
//               />
//             ))}
//           </LineChart>
//         </ChartContainer>
//       </CardContent>
//       <CardFooter>
//         <div className="flex w-full items-start gap-2 text-sm">
//           <div className="grid gap-2">
//             <div className="flex items-center gap-2 font-medium leading-none">
//               Showing league standings for all managers
//             </div>
//             <div className="flex items-center gap-2 leading-none text-muted-foreground">
//               Data is displayed for gameweeks 1 to 38
//             </div>
//           </div>
//         </div>
//       </CardFooter>
//     </Card>
//   );
// }

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ManagerData {
  gameweek: number;
  [manager: string]: number | undefined; // manager name to rank
}

export function LineChartComponent() {
  const [chartData, setChartData] = useState<ManagerData[]>([]);
  const [chartConfig, setChartConfig] = useState<Record<string, { label: string; color: string }>>({});
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    async function fetchHistoricData() {
      try {
        setLoading(true);
        setProgress(0);
        const response = await fetch("/api/chart-standings");
        if (!response.ok) throw new Error("Failed to fetch historic data");
        const data = await response.json();

        // Get unique manager names
        const managers: string[] = Array.from(
          new Set(data.map((item: { entry_name: string }) => item.entry_name))
        );

        // Define the type for the items in the data array
        interface ChartStanding {
          gameweek: number;
          entry_name: string;
          rank: number | null;
        }

        // Transform data: [{gameweek, Alice: 1, Bob: 2, ...}, ...]
        const totalGameweeks = 38;
        const transformedData: ManagerData[] = [];
        for (let i = 0; i < totalGameweeks; i++) {
          const gw = i + 1;
          const gwData = data.filter((item: ChartStanding) => item.gameweek === gw);
          const obj: ManagerData = { gameweek: gw };
          gwData.forEach((item: ChartStanding) => {
            obj[item.entry_name] = item.rank !== null ? item.rank : undefined;
          });
          transformedData.push(obj);
          setProgress(Math.round(((i + 1) / totalGameweeks) * 100));
        }

        // Chart config for colors/labels
        const config = managers.reduce<Record<string, { label: string; color: string }>>(
          (acc, manager, index) => {
            acc[manager] = {
              label: manager,
              color: `hsl(${index * 40}, 70%, 50%)`,
            };
            return acc;
          },
          {}
        );

        setChartData(transformedData);
        setChartConfig(config);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching historic data:", error);
        setLoading(false);
      }
    }

    fetchHistoricData();
  }, []);

  return (
    <Card id="line-chart" className="w-full max-w-6xl h-[600px]">
      {loading && (
        <div className="w-full px-8 pt-8">
          <Progress value={progress} />
          <div className="text-xs text-muted-foreground mt-2">Loading chart data...</div>
        </div>
      )}
      {!loading && (
        <>
          <CardHeader>
            <CardTitle>Historic League Standings</CardTitle>
            <CardDescription>Gameweek 1 - 38</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <LineChart
                accessibilityLayer
                data={chartData}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="gameweek"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  label={{ value: "Gameweek", position: "insideBottom", offset: -5 }}
                />
                <YAxis
                  reversed
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  label={{ value: "Rank", angle: -90, position: "insideLeft" }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) => {
                        const gw = payload?.[0]?.payload?.gameweek;
                        return gw ? `Gameweek ${gw}` : "";
                      }}
                    />
                  }
                />
                {Object.keys(chartConfig).map((key) => (
                  <Line
                    key={key}
                    dataKey={key}
                    type="monotone"
                    stroke={chartConfig[key].color}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ChartContainer>
          </CardContent>
          <CardFooter>
            <div className="flex w-full items-start gap-2 text-sm">
              <div className="grid gap-2">
                <div className="flex items-center gap-2 font-medium leading-none">
                  Showing league standings for all managers
                </div>
                <div className="flex items-center gap-2 leading-none text-muted-foreground">
                  Data is displayed for gameweeks 1 to 38
                </div>
              </div>
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  );
}