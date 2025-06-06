import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface CompletionRateChartProps {
  data: {
    month: string;
    completionRate: number;
  }[];
  isLoading: boolean;
}

export default function CompletionRateChart({ data, isLoading }: CompletionRateChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Taxa de Conclusão de Tarefas</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">Loading data...</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    month: item.month.substring(0, 3), // Abbreviate month names
    rate: (item.completionRate * 100).toFixed(1) // Convert to percentage
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Taxa de Conclusão de Tarefas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
            >
              <defs>
                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
              />
              <Tooltip formatter={(value) => [`${value}%`, 'Completion Rate']} />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorRate)"
                name="Completion Rate"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}