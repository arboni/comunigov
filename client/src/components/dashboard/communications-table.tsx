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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

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

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-neutral-50">
          <TableRow>
            <TableHead className="w-1/4">{t('communications.subject')}</TableHead>
            <TableHead>{t('communications.recipients')}</TableHead>
            <TableHead>{t('communications.channel')}</TableHead>
            <TableHead>{t('communications.date')}</TableHead>
            <TableHead>{t('communications.status')}</TableHead>
            {showViewAction && <TableHead className="text-right">{t('communications.actions')}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={showViewAction ? 6 : 5} className="text-center py-8">
                {t('communications.loading')}
              </TableCell>
            </TableRow>
          ) : communications.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showViewAction ? 6 : 5} className="text-center py-8">
                {t('communications.no_communications')}
              </TableCell>
            </TableRow>
          ) : (
            communications.map((comm) => {
              const sentDate = new Date(comm.sentAt);
              const formattedDate = isValid(sentDate) 
                ? format(sentDate, "MMMM d, yyyy") 
                : t('communications.unknown_date');
              
              // In a real application, you would calculate this from the recipients data
              const readStatus = Math.random() > 0.5 
                ? <Badge variant="outline" className="bg-emerald-100 text-emerald-800">{t('communications.status.all_read')}</Badge>
                : <Badge variant="outline" className="bg-amber-100 text-amber-800">{t('communications.status.partially_read')}</Badge>;
              
              return (
                <TableRow key={comm.id}>
                  <TableCell className="font-medium">{comm.subject}</TableCell>
                  <TableCell className="text-neutral-500">
                    {/* In a real app, you would fetch and display recipient details */}
                    {t('communications.multiple_recipients')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-neutral-500">
                      {getChannelIcon(comm.channel)}
                      {t(`communications.channel_types.${comm.channel}`)}
                    </div>
                  </TableCell>
                  <TableCell className="text-neutral-500">{formattedDate}</TableCell>
                  <TableCell>{readStatus}</TableCell>
                  {showViewAction && (
                    <TableCell className="text-right">
                      <a href={`/communications/${comm.id}`} className="text-primary hover:text-primary-600">
                        {t('communications.view')}
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
