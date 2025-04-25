import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn, reloadPage } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertTaskSchema, type InsertTask } from "@shared/schema";

// Components
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

// Extended schema with validations
const formSchema = insertTaskSchema.extend({
  deadline: z.date({
    required_error: "A deadline is required",
  }),
  isRegisteredUser: z.boolean().default(true),
});

type TaskFormValues = z.infer<typeof formSchema>;

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateTaskDialog({
  open,
  onOpenChange,
}: CreateTaskDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRegisteredUser, setIsRegisteredUser] = useState(true);
  const [subjectSearch, setSubjectSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  
  // Debug logs
  useEffect(() => {
    if (open) {
      console.log("CreateTaskDialog opened");
    }
  }, [open]);

  // Load subjects for dropdown
  const { data: subjects = [] } = useQuery({
    queryKey: ["/api/subjects"],
    enabled: open,
  });

  // Load users for dropdown when isRegisteredUser is true
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    enabled: open && isRegisteredUser,
  });

  // Form setup with properly initialized values
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      deadline: new Date(),
      status: "pending",
      isRegisteredUser: true,
      ownerName: "",
      ownerEmail: "",
      ownerPhone: "",
      subjectId: undefined, // Will be set by user selection
      assignedToUserId: undefined, // Will be set by user selection
    },
  });

  // Update form when isRegisteredUser changes
  useEffect(() => {
    form.setValue("isRegisteredUser", isRegisteredUser);
  }, [isRegisteredUser, form]);

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      const response = await apiRequest("POST", "/api/tasks", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create task");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Task created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      form.reset();
      onOpenChange(false);
      
      // Reload page to show updated tasks
      reloadPage(1500, "/tasks");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: TaskFormValues) {
    console.log("Submitting form data:", data);
    // Ensure data is properly typed before mutation
    const formattedData = {
      ...data,
      ownerName: data.ownerName || "",
      ownerEmail: data.ownerEmail || "",
      ownerPhone: data.ownerPhone || "",
    };
    createTaskMutation.mutate(formattedData);
  }

  // Log rendering for debugging
  console.log("Rendering CreateTaskDialog, open state:", open);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Tarefa</DialogTitle>
          <DialogDescription>
            Adicione uma nova tarefa com todos os detalhes necessários.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 py-4">
              {/* Subject Selection - Searchable */}
              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Área de Assunto</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? subjects.find(
                                  (subject: any) => subject.id === field.value
                                )?.name
                              : "Selecione a área do assunto"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandInput 
                            placeholder="Pesquisar assunto..." 
                            value={subjectSearch}
                            onValueChange={setSubjectSearch}
                          />
                          <CommandEmpty>Nenhum assunto encontrado.</CommandEmpty>
                          <CommandGroup>
                            {subjects
                              .filter((subject: any) => 
                                subject.name.toLowerCase().includes(subjectSearch.toLowerCase()))
                              .map((subject: any) => (
                                <CommandItem
                                  value={subject.name}
                                  key={subject.id}
                                  onSelect={() => {
                                    form.setValue("subjectId", subject.id);
                                    setSubjectSearch("");
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === subject.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {subject.name}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Escolha a área de assunto a que esta tarefa pertence
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Task Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Título da tarefa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Task Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Adicione uma descrição detalhada da tarefa"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Task Deadline */}
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Prazo</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Escolha uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Task Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue="pending"
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="in_progress">Em Andamento</SelectItem>
                        <SelectItem value="completed">Concluída</SelectItem>
                        <SelectItem value="cancelled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Is Registered User checkbox */}
              <FormField
                control={form.control}
                name="isRegisteredUser"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          setIsRegisteredUser(!!checked);
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Usuário Registrado</FormLabel>
                      <FormDescription>
                        O responsável pela tarefa é um usuário registrado no sistema?
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {/* Conditional fields based on isRegisteredUser */}
              {isRegisteredUser ? (
                // User dropdown for registered users
                <FormField
                  control={form.control}
                  name="assignedToUserId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Atribuído Para</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? users.find(
                                    (user: any) => user.id === field.value
                                  )?.fullName
                                : "Selecione um usuário"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Pesquisar usuário..." 
                              value={userSearch}
                              onValueChange={setUserSearch}
                            />
                            <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
                            <CommandGroup>
                              {users
                                .filter((user: any) => 
                                  (user.fullName || user.username || "").toLowerCase().includes(userSearch.toLowerCase()))
                                .map((user: any) => (
                                  <CommandItem
                                    value={user.fullName || user.username}
                                    key={user.id}
                                    onSelect={() => {
                                      form.setValue("assignedToUserId", user.id);
                                      setUserSearch("");
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === user.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {user.fullName || user.username}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Selecione o usuário responsável por esta tarefa
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                // Fields for non-registered users with explicit string type handling
                <>
                  <FormField
                    control={form.control}
                    name="ownerName"
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>Nome do Responsável</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Nome completo" 
                            value={value || ""} 
                            onChange={onChange} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ownerEmail"
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>Email do Responsável</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Email para contato"
                            value={value || ""} 
                            onChange={onChange}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ownerPhone"
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>Telefone do Responsável</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Número de telefone" 
                            value={value || ""} 
                            onChange={onChange}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createTaskMutation.isPending}
              >
                {createTaskMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Criar Tarefa
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}