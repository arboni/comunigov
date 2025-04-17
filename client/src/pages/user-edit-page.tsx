import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

// Helper function to format a phone number for WhatsApp
function formatWhatsAppNumber(phone: string): string {
  // Strip any non-digit characters except the + sign
  let formatted = phone.replace(/[^0-9+]/g, '');
  
  // Ensure it starts with a +
  if (!formatted.startsWith('+')) {
    formatted = '+' + formatted;
  }
  
  return formatted;
}
import { useParams, Link, useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import CallMeBotSetupGuide from "@/components/settings/callmebot-setup-guide";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Form schema for user editing
const userFormSchema = z.object({
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().optional(),
  whatsapp: z.string().optional()
    .refine(
      (val) => !val || /^\+?[0-9]{10,15}$/.test(val.replace(/[^0-9+]/g, '')),
      { message: "Please enter a valid WhatsApp number with country code (e.g., +551199999999)" }
    ),
  telegram: z.string().optional(),
  position: z.string().optional(),
  role: z.string(),
  bio: z.string().optional(),
  entityId: z.string().optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export default function UserEditPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch user data
  const { data: user, isLoading } = useQuery({
    queryKey: [`/api/users/${id}`],
  });
  
  // Fetch all entities for the dropdown
  const { data: entities = [] } = useQuery({
    queryKey: ['/api/entities'],
  });
  
  // Fetch Twilio WhatsApp number to show in instructions
  const { data: twilioData } = useQuery({
    queryKey: ['/api/twilio-whatsapp-number'],
  });
  
  // Create form
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      whatsapp: "",
      telegram: "",
      position: "",
      role: "",
      bio: "",
      entityId: "",
    },
  });
  
  // Update form values when user data is loaded
  useEffect(() => {
    if (user) {
      form.reset({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
        whatsapp: user.whatsapp || "",
        telegram: user.telegram || "",
        position: user.position || "",
        role: user.role || "",
        bio: user.bio || "",
        entityId: user.entityId ? String(user.entityId) : "",
      });
    }
  }, [user, form]);
  
  // Handle form submission
  const updateUserMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      setIsSubmitting(true);
      try {
        const response = await apiRequest("PATCH", `/api/users/${id}`, {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone || '',
        whatsapp: data.whatsapp || '',
        telegram: data.telegram || '',
        position: data.position || '',
        role: data.role,
        bio: data.bio || '',
        entityId: data.entityId && data.entityId !== 'none' ? parseInt(data.entityId) : null
      });
        const updatedUser = await response.json();
        return updatedUser;
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "User updated",
        description: "User information has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      navigate("/users");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update user",
        description: error.message || "An error occurred while updating the user.",
        variant: "destructive",
      });
    },
  });
  
  function onSubmit(data: UserFormValues) {
    // Format WhatsApp number properly before submitting
    const formattedData = {
      ...data,
      whatsapp: data.whatsapp ? formatWhatsAppNumber(data.whatsapp) : data.whatsapp
    };
    updateUserMutation.mutate(formattedData);
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Link href="/users">
              <Button variant="ghost" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Users
              </Button>
            </Link>
          </div>
          
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded-md w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded-md"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!user) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Link href="/users">
              <Button variant="ghost" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Users
              </Button>
            </Link>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <h2 className="text-2xl font-semibold mb-2">User Not Found</h2>
                <p className="text-gray-500 mb-6">
                  The user you're trying to edit doesn't exist or you don't have permission to edit it.
                </p>
                <Link href="/users">
                  <Button>Return to Users</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Link href={`/users/${id}`}>
            <Button variant="ghost" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to User Details
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Edit User</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Edit User Profile</CardTitle>
            <CardDescription>
              Update the user's information and settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number (optional)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* CallMeBot WhatsApp Setup Guide */}
                  <CallMeBotSetupGuide />
                  
                  <FormField
                    control={form.control}
                    name="whatsapp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: +551199999999" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter your WhatsApp number with country code (e.g., +551199999999).
                          Your number will be automatically formatted to the required international format.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="telegram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telegram Username</FormLabel>
                        <FormControl>
                          <Input placeholder="@username (without @)" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your Telegram username (without the @ symbol)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter position (optional)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="master_implementer">Master Implementer</SelectItem>
                            <SelectItem value="entity_head">Entity Head</SelectItem>
                            <SelectItem value="entity_member">Entity Member</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="entityId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entity</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an entity (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Entity</SelectItem>
                            {entities.map((entity: any) => (
                              <SelectItem key={entity.id} value={String(entity.id)}>
                                {entity.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The entity this user belongs to.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biography</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter user biography (optional)"
                          className="min-h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        A brief description of the user's background and role.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-4">
                  <Link href={`/users/${id}`}>
                    <Button variant="outline" type="button">Cancel</Button>
                  </Link>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}