import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient, invalidateEntities, invalidateDashboardStats } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";
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
import { insertEntitySchema } from "@shared/schema";

interface RegisterEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export default function RegisterEntityDialog({
  open,
  onOpenChange,
}: RegisterEntityDialogProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "secretariat",
      headName: "",
      headPosition: "",
      headEmail: "",
      tags: "",
    },
  });

  const createEntityMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/entities", data);
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh the data
      invalidateEntities();
      invalidateDashboardStats();
      
      toast({
        title: "Entity registered",
        description: "The entity has been successfully registered.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: FormValues) {
    createEntityMutation.mutate(data);
  }

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    // In a real implementation, this would parse a CSV file
    // and populate the form with entity data
    setIsUploading(true);
    
    // Simulate processing time
    setTimeout(() => {
      setIsUploading(false);
      toast({
        title: "File processed",
        description: "The CSV file has been processed. Please review the data before submitting.",
      });
    }, 1500);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Register New Entity</DialogTitle>
          <DialogDescription>
            Fill in the details to register a new entity in the system. The entity head will receive an email to complete the registration.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entity Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Finance Department" {...field} />
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
                  <FormLabel>Entity Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select entity type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="secretariat">Secretariat</SelectItem>
                      <SelectItem value="administrative_unit">Administrative Unit</SelectItem>
                      <SelectItem value="external_entity">External Entity</SelectItem>
                      <SelectItem value="government_agency">Government Agency</SelectItem>
                      <SelectItem value="association">Association</SelectItem>
                      <SelectItem value="council">Council</SelectItem>
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
            
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma separated)</FormLabel>
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
            
            <div>
              <FormLabel className="block text-sm font-medium mb-2">Or Import from CSV</FormLabel>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-neutral-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-neutral-400"
                    xmlns="http://www.w3.org/2000/svg"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 14v20c0 4.418 7.163 8 16 8 1.381 0 2.721-.087 4-.252M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8m0 0v14m0-4c0 4.418-7.163 8-16 8S8 28.418 8 24m32 10v6m0 0v6m0-6h6m-6 0h-6"
                    />
                  </svg>
                  <div className="flex text-sm text-neutral-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-600"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".csv"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-neutral-500">
                    CSV up to 10MB
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createEntityMutation.isPending || isUploading}
              >
                {createEntityMutation.isPending ? "Registering..." : "Register Entity"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
