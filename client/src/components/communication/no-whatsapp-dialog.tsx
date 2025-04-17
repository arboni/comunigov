import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface NoWhatsAppDialogProps {
  open: boolean;
  onClose: () => void;
  recipientsWithoutWhatsApp: string[];
}

export default function NoWhatsAppDialog({
  open,
  onClose,
  recipientsWithoutWhatsApp,
}: NoWhatsAppDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Missing WhatsApp Numbers</DialogTitle>
          <DialogDescription>
            The following recipients don't have WhatsApp numbers configured in their profiles:
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 mb-4">
          <ul className="list-disc pl-5 space-y-1">
            {recipientsWithoutWhatsApp.map((name, index) => (
              <li key={index} className="text-sm">
                {name}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-gray-600">
            Messages will still be sent via email to these recipients, but they won't receive WhatsApp messages.
          </p>
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <Link href="/users">
            <Button variant="outline" type="button">
              Manage Users
            </Button>
          </Link>
          <Button type="button" onClick={onClose}>
            Continue Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}