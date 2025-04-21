import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import CommunicationsTable from "@/components/dashboard/communications-table";
import SendMessageDialog from "@/components/dialogs/send-message-dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export default function CommunicationsPage() {
  const { t } = useTranslation();
  const [sendMessageOpen, setSendMessageOpen] = useState(false);
  
  // Fetch communications
  const { data: communications, isLoading } = useQuery({
    queryKey: ["/api/communications"],
  });

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-800">{t('communications.title')}</h1>
              <p className="mt-1 text-sm text-neutral-500">
                {t('communications.description')}
              </p>
            </div>
            
            <Button 
              onClick={() => setSendMessageOpen(true)}
              className="flex items-center gap-1"
            >
              <PlusCircle className="h-4 w-4" />
              <span>{t('communications.send_communication')}</span>
            </Button>
          </div>
          
          {/* Communications Table */}
          <CommunicationsTable 
            communications={communications || []} 
            isLoading={isLoading} 
            showViewAction
          />
        </div>
      </div>
      
      {/* Send Message Dialog */}
      <SendMessageDialog 
        open={sendMessageOpen} 
        onOpenChange={setSendMessageOpen} 
      />
    </DashboardLayout>
  );
}
