import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import EntityCard from "@/components/dashboard/entity-card";
import RegisterEntityDialog from "@/components/dialogs/register-entity-dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export default function EntitiesPage() {
  const { t } = useTranslation();
  const [registerEntityOpen, setRegisterEntityOpen] = useState(false);
  
  // Get the current user
  const { data: user } = useQuery({
    queryKey: ["/api/user"]
  });
  
  // Fetch entities
  const { data: entities, isLoading } = useQuery({
    queryKey: ["/api/entities"],
  });

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-800">{t("entities.management_title")}</h1>
              <p className="mt-1 text-sm text-neutral-500">
                {t("entities.management_description")}
              </p>
            </div>
            
            {user?.role === 'master_implementer' && (
              <Button 
                onClick={() => setRegisterEntityOpen(true)}
                className="flex items-center gap-1"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{t("entity.register")}</span>
              </Button>
            )}
          </div>
          
          {/* Entity Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <div className="col-span-full py-12 text-center text-neutral-500">
                {t("common.loading")}...
              </div>
            ) : entities && entities.length > 0 ? (
              entities.map((entity) => (
                <EntityCard key={entity.id} entity={entity} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center">
                <h3 className="text-lg font-medium text-neutral-700">{t("entities.no_entities")}</h3>
                <p className="mt-2 text-neutral-500">
                  {user?.role === 'master_implementer' 
                    ? t("entities.empty_state_admin")
                    : t("entities.empty_state_user")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Register Entity Dialog */}
      <RegisterEntityDialog 
        open={registerEntityOpen} 
        onOpenChange={setRegisterEntityOpen} 
      />
    </DashboardLayout>
  );
}
