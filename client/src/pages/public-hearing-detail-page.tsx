import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ArrowLeft, 
  CalendarClock, 
  Clock, 
  Download, 
  FileUp, 
  Loader2, 
  MapPin, 
  Building2, 
  User,
  File
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useSimpleAuth } from "@/hooks/use-simple-auth";

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

const PublicHearingDetailPage = () => {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useSimpleAuth();
  const [files, setFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const publicHearingId = params.id ? parseInt(params.id) : undefined;

  // Query for the public hearing details
  const {
    data: publicHearing,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["/api/public-hearings", publicHearingId],
    enabled: !!publicHearingId,
  });

  if (error) {
    toast({
      title: "Erro ao carregar audiência pública",
      description: "Ocorreu um erro ao carregar os detalhes da audiência pública. Por favor, tente novamente.",
      variant: "destructive",
    });
  }

  const canManage = 
    user?.role === "master_implementer" || 
    (user?.role === "entity_head" && user.entityId === publicHearing?.entityId);

  // Mutation for updating the status to "in_progress"
  const startHearingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", `/api/public-hearings/${publicHearingId}`, {
        status: "in_progress",
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Audiência Pública iniciada",
        description: "O status da audiência pública foi atualizado para 'Em Andamento'.",
      });
      refetch();
    },
    onError: (error) => {
      console.error("Erro ao iniciar audiência pública:", error);
      toast({
        title: "Erro ao iniciar audiência",
        description: "Ocorreu um erro ao atualizar o status da audiência pública.",
        variant: "destructive",
      });
    },
  });

  // Mutation for updating the status to "completed"
  const completeHearingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", `/api/public-hearings/${publicHearingId}`, {
        status: "completed",
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Audiência Pública concluída",
        description: "O status da audiência pública foi atualizado para 'Concluída'.",
      });
      refetch();
    },
    onError: (error) => {
      console.error("Erro ao concluir audiência pública:", error);
      toast({
        title: "Erro ao concluir audiência",
        description: "Ocorreu um erro ao atualizar o status da audiência pública.",
        variant: "destructive",
      });
    },
  });

  // Mutation for cancelling the hearing
  const cancelHearingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/public-hearings/${publicHearingId}/cancel`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Audiência Pública cancelada",
        description: "A audiência pública foi cancelada com sucesso.",
      });
      refetch();
    },
    onError: (error) => {
      console.error("Erro ao cancelar audiência pública:", error);
      toast({
        title: "Erro ao cancelar audiência",
        description: "Ocorreu um erro ao cancelar a audiência pública.",
        variant: "destructive",
      });
    },
  });

  // File upload handler
  const handleFileUpload = async () => {
    if (!files || files.length === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione pelo menos um arquivo para upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("publicHearingId", publicHearingId!.toString());
      
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      const response = await fetch("/api/public-hearing-files", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Falha ao fazer upload dos arquivos");
      }

      toast({
        title: "Upload concluído",
        description: `${files.length} arquivo(s) enviado(s) com sucesso.`,
      });
      
      // Clear files and refetch hearing data to show the new files
      setFiles(null);
      refetch();
    } catch (error) {
      console.error("Erro no upload de arquivos:", error);
      toast({
        title: "Erro no upload",
        description: "Ocorreu um erro ao fazer upload dos arquivos. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handler to download files
  const handleDownloadFile = (fileId: number) => {
    window.open(`/api/public-hearing-files/${fileId}`, "_blank");
  };

  // If the hearing is not found, show a not found message
  if (publicHearingId && !isLoading && !publicHearing) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Button variant="ghost" onClick={() => navigate("/public-hearings")} className="mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Audiências Públicas
        </Button>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Audiência Pública não encontrada</h2>
          <p className="text-muted-foreground mb-6">
            A audiência pública que você está procurando não foi encontrada ou foi removida.
          </p>
          <Button onClick={() => navigate("/public-hearings")}>
            Ver todas as audiências
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <Button variant="ghost" onClick={() => navigate("/public-hearings")} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Audiências Públicas
      </Button>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-6 w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      ) : publicHearing ? (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold">{publicHearing.title}</h1>
              <div className="flex items-center mt-2">
                <Badge className={cn("text-xs", getStatusColor(publicHearing.status))}>
                  {translateStatus(publicHearing.status)}
                </Badge>
                <span className="text-sm text-muted-foreground ml-4">
                  ID: {publicHearing.id}
                </span>
              </div>
            </div>
            
            {canManage && publicHearing.status === "scheduled" && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => startHearingMutation.mutate()}
                  disabled={startHearingMutation.isPending}
                >
                  {startHearingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Iniciar Audiência
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => cancelHearingMutation.mutate()}
                  disabled={cancelHearingMutation.isPending}
                >
                  {cancelHearingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cancelar
                </Button>
              </div>
            )}
            
            {canManage && publicHearing.status === "in_progress" && (
              <Button 
                onClick={() => completeHearingMutation.mutate()}
                disabled={completeHearingMutation.isPending}
              >
                {completeHearingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Concluir Audiência
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center">
                  <CalendarClock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">
                    {format(
                      typeof publicHearing.date === 'string' 
                        ? new Date(publicHearing.date) 
                        : publicHearing.date instanceof Date 
                          ? publicHearing.date 
                          : new Date(), 
                      "dd 'de' MMMM 'de' yyyy",
                      { locale: ptBR }
                    )}
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">
                    {publicHearing.startTime} - {publicHearing.endTime}
                  </span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{publicHearing.location}</span>
                </div>
                <div className="flex items-center">
                  <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{publicHearing.entity?.name}</span>
                </div>
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">Criado por: ID {publicHearing.createdBy}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Descrição da Audiência Pública</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm">{publicHearing.description}</p>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-xl font-bold mt-8 mb-4">Documentos</h2>
          
          {canManage && (
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Adicionar Documentos</CardTitle>
                <CardDescription>
                  Faça upload de documentos relacionados a esta audiência pública.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="files">Selecionar arquivos</Label>
                    <Input
                      id="files"
                      type="file"
                      multiple
                      onChange={(e) => setFiles(e.target.files)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleFileUpload} 
                      disabled={!files || files.length === 0 || isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <FileUp className="mr-2 h-4 w-4" />
                          Fazer Upload
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {publicHearing.files && publicHearing.files.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicHearing.files.map((file) => (
                <Card key={file.id} className="flex flex-col h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium truncate">
                      {file.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grow">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <File className="h-4 w-4 mr-2" />
                      {file.type}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Enviado em {format(
                        typeof file.uploadedAt === 'string' 
                          ? new Date(file.uploadedAt) 
                          : file.uploadedAt instanceof Date 
                            ? file.uploadedAt 
                            : new Date(), 
                        "dd/MM/yyyy HH:mm"
                      )}
                    </div>
                  </CardContent>
                  <div className="p-4 pt-0 mt-auto">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleDownloadFile(file.id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Nenhum documento disponível</h3>
              <p className="text-muted-foreground mt-2">
                {canManage
                  ? "Você pode adicionar documentos usando o formulário acima."
                  : "Não há documentos disponíveis para esta audiência pública."}
              </p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default PublicHearingDetailPage;