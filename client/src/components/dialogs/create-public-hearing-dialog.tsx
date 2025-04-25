import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, FileUp, Loader2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { useToast } from "@/hooks/use-toast";

interface CreatePublicHearingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const formSchema = z.object({
  title: z.string().min(3, {
    message: "O título deve ter pelo menos 3 caracteres.",
  }),
  date: z.date({
    required_error: "Data é obrigatória.",
  }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Formato de hora inválido. Use HH:MM (ex: 15:30)",
  }),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Formato de hora inválido. Use HH:MM (ex: 17:00)",
  }),
  location: z.string().min(3, {
    message: "O local deve ter pelo menos 3 caracteres.",
  }),
  description: z.string().min(10, {
    message: "A descrição deve ter pelo menos 10 caracteres.",
  }),
  entityId: z.string({
    required_error: "Selecione uma entidade.",
  }),
  status: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const CreatePublicHearingDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: CreatePublicHearingDialogProps) => {
  const { user } = useSimpleAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Query to fetch entities
  const { data: entities, isLoading: isLoadingEntities } = useQuery({
    queryKey: ["/api/entities"],
  });

  // Default form values
  const defaultValues: Partial<FormValues> = {
    title: "",
    date: new Date(),
    startTime: "14:00",
    endTime: "16:00",
    location: "",
    description: "",
    status: "scheduled",
  };

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // File upload handler
  const uploadFiles = async (hearingId: number) => {
    if (!files || files.length === 0) {
      return; // No files to upload
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("publicHearingId", hearingId.toString());
      
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
      
      // Clear files
      setFiles(null);
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

  // Handle form submission
  const createPublicHearingMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/public-hearings", {
        ...data,
        entityId: parseInt(data.entityId),
      });
      return await res.json();
    },
    onSuccess: async (createdHearing) => {
      // If we have files to upload, upload them now
      if (files && files.length > 0) {
        await uploadFiles(createdHearing.id);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/public-hearings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public-hearings/upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      form.reset(defaultValues);
      onOpenChange(false);
      onSuccess?.();
      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error("Error creating public hearing:", error);
      setIsSubmitting(false);
      toast({
        title: "Erro ao criar audiência pública",
        description: "Ocorreu um erro ao criar a audiência pública. Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    setIsSubmitting(true);
    createPublicHearingMutation.mutate(data);
  };

  // If the user is an entity head, auto-select their entity
  const userEntityId = user?.entityId;
  const isEntityHead = user?.role === "entity_head";

  // Prepare entities list, filtering by user's entity if they're an entity head
  const filteredEntities = isEntityHead && userEntityId 
    ? entities?.filter((entity: any) => entity.id === userEntityId) 
    : entities;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md md:max-w-xl">
        <DialogHeader>
          <DialogTitle>Nova Audiência Pública</DialogTitle>
          <DialogDescription>
            Crie uma nova audiência pública para sua entidade. Preencha os detalhes abaixo.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o título da audiência pública" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data</FormLabel>
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
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
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
                          disabled={(date) => date < new Date()}
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="entityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entidade</FormLabel>
                    <Select
                      disabled={isLoadingEntities || isEntityHead}
                      onValueChange={field.onChange}
                      defaultValue={
                        isEntityHead && userEntityId ? userEntityId.toString() : field.value
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma entidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredEntities?.map((entity: any) => (
                          <SelectItem key={entity.id} value={entity.id.toString()}>
                            {entity.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {isEntityHead
                        ? "Como gestor de entidade, você só pode criar audiências para sua própria entidade."
                        : "Selecione a entidade responsável pela audiência pública."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de Início</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 14:00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de Término</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 16:00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o local da audiência pública" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva os objetivos e pautas da audiência pública"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload Section */}
            <div className="space-y-2">
              <FormLabel>Documentos (opcional)</FormLabel>
              <div className="flex flex-col gap-2 border rounded-md p-4">
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    className="flex-1"
                    onChange={(e) => setFiles(e.target.files)}
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  />
                  {files && files.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {files.length} arquivo(s) selecionado(s)
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Você pode enviar até 10 arquivos (PDFs, documentos, planilhas, imagens).
                  <br />
                  Tamanho máximo por arquivo: 10MB
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Criar Audiência Pública"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePublicHearingDialog;