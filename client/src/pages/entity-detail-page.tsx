import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { ArrowLeft, Building, User, Mail, Phone, Globe, MapPin, PlusCircle, PenSquare, UserPlus, FileUp } from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect } from "react";
import EditEntityDialog from "@/components/dialogs/edit-entity-dialog";
import CreateMemberDialog from "@/components/dialogs/create-member-dialog";
import EditMemberDialog from "@/components/dialogs/edit-member-dialog";
import { useTranslation } from "react-i18next";
import { fixEncoding, getEntityTypeDisplay } from "@/lib/utils";

export default function EntityDetailPage() {
  const { t } = useTranslation();
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
  const { data: members = [], isLoading: loadingMembers, refetch: refetchMembers } = useQuery({
    queryKey: [`/api/entities/${id}/users`],
    enabled: !!entity
  });
  
  // Refetch members when the component mounts (for when returning from import pages)
  useEffect(() => {
    if (entity) {
      refetchMembers();
    }
  }, [refetchMembers, entity]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex items-center mb-6">
              <Link href="/entities">
                <Button variant="ghost" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t("entities.back_to_entities")}
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
                  {t("entities.back_to_entities")}
                </Button>
              </Link>
            </div>
            
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <h1 className="text-2xl font-semibold text-neutral-800 mb-2">{t("entities.entity_not_found")}</h1>
              <p className="text-neutral-500 mb-6">
                {t("entities.entity_not_found_message")}
              </p>
              <Link href="/entities">
                <Button>{t("entities.return_to_entities")}</Button>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  // Fix encoding in entity data
  const fixedEntity = entity ? {
    ...entity,
    name: fixEncoding(entity.name),
    headName: fixEncoding(entity.headName),
    headPosition: fixEncoding(entity.headPosition),
    address: fixEncoding(entity.address),
    socialMedia: fixEncoding(entity.socialMedia)
  } : null;
  
  // Function to get the translated entity type with encoding fix
  const getTranslatedEntityType = (type: string) => {
    // Try using the translation first
    const translatedType = t(`entities.types.${type}`);
    
    // If the translation key wasn't found (returns the key itself), use our utility function
    if (translatedType === `entities.types.${type}`) {
      return getEntityTypeDisplay(type);
    }
    
    return translatedType;
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
                  {t("entities.return_to_entities")}
                </Button>
              </Link>
              
              <div>
                <h1 className="text-2xl font-semibold text-neutral-800">{fixedEntity?.name}</h1>
                <p className="text-neutral-500">{getTranslatedEntityType(fixedEntity?.type || '')}</p>
              </div>
            </div>
            
            {user?.role === 'master_implementer' && (
              <Button 
                onClick={() => setEditEntityOpen(true)}
                variant="outline"
                className="flex items-center gap-1"
              >
                {t("entities.edit_entity")}
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Building className="h-5 w-5 mr-2" />
                    {t("entities.entity_overview")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-1">{t("entities.entity_type")}</h3>
                      <Badge variant="outline">{getTranslatedEntityType(fixedEntity?.type || '')}</Badge>
                    </div>
                    
                    {fixedEntity?.tags && fixedEntity.tags.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500 mb-1">{t("entities.tags")}</h3>
                        <div className="flex flex-wrap gap-1">
                          {fixedEntity.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-1">{t("entities.contact_information")}</h3>
                      {fixedEntity?.phone && (
                        <div className="flex items-center text-sm text-neutral-700 mb-2">
                          <Phone className="h-4 w-4 mr-2 text-neutral-500" />
                          <span>{fixedEntity.phone}</span>
                        </div>
                      )}
                      {fixedEntity?.website && (
                        <div className="flex items-center text-sm text-neutral-700 mb-2">
                          <Globe className="h-4 w-4 mr-2 text-neutral-500" />
                          <a 
                            href={fixedEntity.website.startsWith('http') ? fixedEntity.website : `https://${fixedEntity.website}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {fixedEntity.website}
                          </a>
                        </div>
                      )}
                      {fixedEntity?.address && (
                        <div className="flex items-center text-sm text-neutral-700">
                          <MapPin className="h-4 w-4 mr-2 text-neutral-500" />
                          <span>{fixedEntity.address}</span>
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
                    {t("entities.entity_head")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center mb-4">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarFallback className="bg-primary-100 text-primary">
                        {fixedEntity?.headName?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-neutral-800">{fixedEntity?.headName}</p>
                      <p className="text-sm text-neutral-500">{fixedEntity?.headPosition}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm text-neutral-700">
                    <Mail className="h-4 w-4 mr-2 text-neutral-500" />
                    <a 
                      href={`mailto:${fixedEntity?.headEmail}`} 
                      className="text-primary hover:underline"
                    >
                      {fixedEntity?.headEmail}
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-3">
              <Tabs defaultValue="members">
                <TabsList className="w-full border-b">
                  <TabsTrigger value="members">{t("entities.members.title")}</TabsTrigger>
                  <TabsTrigger value="meetings">{t("meetings.title")}</TabsTrigger>
                  <TabsTrigger value="tasks">{t("tasks.title")}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="members" className="pt-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>{t("entities.members.title")}</CardTitle>
                      {(user?.role === 'master_implementer' || user?.role === 'entity_head') && (
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center"
                            onClick={() => setLocation(`/entities/${id}/members/import`)}
                          >
                            <FileUp className="h-4 w-4 mr-1" />
                            {t("entities.members.import_members")}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center"
                            onClick={() => setCreateMemberOpen(true)}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            {t("entities.members.add_member")}
                          </Button>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      {loadingMembers ? (
                        <div className="animate-pulse space-y-2">
                          <div className="h-10 bg-neutral-100 rounded"></div>
                          <div className="h-10 bg-neutral-100 rounded"></div>
                          <div className="h-10 bg-neutral-100 rounded"></div>
                        </div>
                      ) : members.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-neutral-500 mb-4">{t("entities.members.no_members")}</p>
                          {(user?.role === 'master_implementer' || user?.role === 'entity_head') && (
                            <Button 
                              onClick={() => setCreateMemberOpen(true)}
                              className="flex items-center gap-1"
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              {t("entities.members.add_first_member")}
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{t("entities.members.table.member")}</TableHead>
                                <TableHead>{t("entities.members.table.role")}</TableHead>
                                <TableHead>{t("entities.members.table.contact")}</TableHead>
                                {(user?.role === 'master_implementer' || user?.role === 'entity_head') && (
                                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                                )}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {members.map((member: any) => (
                                <TableRow key={member.id}>
                                  <TableCell>
                                    <div className="flex items-center">
                                      <Avatar className="h-8 w-8 mr-3">
                                        <AvatarFallback className="bg-primary-100 text-primary">
                                          {member.fullName?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium text-neutral-800">{member.fullName}</p>
                                        <p className="text-xs text-neutral-500">{member.position || t("entities.members.no_position")}</p>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={member.role === 'entity_head' ? 'default' : 'outline'}
                                      className={member.role === 'entity_head' ? 'bg-primary-100 text-primary' : ''}
                                    >
                                      {member.role === 'entity_head' ? t("roles.entity_head") : t("roles.member")}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-1">
                                      <div className="flex items-center text-xs text-neutral-700">
                                        <Mail className="h-3 w-3 mr-1 text-neutral-400" />
                                        <span>{member.email}</span>
                                      </div>
                                      {member.phone && (
                                        <div className="flex items-center text-xs text-neutral-700">
                                          <Phone className="h-3 w-3 mr-1 text-neutral-400" />
                                          <span>{member.phone}</span>
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  {(user?.role === 'master_implementer' || user?.role === 'entity_head') && (
                                    <TableCell className="text-right">
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => {
                                          setSelectedMember(member);
                                          setEditMemberOpen(true);
                                        }}
                                      >
                                        <PenSquare className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  )}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="meetings" className="pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("meetings.title")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <p className="text-neutral-500">{t("meetings.no_meetings_for_entity")}</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="tasks" className="pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("tasks.title")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <p className="text-neutral-500">{t("tasks.no_tasks_for_entity")}</p>
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
        entity={fixedEntity || entity}
      />
      
      {/* Create Member Dialog */}
      <CreateMemberDialog
        open={createMemberOpen}
        onOpenChange={setCreateMemberOpen}
        entityId={Number(id)}
      />
      
      {/* Edit Member Dialog */}
      {selectedMember && (
        <EditMemberDialog
          open={editMemberOpen}
          onOpenChange={setEditMemberOpen}
          entityId={Number(id)}
          member={selectedMember}
        />
      )}
    </DashboardLayout>
  );
}