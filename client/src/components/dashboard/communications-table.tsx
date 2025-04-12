import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Communication } from "@shared/schema";
import { format, isValid } from "date-fns";
import { Mail, MessageSquare, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CommunicationsTableProps {
  communications: Communication[];
  isLoading: boolean;
  showViewAction?: boolean;
}

export default function CommunicationsTable({
  communications,
  isLoading,
  showViewAction = false,
}: CommunicationsTableProps) {
  // Helper to get channel icon
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email":
        return <Mail className="mr-2 h-4 w-4" />;
      case "whatsapp":
      case "telegram":
        return <MessageSquare className="mr-2 h-4 w-4" />;
      case "system_notification":
        return <Bell className="mr-2 h-4 w-4" />;
      default:
        return <Mail className="mr-2 h-4 w-4" />;
    }
  };

  // Helper to format channel name
  const formatChannelName = (channel: string) => {
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
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-neutral-50">
          <TableRow>
            <TableHead className="w-1/4">Subject</TableHead>
            <TableHead>Recipients</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            {showViewAction && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={showViewAction ? 6 : 5} className="text-center py-8">
                Loading communications...
              </TableCell>
            </TableRow>
          ) : communications.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showViewAction ? 6 : 5} className="text-center py-8">
                No communications found
              </TableCell>
            </TableRow>
          ) : (
            communications.map((comm) => {
              const sentDate = new Date(comm.sentAt);
              const formattedDate = isValid(sentDate) 
                ? format(sentDate, "MMMM d, yyyy") 
                : "Unknown date";
              
              // In a real application, you would calculate this from the recipients data
              const readStatus = Math.random() > 0.5 
                ? <Badge variant="outline" className="bg-emerald-100 text-emerald-800">All Read</Badge>
                : <Badge variant="outline" className="bg-amber-100 text-amber-800">Partially Read</Badge>;
              
              return (
                <TableRow key={comm.id}>
                  <TableCell className="font-medium">{comm.subject}</TableCell>
                  <TableCell className="text-neutral-500">
                    {/* In a real app, you would fetch and display recipient details */}
                    Multiple Recipients
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-neutral-500">
                      {getChannelIcon(comm.channel)}
                      {formatChannelName(comm.channel)}
                    </div>
                  </TableCell>
                  <TableCell className="text-neutral-500">{formattedDate}</TableCell>
                  <TableCell>{readStatus}</TableCell>
                  {showViewAction && (
                    <TableCell className="text-right">
                      <a href={`/communications/${comm.id}`} className="text-primary hover:text-primary-600">
                        View
                      </a>
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
