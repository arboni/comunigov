import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { ArrowLeft, Building, User, Mail, Phone, Globe, MapPin, PlusCircle, PenSquare, UserPlus } from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import EditEntityDialog from "@/components/dialogs/edit-entity-dialog";
import CreateMemberDialog from "@/components/dialogs/create-member-dialog";
import EditMemberDialog from "@/components/dialogs/edit-member-dialog";

export default function EntityDetailPage() {
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const [editEntityOpen, setEditEntityOpen] = useState(false);
  const [createMemberOpen, setCreateMemberOpen] = useState(false);
  const [editMemberOpen, setEditMemberOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  
  // Get the current user
  const { data: user } = useQuery({
    queryKey: ["/api/user"]
  });

  // Fetch entity details
  const { data: entity, isLoading } = useQuery({
    queryKey: [`/api/entities/${id}`],
  });

  // Fetch entity members
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: [`/api/entities/${id}/users`],
    enabled: !!entity
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex items-center mb-6">
              <Link href="/entities">
                <Button variant="ghost" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Entities
                </Button>
              </Link>
            </div>
            
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="animate-pulse">
                <div className="h-8 bg-neutral-200 rounded w-1/3 mx-auto mb-4"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/2 mx-auto mb-8"></div>
                <div className="h-24 bg-neutral-200 rounded mb-4"></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-12 bg-neutral-200 rounded"></div>
                  <div className="h-12 bg-neutral-200 rounded"></div>
                  <div className="h-12 bg-neutral-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!entity) {
    return (
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex items-center mb-6">
              <Link href="/entities">
                <Button variant="ghost" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Entities
                </Button>
              </Link>
            </div>
            
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <h1 className="text-2xl font-semibold text-neutral-800 mb-2">Entity Not Found</h1>
              <p className="text-neutral-500 mb-6">
                The entity you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <Link href="/entities">
                <Button>Return to Entities</Button>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  // Function to format the entity type for display
  const formatEntityType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Header with back button and edit button */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Link href="/entities">
                <Button variant="ghost" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Entities
                </Button>
              </Link>
              
              <div>
                <h1 className="text-2xl font-semibold text-neutral-800">{entity.name}</h1>
                <p className="text-neutral-500">{formatEntityType(entity.type)}</p>
              </div>
            </div>
            
            {user?.role === 'master_implementer' && (
              <Button 
                onClick={() => setEditEntityOpen(true)}
                variant="outline"
                className="flex items-center gap-1"
              >
                Edit Entity
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Building className="h-5 w-5 mr-2" />
                    Entity Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-1">Entity Type</h3>
                      <Badge variant="outline">{formatEntityType(entity.type)}</Badge>
                    </div>
                    
                    {entity.tags && entity.tags.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500 mb-1">Tags</h3>
                        <div className="flex flex-wrap gap-1">
                          {entity.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-1">Contact Information</h3>
                      {entity.phone && (
                        <div className="flex items-center text-sm text-neutral-700 mb-2">
                          <Phone className="h-4 w-4 mr-2 text-neutral-500" />
                          <span>{entity.phone}</span>
                        </div>
                      )}
                      {entity.website && (
                        <div className="flex items-center text-sm text-neutral-700 mb-2">
                          <Globe className="h-4 w-4 mr-2 text-neutral-500" />
                          <a 
                            href={entity.website.startsWith('http') ? entity.website : `https://${entity.website}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {entity.website}
                          </a>
                        </div>
                      )}
                      {entity.address && (
                        <div className="flex items-center text-sm text-neutral-700">
                          <MapPin className="h-4 w-4 mr-2 text-neutral-500" />
                          <span>{entity.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <User className="h-5 w-5 mr-2" />
                    Entity Head
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center mb-4">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarFallback className="bg-primary-100 text-primary">
                        {entity.headName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-neutral-800">{entity.headName}</p>
                      <p className="text-sm text-neutral-500">{entity.headPosition}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm text-neutral-700">
                    <Mail className="h-4 w-4 mr-2 text-neutral-500" />
                    <a 
                      href={`mailto:${entity.headEmail}`} 
                      className="text-primary hover:underline"
                    >
                      {entity.headEmail}
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-3">
              <Tabs defaultValue="members">
                <TabsList className="w-full border-b">
                  <TabsTrigger value="members">Members</TabsTrigger>
                  <TabsTrigger value="meetings">Meetings</TabsTrigger>
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                </TabsList>
                
                <TabsContent value="members" className="pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Entity Members</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingMembers ? (
                        <div className="animate-pulse space-y-2">
                          <div className="h-10 bg-neutral-100 rounded"></div>
                          <div className="h-10 bg-neutral-100 rounded"></div>
                          <div className="h-10 bg-neutral-100 rounded"></div>
                        </div>
                      ) : members.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-neutral-500">No members found for this entity.</p>
                        </div>
                      ) : (
                        <ul className="space-y-3">
                          {members.map((member: any) => (
                            <li key={member.id} className="flex items-center justify-between p-3 rounded-md bg-neutral-50">
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8 mr-3">
                                  <AvatarFallback className="bg-primary-100 text-primary">
                                    {member.fullName?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-neutral-800">{member.fullName}</p>
                                  <p className="text-xs text-neutral-500">{member.position || 'No position'}</p>
                                </div>
                              </div>
                              <Badge
                                variant={member.role === 'entity_head' ? 'default' : 'outline'}
                                className={member.role === 'entity_head' ? 'bg-primary-100 text-primary' : ''}
                              >
                                {member.role === 'entity_head' ? 'Entity Head' : 'Member'}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="meetings" className="pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Meetings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <p className="text-neutral-500">No meetings associated with this entity yet.</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="tasks" className="pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tasks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <p className="text-neutral-500">No tasks associated with this entity yet.</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
      
      {/* Edit Entity Dialog */}
      <EditEntityDialog 
        open={editEntityOpen} 
        onOpenChange={setEditEntityOpen} 
        entityId={Number(id)}
        entity={entity}
      />
    </DashboardLayout>
  );
}