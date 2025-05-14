// "use client";

// import { useEffect, useState } from "react";
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
//   ChartConfig,
//   ChartContainer,
//   ChartTooltip,
//   ChartTooltipContent,
// } from "@/components/ui/chart";

// interface ManagerData {
//   gameweek: number;
//   [manager: string]: number; // Dynamic keys for each manager's rank
// }

// export function LineChartComponent() {
//   const [chartData, setChartData] = useState<ManagerData[]>([]);
//   const [chartConfig, setChartConfig] = useState<Record<string, { label: string; color: string }>>(
//     {}
//   );

// useEffect(() => {
//   async function fetchHistoricData() {
//     try {
//       const response = await fetch("/api/chart-standings");
//       if (!response.ok) {
//         throw new Error("Failed to fetch historic data");
//       }

//       const data = await response.json();

//       // Transform the data into the format required for the chart
//       const managers: string[] = Array.from(new Set(data.map((item: { entry_name: string }) => item.entry_name))); // Unique manager names
//       const transformedData = Array.from({ length: 38 }, (_, i) => ({
//         gameweek: i + 1,
//         ...data
//           .filter((item: { gameweek: number; entry_name: string; rank: number }) => item.gameweek === i + 1)
//           .reduce((acc: Record<string, number>, item: { entry_name: string; rank: number }) => {
//             acc[item.entry_name] = item.rank; // Use rank for each manager
//             return acc;
//           }, {}),
//       }));

//       // Generate chart configuration dynamically based on managers
//       const config = managers.reduce<Record<string, { label: string; color: string }>>((acc, manager, index) => {
//         acc[manager] = {
//           label: manager,
//           color: `hsl(${index * 40}, 70%, 50%)`, // Generate unique colors for each manager
//         };
//         return acc;
//       }, {});

//       setChartData(transformedData);
//       setChartConfig(config);
//     } catch (error) {
//       console.error("Error fetching historic data:", error);
//     }
//   }

//   fetchHistoricData();
// }, []);
//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>Historic League Standings</CardTitle>
//         <CardDescription>Gameweek 1 - 38</CardDescription>
//       </CardHeader>
//       <CardContent>
//         <ChartContainer config={chartConfig}>
// <LineChart
//   accessibilityLayer
//   data={chartData}
//   margin={{
//     left: 12,
//     right: 12,
//   }}
// >
//   <CartesianGrid vertical={false} />
//   <XAxis
//     dataKey="gameweek"
//     tickLine={false}
//     axisLine={false}
//     tickMargin={8}
//     label={{ value: "Gameweek", position: "insideBottom", offset: -5 }}
//   />
//   <YAxis
//     reversed // Reverse the Y-axis to show rank (1 at the top)
//     tickLine={false}
//     axisLine={false}
//     tickMargin={8}
//     label={{ value: "Rank", angle: -90, position: "insideLeft" }}
//   />
//   <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
//   {Object.keys(chartConfig).map((key) => (
//     <Line
//       key={key}
//       dataKey={key}
//       type="monotone"
//       stroke={chartConfig[key].color}
//       strokeWidth={2}
//       dot={false}
//     />
//   ))}
// </LineChart>
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

"use client";

import { useEffect, useState } from "react";
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
  // ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ManagerData {
  gameweek: number;
  [manager: string]: number; // Dynamic keys for each manager's rank
}

export function LineChartComponent() {
  const [chartData, setChartData] = useState<ManagerData[]>([]);
  const [chartConfig, setChartConfig] = useState<Record<string, { label: string; color: string }>>(
    {}
  );

  useEffect(() => {
    async function fetchHistoricData() {
      try {
        const response = await fetch("/api/chart-standings");
        if (!response.ok) {
          throw new Error("Failed to fetch historic data");
        }

        const data = await response.json();

        // Transform the data into the format required for the chart
        const managers: string[] = Array.from(
          new Set(data.map((item: { entry_name: string }) => item.entry_name))
        ); // Unique manager names
        const transformedData = Array.from({ length: 38 }, (_, i) => ({
        gameweek: i + 1,
        ...data
            .filter((item: { gameweek: number }) => item.gameweek === i + 1)
            .reduce((acc: Record<string, number | null>, item: { entry_name: string; rank: number | null }) => {
            acc[item.entry_name] = item.rank; // Use rank or null
            return acc;
            }, {}),
        }));

        // Generate chart configuration dynamically based on managers
        const config = managers.reduce<Record<string, { label: string; color: string }>>(
          (acc, manager, index) => {
            acc[manager] = {
              label: manager,
              color: `hsl(${index * 40}, 70%, 50%)`, // Generate unique colors for each manager
            };
            return acc;
          },
          {}
        );

        setChartData(transformedData);
        setChartConfig(config);
      } catch (error) {
        console.error("Error fetching historic data:", error);
      }
    }

    fetchHistoricData();
  }, []);

  return (
    <Card className="w-full max-w-6xl h-[600px]">
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
              reversed // Reverse the Y-axis to show rank (1 at the top)
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              label={{ value: "Rank", angle: -90, position: "insideLeft" }}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
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
    </Card>
  );
}