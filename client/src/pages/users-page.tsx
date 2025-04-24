import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserCircle, Search, Eye, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { AddUserDialog } from "@/components/dialogs/add-user-dialog";
import { useTranslation } from "@/hooks/use-translation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function UsersPage() {
  const { t } = useTranslation();
  const { user: currentUser } = useSimpleAuth();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch users data
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
  });
  
  // Fetch entities for the add user dialog
  const { data: entities = [], isLoading: isLoadingEntities } = useQuery({
    queryKey: ["/api/entities"],
  });
  
  // Filter users based on search term
  const filteredUsers = Array.isArray(users) 
    ? users.filter((user: any) => 
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];
  
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
  
  // Format role name for display
  const formatRoleName = (role: string) => {
    switch (role) {
      case 'master_implementer':
        return t("users.roles.master_implementer");
      case 'entity_head':
        return t("users.roles.entity_head");
      case 'entity_member':
        return t("users.roles.entity_member");
      default:
        return role;
    }
  };
  
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{t("users.title")}</h1>
          
          {currentUser?.role === 'master_implementer' && (
            <AddUserDialog entities={entities} />
          )}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{t("users.all_users")}</CardTitle>
            <CardDescription>
              {t("users.manage_description")}
            </CardDescription>
            
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("users.search_placeholder")}
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoadingUsers ? (
              <div className="flex justify-center items-center h-40">
                <p className="text-muted-foreground">{t("common.loading")}</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <UserCircle className="h-12 w-12 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">{t("users.no_users_found")}</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? t("users.try_different_search") : t("users.no_users_registered")}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("users.full_name")}</TableHead>
                      <TableHead>{t("users.username")}</TableHead>
                      <TableHead>{t("users.email")}</TableHead>
                      <TableHead>{t("users.role")}</TableHead>
                      <TableHead>{t("users.entity")}</TableHead>
                      <TableHead>{t("users.phone")}</TableHead>
                      <TableHead>{t("common.actions")}</TableHead>
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
                        <TableCell>
                          {user.entity ? (
                            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20">
                              {user.entity.name}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>{user.phone || "—"}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                    <Link href={`/users/${user.id}`}>
                                      <Eye className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t("users.view_details")}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                    <Link href={`/users/${user.id}/edit`}>
                                      <Pencil className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t("users.edit_user")}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
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