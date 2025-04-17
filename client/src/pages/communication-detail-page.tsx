import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Mail, Clock, UserIcon, Users, MessageSquare, Bell, Download } from "lucide-react";
import { Link, useParams } from "wouter";
import { format } from "date-fns";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import FilePreview from "@/components/file-preview/file-preview";
import NotFound from "./not-found";

// Define interface for communication with files and recipients
interface CommunicationWithDetails {
  id: number;
  subject: string;
  content: string;
  channel: string;
  sentBy: number;
  sentAt: string;
  files?: Array<{
    id: number;
    name: string;
    type: string;
    filePath: string;
    uploadedAt: string;
  }>;
  recipients?: Array<{
    id: number;
    userId?: number;
    entityId?: number;
    read: boolean;
    readAt?: string;
  }>;
}

function formatChannelName(channel: string): string {
  switch (channel) {
    case "email":
      return "Email";
    case "whatsapp":
      return "WhatsApp";
    case "telegram":
      return "Telegram";
    case "system_notification":
      return "System Notification";
    default:
      return channel;
  }
}

function getChannelIcon(channel: string) {
  switch (channel) {
    case "email":
      return <Mail className="h-4 w-4 mr-1" />;
    case "whatsapp":
      return <MessageSquare className="h-4 w-4 mr-1" />;
    case "telegram":
      return <MessageSquare className="h-4 w-4 mr-1" />;
    case "system_notification":
      return <Bell className="h-4 w-4 mr-1" />;
    default:
      return <Mail className="h-4 w-4 mr-1" />;
  }
}

export default function CommunicationDetailPage() {
  // Get the ID from URL parameters
  const params = useParams();
  const id = params?.id ? parseInt(params.id) : null;

  // Fetch communication data
  const { data: communication, isLoading, error } = useQuery<CommunicationWithDetails>({
    queryKey: [`/api/communications/${id}`],
    enabled: id !== null,
  });

  // Fetch sender data
  const { data: sender } = useQuery<{ id: number; username: string; email: string; fullName?: string }>({
    queryKey: [`/api/users/${communication?.sentBy}`],
    enabled: !!communication?.sentBy,
  });

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex items-center mb-6">
              <Button variant="ghost" className="mr-2" asChild>
                <Link href="/communications">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Link>
              </Button>
              <Skeleton className="h-8 w-64" />
            </div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-10 w-3/4" />
                <div className="flex flex-wrap gap-2 mt-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state or not found
  if (error || !communication) {
    return <NotFound />;
  }

  // Format sent date
  const sentDate = new Date(communication.sentAt);
  const formattedDate = format(sentDate, "MMMM d, yyyy 'at' h:mm a");

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Back button and title */}
          <div className="flex items-center mb-6">
            <Button variant="ghost" className="mr-2" asChild>
              <Link href="/communications">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Communications
              </Link>
            </Button>
          </div>

          {/* Communication card */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <span className="flex items-center">
                      {getChannelIcon(communication.channel)}
                      {formatChannelName(communication.channel)}
                    </span>
                    <span className="mx-2">•</span>
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {formattedDate}
                    </span>
                  </div>
                  <CardTitle className="mt-2 text-2xl font-bold">{communication.subject}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Sender info */}
              <div className="flex items-center mb-6">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarFallback>
                    {sender?.fullName?.[0] || sender?.username?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{sender?.fullName || sender?.username || "Unknown User"}</div>
                  <div className="text-sm text-muted-foreground">
                    {sender?.email || "No email available"}
                  </div>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              {/* Message content */}
              <div className="prose prose-neutral max-w-none whitespace-pre-wrap">
                {communication.content}
              </div>
              
              {/* Attachments, if any */}
              {communication.files && communication.files.length > 0 && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <h3 className="text-lg font-medium mb-3">Attachments</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {communication.files.map((file) => (
                        <div 
                          key={file.id} 
                          className="flex items-center p-3 rounded-md border border-gray-200 group hover:border-primary"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{file.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(file.uploadedAt).toLocaleDateString()}
                              {file.type && <span className="ml-2 text-xs px-2 py-1 bg-gray-100 rounded">{file.type}</span>}
                            </div>
                          </div>
                          <FilePreview
                            fileId={file.id}
                            fileName={file.name}
                            fileType={file.type}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              {/* Recipients */}
              {communication.recipients && communication.recipients.length > 0 && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <h3 className="text-lg font-medium mb-3 flex items-center">
                      <Users className="h-5 w-5 mr-1" />
                      Recipients
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {communication.recipients.map((recipient) => (
                        <div 
                          key={recipient.id} 
                          className="flex items-center p-3 rounded-md border border-gray-200"
                        >
                          <div className="flex-1">
                            <div className="flex items-center">
                              <UserIcon className="h-4 w-4 mr-1 text-muted-foreground" />
                              <span>
                                {recipient.userId ? "User" : recipient.entityId ? "Entity" : "External"}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {recipient.read 
                                ? `Read on ${new Date(recipient.readAt || "").toLocaleString()}` 
                                : "Not read yet"}
                            </div>
                          </div>
                          {recipient.read ? (
                            <Badge variant="outline" className="bg-emerald-100 text-emerald-800">Read</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-100 text-amber-800">Unread</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}