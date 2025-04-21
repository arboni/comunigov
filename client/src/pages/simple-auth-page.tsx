import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Building2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTranslation } from "@/hooks/use-translation";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Please enter a valid email address"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  role: z.enum(["master_implementer", "entity_head", "entity_member"]).default("master_implementer"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function SimpleAuthPage() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  
  // Get user data using direct React Query
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
    gcTime: 0
  });

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (user && !isLoading) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      fullName: "",
      role: "master_implementer",
    },
  });

  // Create direct mutations without relying on useAuth
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginFormValues) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (userData) => {
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: t('auth.login_successful'),
        description: t('auth.welcome_back', { name: userData.fullName }),
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: t('auth.login_failed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterFormValues) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (userData) => {
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: t('auth.registration_successful'),
        description: t('auth.welcome', { name: userData.fullName }),
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: t('auth.registration_failed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onLoginSubmit(data: LoginFormValues) {
    loginMutation.mutate(data);
  }

  function onRegisterSubmit(data: RegisterFormValues) {
    registerMutation.mutate(data);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="hidden lg:flex lg:flex-col justify-center">
          <div className="space-y-6 text-center lg:text-left p-4">
            <div className="flex items-center gap-2 justify-center lg:justify-start">
              <Building2 className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold text-primary">ComuniGov</h1>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-neutral-800">Institutional Communication Platform</h2>
              <p className="mt-4 text-lg text-neutral-600">
                A comprehensive solution for institutional communication, 
                meeting scheduling and task management aimed at city halls and public environments.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <div className="p-4 rounded-lg bg-white shadow">
                <h3 className="font-medium text-neutral-800">Hierarchical Registration</h3>
                <p className="text-sm text-neutral-600 mt-2">
                  Create structured organization management with entities, users, and roles.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white shadow">
                <h3 className="font-medium text-neutral-800">Communications</h3>
                <p className="text-sm text-neutral-600 mt-2">
                  Send messages via email, WhatsApp, Telegram, and internal system.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white shadow">
                <h3 className="font-medium text-neutral-800">Meeting Management</h3>
                <p className="text-sm text-neutral-600 mt-2">
                  Schedule meetings with smart attendee selection and follow-ups.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white shadow">
                <h3 className="font-medium text-neutral-800">Task Tracking</h3>
                <p className="text-sm text-neutral-600 mt-2">
                  Assign and track tasks linked to meetings and entities.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">{t('auth.welcome_to_app')}</CardTitle>
              <CardDescription>
                {t('auth.login_or_register')}
              </CardDescription>
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm">
                <p className="font-medium">{t('auth.default_credentials')}:</p>
                <p>{t('auth.username')}: <span className="font-mono">admin</span></p>
                <p>{t('auth.password')}: <span className="font-mono">admin123</span></p>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">{t('auth.login')}</TabsTrigger>
                  <TabsTrigger value="register">{t('auth.register')}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="********" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Logging in..." : "Login"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john.doe@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="johndoe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="********" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? "Registering..." : "Register"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-neutral-500">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}