import React from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { AlertTriangleIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function WhatsAppReminder() {
  // Fetch Twilio WhatsApp number to show in instructions
  const { data: twilioData } = useQuery({
    queryKey: ['/api/twilio-whatsapp-number'],
  });

  return (
    <Alert className="bg-amber-50 border-amber-200 mb-6">
      <AlertTriangleIcon className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-700 font-semibold text-sm">Important WhatsApp Notice</AlertTitle>
      <AlertDescription className="text-sm mt-2">
        <p className="mb-2">
          <strong>Before your recipients can receive WhatsApp messages</strong>, they must each:
        </p>
        
        <ol className="list-decimal pl-5 mb-3 space-y-1">
          <li>Have a WhatsApp number configured in their user profile</li>
          <li>
            Send the message <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-200">join forgotten-clock</span> to 
            <span className="font-semibold">{twilioData?.number ? ` ${twilioData.number}` : " the Twilio number"}</span>
          </li>
        </ol>
        
        <p className="text-xs text-amber-700">
          This is a Twilio sandbox requirement. If recipients haven't completed this setup, they will not 
          receive WhatsApp messages even though the system reports successful sending.
        </p>
      </AlertDescription>
    </Alert>
  );
}