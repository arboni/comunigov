import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function NotFound() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">{t('errors.page_not_found')}</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            {t('errors.page_not_found')}
          </p>
          
          <div className="mt-6 flex justify-center">
            <Button onClick={() => setLocation('/')}>
              {t('errors.go_home')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
