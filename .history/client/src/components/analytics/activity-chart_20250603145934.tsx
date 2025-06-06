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

interface ActivityChartProps {
  data: {
    month: string;
    communications: number;
    tasks: number;
    meetings: number;
  }[];
  isLoading: boolean;
}

export default function ActivityChart({ data, isLoading }: ActivityChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Atividades e Comunicações</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">Carregando Informações...</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data with shortened month names
  const chartData = data.map(item => ({
    ...item,
    month: item.month.substring(0, 3) // Abbreviate month names
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Atividades e Comunicações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [value, '']} 
              />
              <Legend />
              <Bar
                dataKey="communications"
                name="Communications"
                fill="#8884d8"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="tasks"
                name="Tasks"
                fill="#82ca9d"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="meetings"
                name="Meetings"
                fill="#ffc658"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}