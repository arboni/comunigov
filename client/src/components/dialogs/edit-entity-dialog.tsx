import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest, invalidateEntities, invalidateDashboardStats } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Entity, insertEntitySchema } from "@shared/schema";

interface EditEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: number;
  entity: Entity;
}

const formSchema = insertEntitySchema.extend({
  tags: z.string().optional()
}).transform(data => {
  // Convert string tags to array
  const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()) : [];
  return {
    ...data,
    tags: tagsArray,
  };
});

type FormValues = z.input<typeof formSchema>;

export default function EditEntityDialog({
  open,
  onOpenChange,
  entityId,
  entity,
}: EditEntityDialogProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // Convert tags array to comma-separated string for the form
  const tagsString = entity.tags ? entity.tags.join(', ') : '';
  
  // Set up form with the current entity data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: entity.name,
      type: entity.type,
      headName: entity.headName,
      headPosition: entity.headPosition,
      headEmail: entity.headEmail,
      address: entity.address || '',
      phone: entity.phone || '',
      website: entity.website || '',
      socialMedia: entity.socialMedia || '',
      tags: tagsString,
    },
  });

  const updateEntityMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("PUT", `/api/entities/${entityId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh the data
      invalidateEntities();
      invalidateDashboardStats();
      
      toast({
        title: t("entities.entity_updated"),
        description: t("entities.entity_updated_description"),
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: t("entities.update_failed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: FormValues) {
    updateEntityMutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("entities.edit_entity")}</DialogTitle>
          <DialogDescription>
            {t("entities.edit_entity_description")}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("entities.entity_name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("entities.entity_name_placeholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("entities.entity_type")}</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("entities.select_entity_type")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="secretariat">{t("entities.types.secretariat")}</SelectItem>
                      <SelectItem value="administrative_unit">{t("entities.types.administrative_unit")}</SelectItem>
                      <SelectItem value="external_entity">{t("entities.types.external_entity")}</SelectItem>
                      <SelectItem value="government_agency">{t("entities.types.government_agency")}</SelectItem>
                      <SelectItem value="association">{t("entities.types.association")}</SelectItem>
                      <SelectItem value="council">{t("entities.types.council")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="headName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Head Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. John Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="headPosition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Head Position</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Director" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="headEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Head Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="e.g. john.smith@example.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. +1 234 567 8901" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. www.example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 123 Main St, City" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="socialMedia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Social Media (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. @entityhandle" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma separated, Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. finance, budget, accounting" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button 
                type="submit" 
                disabled={updateEntityMutation.isPending}
              >
                {updateEntityMutation.isPending ? t("entities.updating") : t("entities.update_entity")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}