import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface HearingStatusChartProps {
  data: {
    status: string;
    count: number;
  }[];
  isLoading: boolean;
}

export default function HearingStatusChart({ data, isLoading }: HearingStatusChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Status de Distribuição de Tarefas</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">Carregando dados...</p>
        </CardContent>
      </Card>
    );
  }

  // Filter out zero values
  const chartData = data.filter(item => item.count > 0);
  
  // Colors for different statuses
  const COLORS = {
    'Pending': '#f59e0b',      // amber-500
    'In Progress': '#3b82f6',  // blue-500
    'Completed': '#10b981',    // emerald-500
    'Cancelled': '#ef4444',    // red-500
  };

  const getColor = (status: string) => {
    return COLORS[status as keyof typeof COLORS] || '#6b7280'; // gray-500 as fallback
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Status de Distribuição de Tarefas</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  innerRadius={40}
                  dataKey="count"
                  nameKey="status"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(entry.status)} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value} Hearings`, 'Count']} 
                  labelFormatter={(label) => `Status: ${label}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center">
            <p className="text-muted-foreground">No Hearing data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}