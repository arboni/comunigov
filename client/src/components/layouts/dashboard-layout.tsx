import { useEffect, ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Building2, 
  SendHorizonal, 
  Calendar, 
  ListChecks, 
  Users,
  Settings,
  Menu,
  Bell,
  X,
  FileText,
  BarChart3,
  LogOut
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import AvatarWithInitials from "@/components/ui/avatar-with-initials";
import { toast } from "@/hooks/use-toast";
import { UserWithEntity } from "@shared/schema";
import { useTranslation } from "@/hooks/use-translation";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { t } = useTranslation();

  // Get the current user
  const { data: user } = useQuery<Omit<UserWithEntity, "password"> | null>({
    queryKey: ["/api/user"],
    // Use default query function which will return null on 401
    retry: false
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await apiRequest("POST", "/api/logout");
        return true;
      } catch (error) {
        console.error("Logout error:", error);
        return false;
      }
    },
    onSuccess: () => {
      // Set user data to null in the cache
      queryClient.setQueryData(["/api/user"], null);
      
      // Clear all cached data to ensure clean state after logout
      queryClient.clear();
      
      toast({
        title: t('auth.logout_success'),
        description: t('auth.logout_success_message')
      });
      
      // Force navigation to auth page
      setTimeout(() => {
        window.location.href = "/auth";
      }, 100);
    },
    onError: () => {
      // Even if the API call fails, we'll still log the user out on the client side
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
      
      toast({
        title: t('auth.logout_success'),
        description: t('auth.logout_success_message')
      });
      
      // Force navigation to auth page
      setTimeout(() => {
        window.location.href = "/auth";
      }, 100);
    },
  });

  // Function to determine if the current user has access to a specific section
  const hasAccessToSection = (section: string): boolean => {
    if (!user) return false;

    // Master implementer has access to everything
    if (user.role === 'master_implementer') return true;

    switch (section) {
      case 'dashboard':
        return true; // Everyone has access to dashboard
      case 'entities':
        return true; // Everyone has access to entities view (they'll see only their entities)
      case 'entities_import':
        return user.role === 'master_implementer'; // Only admin can import entities
      case 'communications':
        return true; // Everyone has access to communications (they'll see only their communications)
      case 'meetings':
        return true; // Everyone has access to meetings (they'll see only their meetings)
      case 'tasks':
        return true; // Everyone has access to tasks (they'll see only their tasks)
      case 'subjects':
        return true; // Everyone has access to subjects (they'll see only their subjects)
      case 'analytics':
        return user.role === 'master_implementer' || user.role === 'entity_head'; // Only admin and entity heads have access to analytics
      case 'users':
        return user.role === 'master_implementer' || user.role === 'entity_head'; // Only admin and entity heads can manage users
      case 'settings':
        return true; // Everyone has access to settings page
      default:
        return false;
    }
  };

  const navigationItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, section: 'dashboard' },
    { name: t('navigation.entities'), href: "/entities", icon: Building2, section: 'entities' },
    { name: t('entities.import.title'), href: "/entities/import", icon: FileText, section: 'entities_import' },
    { name: t('navigation.communications'), href: "/communications", icon: SendHorizonal, section: 'communications' },
    { name: t('navigation.meetings'), href: "/meetings", icon: Calendar, section: 'meetings' },
    { name: t('navigation.tasks'), href: "/tasks", icon: ListChecks, section: 'tasks' },
    { name: t('navigation.subjects'), href: "/subjects", icon: FileText, section: 'subjects' },
    { name: t('navigation.analytics'), href: "/analytics", icon: BarChart3, section: 'analytics' },
    { name: t('navigation.users'), href: "/users", icon: Users, section: 'users' },
    { name: t('navigation.settings'), href: "/settings", icon: Settings, section: 'settings' },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Close mobile sidebar when location changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location]);

  // Filter navigation items based on user access
  const accessibleNavigationItems = navigationItems.filter(item => 
    hasAccessToSection(item.section)
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar items={accessibleNavigationItems} user={user} onLogout={handleLogout} />
      
      {/* Mobile Sidebar */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-100 bg-white">
              <h1 className="text-xl font-semibold text-primary">ComuniGov</h1>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {/* User profile summary */}
              {user && (
                <div className="px-4 py-4 border-b border-neutral-100">
                  <div className="flex items-center">
                    <AvatarWithInitials
                      name={user.fullName}
                      className="h-10 w-10 bg-primary-100 text-primary"
                    />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-neutral-700">{user.fullName}</p>
                      <p className="text-xs text-neutral-500">
                        {user.role === 'master_implementer' ? t('users.roles.master_implementer') :
                         user.role === 'entity_head' ? t('users.roles.entity_head') : t('users.roles.entity_member')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Navigation */}
              <nav className="mt-2 px-2 space-y-1">
                {accessibleNavigationItems.map(item => (
                  <Link 
                    key={item.name} 
                    href={item.href}
                  >
                    <a 
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        location === item.href
                          ? "border-l-4 border-primary bg-primary-50 text-primary"
                          : "text-neutral-600 hover:bg-neutral-50"
                      }`}
                    >
                      <item.icon 
                        className={`mr-3 h-5 w-5 ${
                          location === item.href ? "text-primary" : "text-neutral-400"
                        }`} 
                      />
                      {item.name}
                    </a>
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className="p-4 border-t border-neutral-100">
              <Button 
                variant="outline" 
                className="w-full justify-start text-neutral-600"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 mr-2" />
                {t('auth.logout')}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden" 
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="ml-2 md:hidden text-primary text-lg font-semibold">ComuniGov</div>
            </div>
            
            <div className="flex items-center">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              </Button>
              
              <div className="ml-4 relative flex-shrink-0">
                {user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="focus:outline-none">
                        <AvatarWithInitials 
                          name={user.fullName}
                          className="h-8 w-8 bg-primary-100 text-primary border-none cursor-pointer"
                        />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.fullName}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                          <Link href="/settings">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>{t('navigation.settings')}</span>
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>{t('auth.logout')}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-neutral-50">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
