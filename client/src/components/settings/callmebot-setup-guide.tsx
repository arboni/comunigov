import React from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function CallMeBotSetupGuide() {
  return (
    <Alert className="bg-white border-blue-200 mb-6">
      <InfoIcon className="h-4 w-4 text-blue-500" />
      <AlertTitle className="text-blue-700 font-semibold text-sm flex items-center">
        WhatsApp Setup Required
      </AlertTitle>
      <AlertDescription className="text-sm mt-2">
        <p className="mb-2">
          Before you can receive WhatsApp messages from ComuniGov, you need to authorize CallMeBot by following these steps:
        </p>
        
        <ol className="list-decimal pl-5 mb-3 space-y-2">
          <li>Open WhatsApp on your phone</li>
          <li>
            Send the following message to <span className="font-semibold">+34 644 66 01 95</span>:
            <div className="bg-gray-100 p-2 my-2 rounded font-mono text-sm">
              I allow callmebot to send me messages
            </div>
          </li>
          <li>You should receive a confirmation message from CallMeBot</li>
          <li>Once confirmed, you can receive WhatsApp messages from ComuniGov</li>
        </ol>
        
        <Separator className="my-3" />
        
        <div className="text-xs text-gray-600">
          <p className="mb-1">
            Note: This is a CallMeBot requirement. Your WhatsApp number will only receive messages after this authorization.
          </p>
          <p>
            If you don't complete this step, you will not receive WhatsApp messages from the system.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}