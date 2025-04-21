import { Building, User, Mail, Users, PenSquare, Eye } from "lucide-react";
import { Entity } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState } from "react";
import EditEntityDialog from "@/components/dialogs/edit-entity-dialog";
import { useTranslation } from "react-i18next";

interface EntityCardProps {
  entity: Entity;
}

export default function EntityCard({ entity }: EntityCardProps) {
  const { t } = useTranslation();
  const [editEntityOpen, setEditEntityOpen] = useState(false);

  // Function to get the translated entity type
  const getTranslatedEntityType = (type: string) => {
    return t(`entities.types.${type}`);
  };

  // Mock member count since we don't have that data immediately available
  // In a real implementation, you would fetch this from the API
  const memberCount = 0;

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0 mr-3">
            <div className="h-10 w-10 rounded-md bg-primary-100 flex items-center justify-center text-primary">
              <Building className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-medium text-neutral-900">{entity.name}</h3>
            <p className="text-sm text-neutral-500">{getTranslatedEntityType(entity.type)}</p>
          </div>
        </div>
        
        <div className="mt-4 border-t border-neutral-100 pt-4">
          <div className="flex items-center text-sm text-neutral-500 mb-1">
            <User className="mr-2 h-4 w-4 text-neutral-400" />
            <span>{entity.headName} - {entity.headPosition}</span>
          </div>
          <div className="flex items-center text-sm text-neutral-500 mb-1">
            <Mail className="mr-2 h-4 w-4 text-neutral-400" />
            <span>{entity.headEmail}</span>
          </div>
          <div className="flex items-center text-sm text-neutral-500">
            <Users className="mr-2 h-4 w-4 text-neutral-400" />
            <span>{memberCount} {t("entities.members.title").toLowerCase()}</span>
          </div>
        </div>
      </div>
      <div className="bg-neutral-50 px-5 py-3 flex justify-end">
        <Link href={`/entity/${entity.id}`}>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary hover:text-primary-600 mr-4 flex items-center"
          >
            <Eye className="h-4 w-4 mr-1" />
            {t("entities.view_details")}
          </Button>
        </Link>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-neutral-500 hover:text-neutral-600"
          onClick={() => setEditEntityOpen(true)}
        >
          <PenSquare className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Edit Entity Dialog */}
      <EditEntityDialog 
        open={editEntityOpen} 
        onOpenChange={setEditEntityOpen} 
        entityId={entity.id}
        entity={entity}
      />
    </div>
  );
}
