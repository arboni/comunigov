import { LucideIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import AvatarWithInitials from "@/components/ui/avatar-with-initials";
import { UserWithEntity } from "@shared/schema";

type SidebarItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

type SidebarProps = {
  items: SidebarItem[];
  user: Omit<UserWithEntity, "password"> | null;
};

export function Sidebar({ items, user }: SidebarProps) {
  const [location] = useLocation();

  return (
    <aside className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-neutral-100">
        <div className="flex items-center justify-center h-16 px-4 border-b border-neutral-100 bg-white">
          <h1 className="text-xl font-semibold text-primary">ComuniGov</h1>
        </div>
        
        <div className="h-0 flex-1 flex flex-col overflow-y-auto pt-2 bg-white">
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
            {items.map(item => (
              <Link 
                key={item.name} 
                href={item.href}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                  location === item.href
                    ? "border-l-4 border-primary bg-primary-50 text-primary"
                    : "text-neutral-600 hover:bg-neutral-50"
                )}
              >
                <item.icon 
                  className={cn(
                    "mr-3 h-5 w-5",
                    location === item.href
                      ? "text-primary"
                      : "text-neutral-400"
                  )} 
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
