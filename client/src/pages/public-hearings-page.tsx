import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CalendarClock, 
  FileText, 
  Info, 
  Plus, 
  Building2, 
  User, 
  MapPin,
  Download,
  Clock,
  Calendar,
  Filter
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { PublicHearing } from "@shared/schema";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import CreatePublicHearingDialog from "@/components/dialogs/create-public-hearing-dialog";
import { useTranslation } from "@/hooks/use-translation";

// Helper to get status color
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

type PublicHearingWithEntity = PublicHearing & {
  entity: {
    id: number;
    name: string;
    type: string;
  };
};

const PublicHearingsPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useSimpleAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Query for all public hearings
  const {
    data: publicHearings,
    isLoading: isLoadingHearings,
    error: hearingsError,
    refetch: refetchHearings,
  } = useQuery<PublicHearingWithEntity[]>({
    queryKey: ["/api/public-hearings"],
  });

  // Query for upcoming public hearings
  const {
    data: upcomingHearings,
    isLoading: isLoadingUpcoming,
    error: upcomingError,
  } = useQuery<PublicHearingWithEntity[]>({
    queryKey: ["/api/public-hearings/upcoming"],
  });

  if (hearingsError || upcomingError) {
    toast({
      title: "Erro ao carregar audiências públicas",
      description: "Ocorreu um erro ao carregar as audiências públicas. Por favor, tente novamente.",
      variant: "destructive",
    });
  }

  // Filter public hearings based on selected filters
  const filteredPublicHearings = publicHearings?.filter((hearing) => {
    let matchesEntity = true;
    let matchesStatus = true;

    if (entityFilter !== "all") {
      matchesEntity = hearing.entity.id === parseInt(entityFilter);
    }

    if (statusFilter !== "all") {
      matchesStatus = hearing.status === statusFilter;
    }

    return matchesEntity && matchesStatus;
  });

  // Get unique entities from hearings for filter dropdown
  const uniqueEntities = publicHearings
    ? Array.from(new Set(publicHearings.map((h) => h.entity.id))).map((id) => {
        const hearing = publicHearings.find((h) => h.entity.id === id);
        return {
          id,
          name: hearing?.entity.name || "",
        };
      })
    : [];

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Audiências Públicas</h1>
          <p className="text-muted-foreground">
            Gerencie e acompanhe audiências públicas agendadas para as entidades.
          </p>
        </div>
        {(user?.role === "master_implementer" || user?.role === "entity_head") && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Audiência Pública
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="upcoming">Próximas</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="flex gap-4 mb-4">
            <div className="w-1/3">
              <Label htmlFor="entity-filter">Filtrar por Entidade</Label>
              <Select
                value={entityFilter}
                onValueChange={setEntityFilter}
              >
                <SelectTrigger id="entity-filter">
                  <SelectValue placeholder="Todas as Entidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Entidades</SelectItem>
                  {uniqueEntities.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id.toString()}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-1/3">
              <Label htmlFor="status-filter">Filtrar por Status</Label>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Todos os Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="scheduled">Agendada</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoadingHearings ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : filteredPublicHearings && filteredPublicHearings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPublicHearings.map((hearing) => (
                <PublicHearingCard
                  key={hearing.id}
                  hearing={hearing}
                  onRefresh={refetchHearings}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Nenhuma audiência pública encontrada</h3>
              <p className="text-muted-foreground mt-2">
                {entityFilter !== "all" || statusFilter !== "all"
                  ? "Tente ajustar os filtros para ver mais resultados."
                  : "Não há audiências públicas registradas no sistema."}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming">
          {isLoadingUpcoming ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : upcomingHearings && upcomingHearings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingHearings.map((hearing) => (
                <PublicHearingCard
                  key={hearing.id}
                  hearing={hearing}
                  onRefresh={refetchHearings}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CalendarClock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Nenhuma audiência pública agendada</h3>
              <p className="text-muted-foreground mt-2">
                Não há audiências públicas agendadas para os próximos dias.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreatePublicHearingDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          refetchHearings();
          toast({
            title: "Audiência pública criada",
            description: "A audiência pública foi criada com sucesso.",
          });
        }}
      />
    </div>
  );
};

interface PublicHearingCardProps {
  hearing: PublicHearingWithEntity;
  onRefresh: () => void;
}

const PublicHearingCard = ({ hearing, onRefresh }: PublicHearingCardProps) => {
  const { toast } = useToast();
  const { user } = useSimpleAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  // Format date to Brazilian format
  const formattedDate = format(new Date(hearing.date), "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });

  const canManage = 
    user?.role === "master_implementer" || 
    (user?.role === "entity_head" && user.entityId === hearing.entityId);

  const handleCancel = async () => {
    try {
      const response = await fetch(`/api/public-hearings/${hearing.id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Falha ao cancelar audiência pública");
      }

      toast({
        title: "Audiência pública cancelada",
        description: "A audiência pública foi cancelada com sucesso.",
      });
      
      onRefresh();
    } catch (error) {
      console.error("Error cancelling public hearing:", error);
      toast({
        title: "Erro ao cancelar audiência pública",
        description: "Ocorreu um erro ao cancelar a audiência pública. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{hearing.title}</CardTitle>
          <Badge className={getStatusColor(hearing.status)}>
            {translateStatus(hearing.status)}
          </Badge>
        </div>
        <CardDescription>{formattedDate}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>
              {hearing.startTime} - {hearing.endTime}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{hearing.entity.name}</span>
          </div>
          <div className="flex items-center text-sm">
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{hearing.location}</span>
          </div>
          {isExpanded && (
            <>
              <Separator className="my-2" />
              <div className="text-sm mt-2">
                <p className="font-medium mb-1">Descrição:</p>
                <p className="whitespace-pre-line">{hearing.description}</p>
              </div>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="flex w-full gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Mostrar Menos" : "Mostrar Mais"}
          </Button>
          <Button 
            variant="outline" 
            className="flex-shrink-0"
            onClick={() => window.location.href = `/public-hearings/${hearing.id}`}
          >
            <FileText className="h-4 w-4" />
          </Button>
        </div>
        {canManage && hearing.status === "scheduled" && (
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleCancel}
          >
            Cancelar Audiência
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default PublicHearingsPage;