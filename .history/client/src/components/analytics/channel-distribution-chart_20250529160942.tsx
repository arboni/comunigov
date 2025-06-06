import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface ChannelDistributionChartProps {
  data: {
    channel: string;
    count: number;
  }[];
  isLoading: boolean;
}

export default function ChannelDistributionChart({ data, isLoading }: ChannelDistributionChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Communication Channels</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">Loading data...</p>
        </CardContent>
      </Card>
    );
  }

  // Filter out zero values
  const chartData = data.filter(item => item.count > 0);
  
  // Colors for different channels
  const COLORS = {
    'Email': '#60a5fa',     // blue-400
    'WhatsApp': '#4ade80',  // green-400
    'Telegram': '#38bdf8',  // sky-400
    'System': '#a78bfa',    // violet-400
  };

  const getColor = (channel: string) => {
    return COLORS[channel as keyof typeof COLORS] || '#6b7280'; // gray-500 as fallback
  };

  // Calculate total count
  const totalCount = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Communication Channels</CardTitle>
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
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="channel"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(entry.channel)} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value} messages (${((value / totalCount) * 100).toFixed(1)}%)`, 'Count']} 
                  labelFormatter={(label) => `Channel: ${label}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center">
            <p className="text-muted-foreground">No channel data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}