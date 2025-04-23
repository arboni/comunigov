import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Components
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/ui/container";
import { Separator } from "@/components/ui/separator";
import { Check, Lock } from "lucide-react";

// Utils and services
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTranslation } from "@/hooks/use-translation";

// Form schema validation
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, { message: "A senha atual é obrigatória" }),
  newPassword: z.string().min(6, { message: "A nova senha deve ter pelo menos 6 caracteres" }),
  confirmPassword: z.string().min(6, { message: "A confirmação de senha é obrigatória" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

export default function ChangePasswordPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  // Query to check if the user needs to change password
  const { data: passwordStatus, isLoading: isStatusLoading } = useQuery({
    queryKey: ["/api/user/password-status"],
    // If this fails, we want to redirect to auth
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/user/password-status");
        return await res.json();
      } catch (error) {
        setLocation("/auth");
        return { requirePasswordChange: false };
      }
    }
  });

  // Form setup
  const form = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Mutation for changing password
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("POST", "/api/user/change-password", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/password-status"] });
      
      toast({
        title: t("password.changeSuccess.title"),
        description: t("password.changeSuccess.description"),
        variant: "success",
      });
      
      // Redirect to dashboard
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: t("password.changeError.title"),
        description: error.message || t("password.changeError.description"),
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = async (data: PasswordChangeFormData) => {
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  // If not first login and not explicitly requested, redirect to dashboard
  if (!isStatusLoading && !passwordStatus?.requirePasswordChange) {
    // If the user doesn't need to change their password, redirect to the dashboard
    setLocation("/");
    return null;
  }

  return (
    <Container className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {t("password.change.title")}
          </CardTitle>
          <CardDescription>
            {t("password.change.description")}
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("password.change.currentPassword")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("password.change.currentPasswordPlaceholder")}
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("password.change.currentPasswordHelp")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("password.change.newPassword")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("password.change.newPasswordPlaceholder")}
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("password.change.newPasswordHelp")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("password.change.confirmPassword")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("password.change.confirmPasswordPlaceholder")}
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending ? (
                    <span className="flex items-center">
                      <Lock className="mr-2 h-4 w-4 animate-pulse" />
                      {t("password.change.processing")}
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Check className="mr-2 h-4 w-4" />
                      {t("password.change.submit")}
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          {t("password.change.footer")}
        </CardFooter>
      </Card>
    </Container>
  );
}