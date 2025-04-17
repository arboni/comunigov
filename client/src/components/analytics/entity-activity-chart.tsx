import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface EntityActivityChartProps {
  data: {
    entityName: string;
    meetings: number;
    tasks: number;
    communications: number;
  }[];
  isLoading: boolean;
}

export default function EntityActivityChart({ data, isLoading }: EntityActivityChartProps) {
  const chartData = useMemo(() => {
    return data.slice(0, 10); // Limit to top 10 entities for better visualization
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Entity Activity</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">Loading data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Entity Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 100, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="entityName" type="category" />
              <Tooltip />
              <Bar dataKey="meetings" name="Meetings" fill="#3b82f6" stackId="a" />
              <Bar dataKey="tasks" name="Tasks" fill="#10b981" stackId="a" />
              <Bar dataKey="communications" name="Messages" fill="#8b5cf6" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}