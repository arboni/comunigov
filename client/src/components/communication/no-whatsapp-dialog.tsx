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
import { useTranslation } from "@/hooks/use-translation";

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
  const { t } = useTranslation();
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('whatsapp.missing_numbers')}</DialogTitle>
          <DialogDescription>
            {t('whatsapp.missing_numbers_description')}
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
            {t('whatsapp.fallback_message')}
          </p>
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <Link href="/users">
            <Button variant="outline" type="button">
              {t('users.manage_users')}
            </Button>
          </Link>
          <Button type="button" onClick={onClose}>
            {t('whatsapp.continue_anyway')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}