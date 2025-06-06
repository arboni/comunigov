import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle2,
  Clock,
  Users,
  MessageSquare,
  Calendar,
  ListTodo
} from "lucide-react";

interface PerformanceMetricsCardProps {
  metrics: {
    avgTaskCompletionDays: number;
    avgMeetingAttendance: number;
    communicationsPerMonth: number;
    tasksPerMonth: number;
    meetingsPerMonth: number;
  };
  isLoading: boolean;
}

export default function PerformanceMetricsCard({ metrics, isLoading }: PerformanceMetricsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Métricas e Performance</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <p className="text-muted-foreground">Loading data...</p>
        </CardContent>
      </Card>
    );
  }

  const { 
    avgTaskCompletionDays, 
    avgMeetingAttendance, 
    communicationsPerMonth,
    tasksPerMonth,
    meetingsPerMonth
  } = metrics;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Métricas e Performances</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-md">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Task Completion</p>
              <p className="text-lg font-medium">{avgTaskCompletionDays.toFixed(1)} days</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-md">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Meeting Attendance</p>
              <p className="text-lg font-medium">{(avgMeetingAttendance * 100).toFixed(0)}%</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 rounded-md">
              <MessageSquare className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Communications/Month</p>
              <p className="text-lg font-medium">{communicationsPerMonth.toFixed(1)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="bg-amber-100 p-2 rounded-md">
              <ListTodo className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tasks/Month</p>
              <p className="text-lg font-medium">{tasksPerMonth.toFixed(1)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-100 p-2 rounded-md">
              <Calendar className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Meetings/Month</p>
              <p className="text-lg font-medium">{meetingsPerMonth.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}