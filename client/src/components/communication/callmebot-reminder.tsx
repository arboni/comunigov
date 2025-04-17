import React from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { AlertTriangleIcon } from "lucide-react";

export default function CallMeBotReminder() {
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
            Send the message <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-200">I allow callmebot to send me messages</span> to 
            <span className="font-semibold"> +34 644 66 01 95</span> on WhatsApp
          </li>
        </ol>
        
        <p className="text-xs text-amber-700">
          This is a CallMeBot requirement. If recipients haven't completed this setup, they will not 
          receive WhatsApp messages even though the system reports successful sending.
        </p>
      </AlertDescription>
    </Alert>
  );
}