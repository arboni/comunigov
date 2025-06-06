import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import ActivityChart from "@/components/analytics/activity-chart";
import ChannelDistributionChart from "@/components/analytics/channel-distribution-chart";
import EntityActivityChart from "@/components/analytics/entity-activity-chart";
import TaskStatusChart from "@/components/analytics/task-status-chart";
import CompletionRateChart from "@/components/analytics/completion-rate-chart";
import PerformanceMetricsCard from "@/components/analytics/performance-metrics-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DownloadIcon, RefreshCw } from "lucide-react";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("6months");
  
  // Fetch analytics data
  const { 
    data: analyticsData, 
    isLoading: isLoadingAnalytics,
    refetch: refetchAnalytics
  } = useQuery({
    queryKey: ["/api/analytics", timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/analytics?timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error("Failed to fetch analytics data");
      }
      return response.json();
    }
  });

  // Fetch entity analytics
  const { 
    data: entityAnalytics, 
    isLoading: isLoadingEntityAnalytics 
  } = useQuery({
    queryKey: ["/api/analytics/entities", timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/entities?timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error("Failed to fetch entity analytics");
      }
      return response.json();
    }
  });

  // Handle time range change
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
  };

  // Handle data refresh
  const handleRefresh = () => {
    refetchAnalytics();
  };

  // Handle export to CSV
  const handleExport = () => {
    window.open(`/api/analytics/export?timeRange=${timeRange}`, '_blank');
  };

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-800">Análise de Dados</h1>
              <p className="mt-1 text-sm text-neutral-500">
                Aqui você pode visualizar métricas de desempenho, tendências de atividade e insights sobre tarefas e comunicações
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30days">Últimos 30 dias</SelectItem>
                  <SelectItem value="3months">últimos 3 meses</SelectItem>
                  <SelectItem value="6months">últimos 6 meses</SelectItem>
                  <SelectItem value="12months">últimos 12 meses</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                title="Refresh data"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                title="Export data as CSV"
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="mb-6">
            <PerformanceMetricsCard
              metrics={analyticsData?.performanceMetrics || {
                avgTaskCompletionDays: 0,
                avgMeetingAttendance: 0,
                communicationsPerMonth: 0,
                tasksPerMonth: 0,
                meetingsPerMonth: 0,
              }}
              isLoading={isLoadingAnalytics}
            />
          </div>

          {/* Analytics Tabs */}
          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="activity">Atividade</TabsTrigger>
              <TabsTrigger value="tasks">Tarefas</TabsTrigger>
              <TabsTrigger value="communications">Communicações</TabsTrigger>
              <TabsTrigger value="entities">Entidades</TabsTrigger>
            </TabsList>
            
            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ActivityChart
                  data={analyticsData?.activityTrends || []}
                  isLoading={isLoadingAnalytics}
                />
                
                <CompletionRateChart
                  data={analyticsData?.completionRates || []}
                  isLoading={isLoadingAnalytics}
                />
              </div>
            </TabsContent>
            
            {/* Tasks Tab */}
            <TabsContent value="tasks" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TaskStatusChart
                  data={analyticsData?.taskStatusDistribution || []}
                  isLoading={isLoadingAnalytics}
                />
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tarefas Criadas</CardTitle>
                    <CardDescription>Métrica de Execução de Tarefas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-neutral-100 p-4 rounded-md">
                          <p className="text-sm text-neutral-500">Total Active Tasks</p>
                          <p className="text-2xl font-semibold">{analyticsData?.taskInsights?.totalActive || 0}</p>
                        </div>
                        <div className="bg-neutral-100 p-4 rounded-md">
                          <p className="text-sm text-neutral-500">Completed Last Month</p>
                          <p className="text-2xl font-semibold">{analyticsData?.taskInsights?.completedLastMonth || 0}</p>
                        </div>
                        <div className="bg-neutral-100 p-4 rounded-md">
                          <p className="text-sm text-neutral-500">Overdue Tasks</p>
                          <p className="text-2xl font-semibold text-red-500">{analyticsData?.taskInsights?.overdue || 0}</p>
                        </div>
                        <div className="bg-neutral-100 p-4 rounded-md">
                          <p className="text-sm text-neutral-500">Avg. Completion Time</p>
                          <p className="text-2xl font-semibold">{analyticsData?.taskInsights?.avgCompletionDays?.toFixed(1) || 0} days</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Communications Tab */}
            <TabsContent value="communications" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ChannelDistributionChart
                  data={analyticsData?.channelDistribution || []}
                  isLoading={isLoadingAnalytics}
                />
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Communication Insights</CardTitle>
                    <CardDescription>Key metrics and trends for communications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-neutral-100 p-4 rounded-md">
                          <p className="text-sm text-neutral-500">Total Messages</p>
                          <p className="text-2xl font-semibold">{analyticsData?.communicationInsights?.total || 0}</p>
                        </div>
                        <div className="bg-neutral-100 p-4 rounded-md">
                          <p className="text-sm text-neutral-500">Total Recipients</p>
                          <p className="text-2xl font-semibold">{analyticsData?.communicationInsights?.totalRecipients || 0}</p>
                        </div>
                        <div className="bg-neutral-100 p-4 rounded-md">
                          <p className="text-sm text-neutral-500">Messages This Month</p>
                          <p className="text-2xl font-semibold">{analyticsData?.communicationInsights?.thisMonth || 0}</p>
                        </div>
                        <div className="bg-neutral-100 p-4 rounded-md">
                          <p className="text-sm text-neutral-500">Avg. Read Rate</p>
                          <p className="text-2xl font-semibold">{analyticsData?.communicationInsights?.readRate ? 
                            `${(analyticsData.communicationInsights.readRate * 100).toFixed(0)}%` : '0%'}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Entities Tab */}
            <TabsContent value="entities" className="space-y-6">
              <EntityActivityChart
                data={entityAnalytics?.entityActivity || []}
                isLoading={isLoadingEntityAnalytics}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Entity Engagement</CardTitle>
                  <CardDescription>Most active and engaged entities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-2">Most Active Entities</h3>
                      <div className="space-y-2">
                        {isLoadingEntityAnalytics ? (
                          <p className="text-sm text-neutral-400">Loading data...</p>
                        ) : (entityAnalytics?.mostActive || []).length > 0 ? (
                          entityAnalytics?.mostActive?.map((entity, index) => (
                            <div key={index} className="flex items-center justify-between bg-neutral-50 p-2 rounded-md">
                              <span className="text-sm font-medium">{entity.name}</span>
                              <span className="text-sm bg-primary-100 text-primary px-2 py-1 rounded-full">
                                {entity.activityCount} activities
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-neutral-400">No data available</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-2">Entities by Communication Rate</h3>
                      <div className="space-y-2">
                        {isLoadingEntityAnalytics ? (
                          <p className="text-sm text-neutral-400">Loading data...</p>
                        ) : (entityAnalytics?.byCommunication || []).length > 0 ? (
                          entityAnalytics?.byCommunication?.map((entity, index) => (
                            <div key={index} className="flex items-center justify-between bg-neutral-50 p-2 rounded-md">
                              <span className="text-sm font-medium">{entity.name}</span>
                              <span className="text-sm bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                                {entity.communicationCount} messages
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-neutral-400">No data available</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}