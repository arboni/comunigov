import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Search, MapPin, Calendar, Building2, Clock, Filter, Loader2 } from "lucide-react";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import CreatePublicHearingDialog from "@/components/dialogs/create-public-hearing-dialog";

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case "scheduled":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "in_progress":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "completed":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
};

// Helper to translate status
const translateStatus = (status: string) => {
  switch (status) {
    case "scheduled":
      return "Agendada";
    case "in_progress":
      return "Em Andamento";
    case "completed":
      return "Concluída";
    case "cancelled":
      return "Cancelada";
    default:
      return status;
  }
};

type PublicHearingWithEntity = {
  id: number;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  createdBy: number;
  entityId: number;
  createdAt: string;
  updatedAt: string;
  entity: {
    id: number;
    name: string;
    type: string;
  };
};

interface PublicHearingCardProps {
  hearing: PublicHearingWithEntity;
  onRefresh: () => void;
}

const PublicHearingCard = ({ hearing, onRefresh }: PublicHearingCardProps) => {
  const [, navigate] = useLocation();

  const formattedDate = format(new Date(hearing.date), 'dd/MM/yyyy', { locale: ptBR });
  const formattedDay = format(new Date(hearing.date), 'dd', { locale: ptBR });
  const formattedMonth = format(new Date(hearing.date), 'MMM', { locale: ptBR });

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div className="flex">
        {/* Date column */}
        <div className="flex flex-col items-center justify-center w-24 bg-primary-50 text-primary p-4">
          <span className="text-3xl font-bold">{formattedDay}</span>
          <span className="text-sm uppercase">{formattedMonth}</span>
        </div>

        {/* Content column */}
        <div className="flex-1">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{hearing.title}</CardTitle>
                <CardDescription className="mt-1">
                  <Badge 
                    className={cn("text-xs font-medium", getStatusColor(hearing.status))}
                    variant="outline"
                  >
                    {translateStatus(hearing.status)}
                  </Badge>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pb-2">
            <div className="flex flex-col space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                <span>{hearing.startTime} - {hearing.endTime}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{hearing.location}</span>
              </div>
              <div className="flex items-center">
                <Building2 className="h-4 w-4 mr-2" />
                <span>{hearing.entity.name}</span>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="pt-0">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => navigate(`/public-hearings/${hearing.id}`)}
            >
              Ver Detalhes
            </Button>
          </CardFooter>
        </div>
      </div>
    </Card>
  );
};

const FilterSkeleton = () => (
  <div className="flex gap-2 md:items-end mb-6 flex-col md:flex-row">
    <div className="flex-1">
      <Skeleton className="h-9 w-full" />
    </div>
    <div className="w-[120px]">
      <Skeleton className="h-9 w-full" />
    </div>
    <div className="w-[120px]">
      <Skeleton className="h-9 w-full" />
    </div>
    <div className="w-[100px]">
      <Skeleton className="h-9 w-full" />
    </div>
  </div>
);

const CardSkeleton = () => (
  <Card className="overflow-hidden">
    <div className="flex">
      <div className="w-24 bg-primary-50 p-4">
        <Skeleton className="h-10 w-10 mx-auto" />
      </div>
      <div className="flex-1 p-6">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/4 mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="mt-4">
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    </div>
  </Card>
);

const PublicHearingsPage = () => {
  const { user } = useSimpleAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Query to fetch entities for filtering
  const { data: entities } = useQuery({
    queryKey: ["/api/entities"],
  });

  // Query to fetch public hearings
  const { 
    data: hearings, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ["/api/public-hearings"],
  });

  // Query to fetch upcoming hearings
  const { 
    data: upcomingHearings, 
    isLoading: isLoadingUpcoming 
  } = useQuery({
    queryKey: ["/api/public-hearings/upcoming"],
  });

  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">Audiências Públicas</h1>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p>Ocorreu um erro ao carregar as audiências públicas. Por favor, tente novamente mais tarde.</p>
        </div>
      </div>
    );
  }

  // Filter data based on search term, status, and entity
  const filteredHearings = (activeTab === 'all' ? hearings : upcomingHearings)?.filter((hearing: any) => {
    const matchesSearch = hearing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          hearing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          hearing.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter && statusFilter !== "all" ? hearing.status === statusFilter : true;
    
    const matchesEntity = entityFilter && entityFilter !== "all" ? hearing.entityId === parseInt(entityFilter) : true;
    
    return matchesSearch && matchesStatus && matchesEntity;
  });

  // Check if user has permission to create hearings
  const canCreateHearings = user?.role === "master_implementer" || user?.role === "entity_head";

  return (
    <DashboardLayout>
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Audiências Públicas</h1>
        {canCreateHearings && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Audiência
          </Button>
        )}
      </div>

      <Tabs
        defaultValue="all"
        className="mb-6"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="upcoming">Próximas</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading || isLoadingUpcoming ? (
        <FilterSkeleton />
      ) : (
        <div className="flex gap-2 md:items-end mb-6 flex-col md:flex-row">
          <div className="flex-1">
            <Input
              placeholder="Buscar por título, descrição ou local..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <span className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="scheduled">Agendada</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select
              value={entityFilter}
              onValueChange={setEntityFilter}
            >
              <SelectTrigger className="w-[180px]">
                <span className="flex items-center">
                  <Building2 className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Entidade" />
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as entidades</SelectItem>
                {entities?.map((entity: any) => (
                  <SelectItem key={entity.id} value={entity.id.toString()}>
                    {entity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {isLoading || isLoadingUpcoming ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : filteredHearings?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHearings.map((hearing: PublicHearingWithEntity) => (
            <PublicHearingCard 
              key={hearing.id} 
              hearing={hearing} 
              onRefresh={refetch}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <h3 className="text-lg font-medium">Nenhuma audiência pública encontrada</h3>
          <p className="text-muted-foreground mt-2">
            {searchTerm || (statusFilter !== "all") || (entityFilter !== "all")
              ? "Tente remover os filtros ou alterar os termos de busca."
              : activeTab === "upcoming"
              ? "Não há audiências públicas agendadas para o futuro."
              : "Não há audiências públicas cadastradas no sistema."}
          </p>
          {canCreateHearings && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Audiência
            </Button>
          )}
        </div>
      )}

      {/* Create Public Hearing Dialog */}
      <CreatePublicHearingDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={refetch}
      />
    </div>
    </DashboardLayout>
  );
};

export default PublicHearingsPage;