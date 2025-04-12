import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserCircle, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSimpleAuth } from "@/hooks/use-simple-auth";

export default function UsersPage() {
  const { user: currentUser } = useSimpleAuth();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/users"],
  });
  
  const filteredUsers = users ? users.filter((user: any) => 
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];
  
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
  
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Users</h1>
          
          {currentUser?.role === 'master_implementer' && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New User
            </Button>
          )}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              Manage and view all registered users in the system.
            </CardDescription>
            
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name, email or username..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <UserCircle className="h-12 w-12 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No users found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "Try a different search term" : "There are no users registered in the system"}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Phone</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.fullName}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {formatRoleName(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.phone || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}