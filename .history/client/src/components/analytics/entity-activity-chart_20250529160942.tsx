import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface EntityActivityChartProps {
  data: {
    id: number;
    name: string;
    type: string;
    communicationCount: number;
    taskCount: number;
    totalActivity: number;
  }[];
  isLoading: boolean;
}

export default function EntityActivityChart({ data, isLoading }: EntityActivityChartProps) {
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

  // Take top 10 entities by total activity
  const top10Entities = [...data]
    .sort((a, b) => b.totalActivity - a.totalActivity)
    .slice(0, 10)
    .map(entity => ({
      name: entity.name.length > 20 
        ? entity.name.substring(0, 20) + '...' 
        : entity.name,
      communications: entity.communicationCount,
      tasks: entity.taskCount
    }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Top Entity Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {top10Entities.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={top10Entities}
                layout="vertical"
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={150}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="communications" 
                  name="Communications" 
                  fill="#8884d8" 
                  radius={[0, 4, 4, 0]}
                  stackId="a"
                />
                <Bar 
                  dataKey="tasks" 
                  name="Tasks" 
                  fill="#82ca9d" 
                  radius={[0, 4, 4, 0]}
                  stackId="a"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center">
            <p className="text-muted-foreground">No entity activity data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}