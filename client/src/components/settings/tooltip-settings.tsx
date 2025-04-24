import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTooltips, TooltipId } from '@/hooks/use-tooltips';
import { RefreshCw, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TooltipSettingGroupProps {
  title: string;
  tooltips: {
    id: TooltipId;
    label: string;
    description: string;
  }[];
}

// Group tooltips by section
const tooltipGroups: TooltipSettingGroupProps[] = [
  {
    title: 'Dashboard',
    tooltips: [
      {
        id: 'dashboard-first-visit',
        label: 'Primeira visita ao Dashboard',
        description: 'Introdução às principais funcionalidades do Dashboard'
      },
      {
        id: 'dashboard-sidebar-navigation',
        label: 'Navegação pela barra lateral',
        description: 'Como utilizar o menu de navegação principal'
      },
      {
        id: 'dashboard-user-menu',
        label: 'Menu do usuário',
        description: 'Opções disponíveis no menu do usuário'
      }
    ]
  },
  {
    title: 'Entidades',
    tooltips: [
      {
        id: 'entities-overview',
        label: 'Visão geral de entidades',
        description: 'Explicação sobre o gerenciamento de entidades'
      },
      {
        id: 'entity-creation',
        label: 'Criação de entidades',
        description: 'Como criar novas entidades no sistema'
      },
      {
        id: 'entity-import',
        label: 'Importação de entidades',
        description: 'Como importar entidades e membros por CSV'
      },
      {
        id: 'entity-members',
        label: 'Membros de entidades',
        description: 'Gerenciamento de membros de uma entidade'
      }
    ]
  },
  {
    title: 'Assuntos',
    tooltips: [
      {
        id: 'subjects-overview',
        label: 'Visão geral de assuntos',
        description: 'Explicação sobre o gerenciamento de assuntos'
      },
      {
        id: 'subject-creation',
        label: 'Criação de assuntos',
        description: 'Como criar novos assuntos no sistema'
      },
      {
        id: 'subject-entity-relationship',
        label: 'Relacionamento com entidades',
        description: 'Como relacionar assuntos com entidades'
      }
    ]
  },
  {
    title: 'Reuniões',
    tooltips: [
      {
        id: 'meetings-overview',
        label: 'Visão geral de reuniões',
        description: 'Explicação sobre o gerenciamento de reuniões'
      },
      {
        id: 'meeting-creation',
        label: 'Criação de reuniões',
        description: 'Como criar novas reuniões no sistema'
      },
      {
        id: 'meeting-attendees',
        label: 'Participantes de reuniões',
        description: 'Como gerenciar participantes de reuniões'
      },
      {
        id: 'meeting-reactions',
        label: 'Reações às reuniões',
        description: 'Como utilizar reações para feedback rápido'
      }
    ]
  },
  {
    title: 'Tarefas',
    tooltips: [
      {
        id: 'tasks-overview',
        label: 'Visão geral de tarefas',
        description: 'Explicação sobre o gerenciamento de tarefas'
      },
      {
        id: 'task-creation',
        label: 'Criação de tarefas',
        description: 'Como criar novas tarefas no sistema'
      },
      {
        id: 'task-assignment',
        label: 'Atribuição de tarefas',
        description: 'Como atribuir tarefas a usuários'
      }
    ]
  },
  {
    title: 'Comunicações',
    tooltips: [
      {
        id: 'communications-overview',
        label: 'Visão geral de comunicações',
        description: 'Explicação sobre o sistema de comunicações'
      },
      {
        id: 'communication-channels',
        label: 'Canais de comunicação',
        description: 'Como utilizar diferentes canais de comunicação'
      },
      {
        id: 'communication-attachments',
        label: 'Anexos em comunicações',
        description: 'Como enviar documentos anexados às comunicações'
      }
    ]
  },
  {
    title: 'Perfil e Configurações',
    tooltips: [
      {
        id: 'user-profile',
        label: 'Perfil de usuário',
        description: 'Como gerenciar seu perfil de usuário'
      },
      {
        id: 'notification-settings',
        label: 'Configurações de notificação',
        description: 'Como gerenciar suas preferências de notificação'
      }
    ]
  }
];

// Component for individual tooltip setting
function TooltipSetting({ id, label, description }: { id: TooltipId, label: string, description: string }) {
  const { shouldShowTooltip, markTooltipAsSeen, resetTooltip } = useTooltips();
  const tooltipEnabled = !shouldShowTooltip(id);
  
  const handleToggle = (checked: boolean) => {
    if (checked) {
      markTooltipAsSeen(id);
    } else {
      resetTooltip(id);
    }
  };
  
  return (
    <div className="flex items-start justify-between space-x-4 py-4">
      <div className="space-y-1 flex-1">
        <Label htmlFor={`tooltip-${id}`} className="font-medium">
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch
        id={`tooltip-${id}`}
        checked={tooltipEnabled}
        onCheckedChange={handleToggle}
      />
    </div>
  );
}

// Group component
function TooltipSettingGroup({ title, tooltips }: TooltipSettingGroupProps) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-3">{title}</h3>
      <Card>
        <CardContent className="divide-y">
          {tooltips.map((tooltip) => (
            <TooltipSetting
              key={tooltip.id}
              id={tooltip.id}
              label={tooltip.label}
              description={tooltip.description}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// Main tooltip settings component
export function TooltipSettings() {
  const { resetAllTooltips } = useTooltips();
  const { toast } = useToast();
  
  const handleResetAll = () => {
    if (window.confirm('Tem certeza que deseja restaurar todas as dicas? Todas as dicas contextuais serão mostradas novamente.')) {
      resetAllTooltips();
      toast({
        title: 'Dicas restauradas',
        description: 'Todas as dicas contextuais foram restauradas com sucesso.',
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configurações de Dicas</h2>
          <p className="text-muted-foreground">
            Gerencie quais dicas contextuais você deseja ver durante a navegação pelo sistema.
          </p>
        </div>
        <Button onClick={handleResetAll} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Restaurar Todas
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Sobre as Dicas Contextuais
          </CardTitle>
          <CardDescription>
            As dicas contextuais são pequenas sugestões que aparecem durante a navegação
            para ajudar você a entender melhor as funcionalidades do sistema. Você pode
            desativar dicas específicas que não deseja mais ver.
          </CardDescription>
        </CardHeader>
      </Card>
      
      {tooltipGroups.map((group) => (
        <TooltipSettingGroup
          key={group.title}
          title={group.title}
          tooltips={group.tooltips}
        />
      ))}
    </div>
  );
}