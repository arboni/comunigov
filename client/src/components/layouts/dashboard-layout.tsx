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
  X
} from "lucide-react";
import Sidebar from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import AvatarWithInitials from "@/components/ui/avatar-with-initials";
import { useAuth } from "@/hooks/fixed-use-auth";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const navigationItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Entity Management", href: "/entities", icon: Building2 },
    { name: "Communications", href: "/communications", icon: SendHorizonal },
    { name: "Meetings", href: "/meetings", icon: Calendar },
    { name: "Tasks", href: "/tasks", icon: ListChecks },
    { name: "Users", href: "/users", icon: Users },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Close mobile sidebar when location changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar items={navigationItems} user={user} />
      
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
                        {user.role === 'master_implementer' ? 'Master Implementer' :
                         user.role === 'entity_head' ? 'Entity Head' : 'Entity Member'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Navigation */}
              <nav className="mt-2 px-2 space-y-1">
                {navigationItems.map(item => (
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
                Logout
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
                  <AvatarWithInitials 
                    name={user.fullName}
                    className="h-8 w-8 bg-primary-100 text-primary border-none cursor-pointer"
                  />
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
