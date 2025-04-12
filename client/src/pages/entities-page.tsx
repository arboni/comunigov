import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import EntityCard from "@/components/dashboard/entity-card";
import RegisterEntityDialog from "@/components/dialogs/register-entity-dialog";
import { Button } from "@/components/ui/button";

export default function EntitiesPage() {
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
              <h1 className="text-2xl font-semibold text-neutral-800">Entity Management</h1>
              <p className="mt-1 text-sm text-neutral-500">
                Manage and view all registered entities in the system
              </p>
            </div>
            
            {user?.role === 'master_implementer' && (
              <Button 
                onClick={() => setRegisterEntityOpen(true)}
                className="flex items-center gap-1"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Register Entity</span>
              </Button>
            )}
          </div>
          
          {/* Entity Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <div className="col-span-full py-12 text-center text-neutral-500">
                Loading entities...
              </div>
            ) : entities && entities.length > 0 ? (
              entities.map((entity) => (
                <EntityCard key={entity.id} entity={entity} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center">
                <h3 className="text-lg font-medium text-neutral-700">No entities found</h3>
                <p className="mt-2 text-neutral-500">
                  {user?.role === 'master_implementer' 
                    ? "Click the 'Register Entity' button to create your first entity."
                    : "No entities have been registered in the system yet."}
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
