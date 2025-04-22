import React from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { AlertTriangleIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/hooks/use-translation";

export default function CallMeBotReminder() {
  const { t } = useTranslation();
  
  // Function to open WhatsApp with the predefined message
  const openWhatsApp = () => {
    const phone = "34644660195"; // CallMeBot number without + sign
    const message = "I allow callmebot to send me messages";
    const whatsappURL = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, '_blank');
  };

  return (
    <Alert className="bg-amber-50 border-amber-200 mb-6">
      <AlertTriangleIcon className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-700 font-semibold text-sm">{t('callmebot.notice_title')}</AlertTitle>
      <AlertDescription className="text-sm mt-2">
        <p className="mb-2">
          <strong>{t('callmebot.before_recipients')}</strong>, {t('callmebot.recipients_must')}:
        </p>
        
        <ol className="list-decimal pl-5 mb-3 space-y-1">
          <li>{t('callmebot.step1')}</li>
          <li>
            {t('callmebot.step2_prefix')} <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-200">I allow callmebot to send me messages</span> {t('callmebot.step2_suffix')}
            <span className="font-semibold"> +34 644 66 01 95</span> {t('callmebot.via_whatsapp')}
          </li>
          <li>{t('callmebot.step3')}</li>
        </ol>
        
        <Button 
          onClick={openWhatsApp}
          className="bg-green-600 hover:bg-green-700 text-white my-2"
          size="sm"
        >
          {t('callmebot.open_whatsapp')} <ExternalLink className="ml-2 h-3 w-3" />
        </Button>
        
        <Separator className="my-3 bg-amber-200" />
        
        <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-md mt-2">
          <h4 className="font-semibold mb-2 text-amber-800">{t('callmebot.troubleshooting')}:</h4>
          <ul className="list-disc pl-5 space-y-1 text-amber-700">
            <li>{t('callmebot.tip1')}</li>
            <li>{t('callmebot.tip2')}</li>
            <li>{t('callmebot.tip3')}</li>
          </ul>
        </div>
        
        <p className="text-xs text-amber-700 mt-3">
          {t('callmebot.requirement_notice')}
        </p>
      </AlertDescription>
    </Alert>
  );
}