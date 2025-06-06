import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import ActivityChart from "@/components/analytics/activity-chart";
import ChannelDistributionChart from "@/components/analytics/channel-distribution-chart";
import EntityActivityChart from "@/components/analytics/entity-activity-chart";
import hearingsStatusChart from "@/components/analytics/hearings-status-chart";
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
                avghearingsCompletionDays: 0,
                avgMeetingAttendance: 0,
                communicationsPerMonth: 0,
                hearingssPerMonth: 0,
                meetingsPerMonth: 0,
              }}
              isLoading={isLoadingAnalytics}
            />
          </div>

          {/* Analytics Tabs */}
          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="activity">Atividade</TabsTrigger>
              <TabsTrigger value="hearingss">Tarefas</TabsTrigger>
              <TabsTrigger value="communications">Communicações</TabsTrigger>
              <TabsTrigger value="entities">Entidades</TabsTrigger>
              <TabsTrigger value="hearings">Audiências Públicas</TabsTrigger>
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
            
            {/* hearingss Tab */}
            <TabsContent value="hearings" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <hearingsStatusChart
                  data={analyticsData?.hearingStatusDistribution || []}
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
                          <p className="text-sm text-neutral-500">Total de Tarefas Ativas</p>
                          <p className="text-2xl font-semibold">{analyticsData?.hearingsInsights?.totalActive || 0}</p>
                        </div>
                        <div className="bg-neutral-100 p-4 rounded-md">
                          <p className="text-sm text-neutral-500">Completas no último mês</p>
                          <p className="text-2xl font-semibold">{analyticsData?.hearingsInsights?.completedLastMonth || 0}</p>
                        </div>
                        <div className="bg-neutral-100 p-4 rounded-md">
                          <p className="text-sm text-neutral-500">Atrasadas</p>
                          <p className="text-2xl font-semibold text-red-500">{analyticsData?.hearingsInsights?.overdue || 0}</p>
                        </div>
                        <div className="bg-neutral-100 p-4 rounded-md">
                          <p className="text-sm text-neutral-500">Tempo médio para conclusão</p>
                          <p className="text-2xl font-semibold">{analyticsData?.hearingsInsights?.avgCompletionDays?.toFixed(1) || 0} days</p>
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
                    <CardTitle className="text-lg">Comunicações Criadas</CardTitle>
                    <CardDescription>Métricas das Comunicações</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-neutral-100 p-4 rounded-md">
                          <p className="text-sm text-neutral-500">Total de Mensagens</p>
                          <p className="text-2xl font-semibold">{analyticsData?.communicationInsights?.total || 0}</p>
                        </div>
                        <div className="bg-neutral-100 p-4 rounded-md">
                          <p className="text-sm text-neutral-500">Total de Destinatários</p>
                          <p className="text-2xl font-semibold">{analyticsData?.communicationInsights?.totalRecipients || 0}</p>
                        </div>
                        <div className="bg-neutral-100 p-4 rounded-md">
                          <p className="text-sm text-neutral-500">Mensagens no Mês</p>
                          <p className="text-2xl font-semibold">{analyticsData?.communicationInsights?.thisMonth || 0}</p>
                        </div>
                        <div className="bg-neutral-100 p-4 rounded-md">
                          <p className="text-sm text-neutral-500">Média de mensagens lidas</p>
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
                  <CardTitle className="text-lg">Engajamento de Entidades</CardTitle>
                  <CardDescription>Maiores interações de entidades</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-2">Entidades mais Ativas</h3>
                      <div className="space-y-2">
                        {isLoadingEntityAnalytics ? (
                          <p className="text-sm text-neutral-400">Carregando...</p>
                        ) : (entityAnalytics?.mostActive || []).length > 0 ? (
                          entityAnalytics?.mostActive?.map((entity: { name: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Iterable<ReactNode> | null | undefined; activityCount: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Iterable<ReactNode> | null | undefined; }, index: Key | null | undefined) => (
                            <div key={index} className="flex items-center justify-between bg-neutral-50 p-2 rounded-md">
                              <span className="text-sm font-medium">{entity.name}</span>
                              <span className="text-sm bg-primary-100 text-primary px-2 py-1 rounded-full">
                                {entity.activityCount} atividades
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-neutral-400">Sem informações</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-2">Entidades por número de interações</h3>
                      <div className="space-y-2">
                        {isLoadingEntityAnalytics ? (
                          <p className="text-sm text-neutral-400">Carregando Informações...</p>
                        ) : (entityAnalytics?.byCommunication || []).length > 0 ? (
                          entityAnalytics?.byCommunication?.map((entity: { name: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Iterable<ReactNode> | null | undefined; communicationCount: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Iterable<ReactNode> | null | undefined; }, index: Key | null | undefined) => (
                            <div key={index} className="flex items-center justify-between bg-neutral-50 p-2 rounded-md">
                              <span className="text-sm font-medium">{entity.name}</span>
                              <span className="text-sm bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                                {entity.communicationCount} Mensagens
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
              {/* Hearings Tab */}
            <TabsContent value="hearings" className="space-y-6">
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
            </TabsContent>
             <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tarefas Criadas</CardTitle>
                    <CardDescription>Métrica de Execução de Tarefas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-neutral-100 p-4 rounded-md">
                          <p className="text-sm text-neutral-500">Total de Tarefas Ativas</p>
                          <p className="text-2xl font-semibold">{analyticsData?.hearingsInsights?.totalActive || 0}</p>
                        </div>
                        <div className="bg-neutral-100 p-4 rounded-md">
                          <p className="text-sm text-neutral-500">Completas no último mês</p>
                          <p className="text-2xl font-semibold">{analyticsData?.hearingsInsights?.completedLastMonth || 0}</p>
                        </div>
                        <div className="bg-neutral-100 p-4 rounded-md">
                          <p className="text-sm text-neutral-500">Atrasadas</p>
                          <p className="text-2xl font-semibold text-red-500">{analyticsData?.hearingsInsights?.overdue || 0}</p>
                        </div>
                        <div className="bg-neutral-100 p-4 rounded-md">
                          <p className="text-sm text-neutral-500">Tempo médio para conclusão</p>
                          <p className="text-2xl font-semibold">{analyticsData?.hearingsInsights?.avgCompletionDays?.toFixed(1) || 0} days</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}