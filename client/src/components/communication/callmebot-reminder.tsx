import React from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { AlertTriangleIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function CallMeBotReminder() {
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
          <li>Wait for the confirmation response from CallMeBot</li>
        </ol>
        
        <Button 
          onClick={openWhatsApp}
          className="bg-green-600 hover:bg-green-700 text-white my-2"
          size="sm"
        >
          Click to Open WhatsApp <ExternalLink className="ml-2 h-3 w-3" />
        </Button>
        
        <Separator className="my-3 bg-amber-200" />
        
        <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-md mt-2">
          <h4 className="font-semibold mb-2 text-amber-800">Troubleshooting Tips:</h4>
          <ul className="list-disc pl-5 space-y-1 text-amber-700">
            <li>Ensure phone numbers include the country code (e.g., +5551999701152)</li>
            <li>Verify you've completed the CallMeBot registration by checking for their confirmation message</li>
            <li>If messages aren't being delivered, try sending the registration message again</li>
          </ul>
        </div>
        
        <p className="text-xs text-amber-700 mt-3">
          This is a CallMeBot requirement. If recipients haven't completed this setup, they will not 
          receive WhatsApp messages even though the system reports successful sending.
        </p>
      </AlertDescription>
    </Alert>
  );
}