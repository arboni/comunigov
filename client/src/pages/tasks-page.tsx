import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Plus,
  Search,
  Loader2,
  Check,
  X,
  Clock,
  AlertCircle,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { Task, Subject } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import CreateTaskDialog from "@/components/dialogs/create-task-dialog";
import SubjectDialog from "../components/dialogs/subject-dialog";

// Helper function to get task status badge color
function getTaskStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>Pending</span>
        </Badge>
      );
    case "in_progress":
      <Badge variant="secondary" className="flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>In Progress</span>
      </Badge>;
    case "completed":
      return (
        <Badge variant="success" className="flex items-center gap-1 bg-green-100 text-green-800">
          <Check className="h-3 w-3" />
          <span>Completed</span>
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <X className="h-3 w-3" />
          <span>Cancelled</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          <span>Unknown</span>
        </Badge>
      );
  }
}

export default function TasksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [sortField, setSortField] = useState("deadline");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createSubjectOpen, setCreateSubjectOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tasks and subjects
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["/api/tasks"],
  });

  const { data: subjects = [], isLoading: isLoadingSubjects } = useQuery({
    queryKey: ["/api/subjects"],
  });

  // Task update mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/tasks/${id}`, { status });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update task");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Task status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Change task status handler
  const handleStatusChange = (taskId: number, newStatus: string) => {
    updateTaskMutation.mutate({ id: taskId, status: newStatus });
  };

  // Filter and sort tasks
  const filteredTasks = tasks
    .filter((task: Task) => {
      // Apply search query filter
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Apply status filter
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;

      // Apply subject filter
      const matchesSubject =
        subjectFilter === "all" || task.subjectId.toString() === subjectFilter;

      return matchesSearch && matchesStatus && matchesSubject;
    })
    .sort((a: Task, b: Task) => {
      // Apply sorting
      let compareResult = 0;

      switch (sortField) {
        case "title":
          compareResult = a.title.localeCompare(b.title);
          break;
        case "deadline":
          compareResult = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          break;
        case "status":
          compareResult = a.status.localeCompare(b.status);
          break;
        default:
          compareResult = 0;
      }

      return sortDirection === "asc" ? compareResult : -compareResult;
    });

  // Loading states
  if (isLoadingTasks || isLoadingSubjects) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Tarefas</h1>
            <p className="text-muted-foreground">
              Gerencie e acompanhe todas as tarefas em diferentes assuntos
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                console.log("Opening create subject dialog");
                // Force close first in case it's somehow still open
                setCreateSubjectOpen(false);
                // Then set timeout to open it again
                setTimeout(() => {
                  console.log("Setting dialog to open state");
                  setCreateSubjectOpen(true);
                }, 100);
              }}
              variant="outline"
              className="gap-1"
            >
              <Plus className="h-4 w-4" /> Assunto
            </Button>
            <Button
              onClick={() => setCreateTaskOpen(true)}
              className="gap-1"
            >
              <Plus className="h-4 w-4" /> Tarefa
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Filtros e Pesquisa</CardTitle>
            <CardDescription>
              Encontre tarefas por título, descrição, status ou assunto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Pesquisar tarefas..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={subjectFilter}
                onValueChange={setSubjectFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por Assunto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Assuntos</SelectItem>
                  {subjects.map((subject: Subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Select
                  value={sortField}
                  onValueChange={setSortField}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">Título</SelectItem>
                    <SelectItem value="deadline">Prazo</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setSortDirection(sortDirection === "asc" ? "desc" : "asc")
                  }
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task List */}
        <Card>
          <CardHeader>
            <CardTitle>Tarefas</CardTitle>
            <CardDescription>
              {filteredTasks.length} {filteredTasks.length === 1 ? "tarefa" : "tarefas"} encontrada{filteredTasks.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTasks.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhuma tarefa encontrada com os filtros atuais
                </p>
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setSubjectFilter("all");
                  }}
                >
                  Limpar filtros
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Assunto</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task: any) => {
                      const subject = subjects.find(
                        (s: any) => s.id === task.subjectId
                      );
                      
                      return (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">{task.title}</TableCell>
                          <TableCell>{subject?.name || "Desconhecido"}</TableCell>
                          <TableCell>
                            {task.isRegisteredUser
                              ? task.assignedToUserId
                                ? `[ID do Usuário: ${task.assignedToUserId}]`  // This would normally show the user name from a join
                                : "Não Atribuído"
                              : task.ownerName || "Usuário Externo"}
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <time dateTime={task.deadline}>
                                    {format(new Date(task.deadline), "MMM d, yyyy")}
                                  </time>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {format(new Date(task.deadline), "EEEE, MMMM d, yyyy")}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>{getTaskStatusBadge(task.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Filter className="h-4 w-4" />
                                  <span className="sr-only">Ações</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(task.id, "pending")}
                                  disabled={task.status === "pending"}
                                >
                                  Marcar como Pendente
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(task.id, "in_progress")}
                                  disabled={task.status === "in_progress"}
                                >
                                  Marcar como Em Andamento
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(task.id, "completed")}
                                  disabled={task.status === "completed"}
                                >
                                  Marcar como Concluída
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(task.id, "cancelled")}
                                  disabled={task.status === "cancelled"}
                                >
                                  Marcar como Cancelada
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
      />
      <SubjectDialog
        open={createSubjectOpen}
        onOpenChange={setCreateSubjectOpen}
      />
    </DashboardLayout>
  );
}