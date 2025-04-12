import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Mail, Phone, UserCircle, Building, CalendarClock, Shield } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  
  // Fetch user data
  const { data: user, isLoading } = useQuery({
    queryKey: [`/api/users/${id}`],
  });
  
  // Fetch user's entity if they have one
  const { data: userEntity } = useQuery({
    queryKey: [`/api/users/${id}/entity`],
    enabled: !!id
  });
  
  // Format role name for display
  const formatRoleName = (role: string) => {
    switch (role) {
      case 'master_implementer':
        return "Master Implementer";
      case 'entity_head':
        return "Entity Head";
      case 'entity_member':
        return "Entity Member";
      default:
        return role;
    }
  };
  
  // Get badge color based on role
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'master_implementer':
        return "bg-purple-100 text-purple-800 border-purple-300";
      case 'entity_head':
        return "bg-blue-100 text-blue-800 border-blue-300";
      case 'entity_member':
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

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
            <div className="h-40 bg-gray-200 rounded-md"></div>
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
                <UserCircle className="h-16 w-16 text-gray-400 mb-4" />
                <h2 className="text-2xl font-semibold mb-2">User Not Found</h2>
                <p className="text-gray-500 mb-6">
                  The user you're looking for doesn't exist or you don't have permission to view it.
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
  
  const createdAt = user.createdAt ? new Date(user.createdAt) : null;
  const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href="/users">
              <Button variant="ghost" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Users
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">User Profile</h1>
          </div>
          
          <Link href={`/users/${id}/edit`}>
            <Button>Edit User</Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User info card */}
          <Card className="md:col-span-1">
            <CardHeader className="text-center pb-2">
              <div className="flex flex-col items-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarFallback className="text-2xl">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">{user.fullName}</CardTitle>
                <Badge className={`mt-2 ${getRoleBadgeColor(user.role)}`}>
                  {formatRoleName(user.role)}
                </Badge>
                {userEntity && (
                  <div className="mt-3">
                    <Badge variant="outline" className="bg-neutral-50">
                      <Building className="h-3 w-3 mr-1" />
                      {userEntity.name}
                    </Badge>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Separator className="my-4" />
              <div className="space-y-4">
                <div className="flex items-start">
                  <Mail className="h-5 w-5 mr-3 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Phone className="h-5 w-5 mr-3 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-gray-500">{user.phone || "Not provided"}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <UserCircle className="h-5 w-5 mr-3 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Username</p>
                    <p className="text-sm text-gray-500">{user.username}</p>
                  </div>
                </div>
                
                {user.position && (
                  <div className="flex items-start">
                    <Building className="h-5 w-5 mr-3 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Position</p>
                      <p className="text-sm text-gray-500">{user.position}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* User details and activity */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {createdAt && (
                      <div className="flex items-start">
                        <CalendarClock className="h-5 w-5 mr-3 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Account Created</p>
                          <p className="text-sm text-gray-500">{format(createdAt, 'PPP')}</p>
                        </div>
                      </div>
                    )}
                    
                    {lastLogin && (
                      <div className="flex items-start">
                        <CalendarClock className="h-5 w-5 mr-3 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Last Login</p>
                          <p className="text-sm text-gray-500">{format(lastLogin, 'PPP pp')}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start">
                      <Shield className="h-5 w-5 mr-3 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Access Level</p>
                        <p className="text-sm text-gray-500">{formatRoleName(user.role)}</p>
                      </div>
                    </div>
                  </div>
                  
                  {user.bio && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <h3 className="text-sm font-medium mb-2">Biography</h3>
                        <p className="text-sm text-gray-500 whitespace-pre-line">{user.bio}</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {user.badges && user.badges.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Badges</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {user.badges.map((badge: any) => (
                      <Badge key={badge.id} variant="secondary" className="px-3 py-1">
                        {badge.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}