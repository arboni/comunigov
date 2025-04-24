import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, HelpCircle, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TooltipId, useTooltips } from '@/hooks/use-tooltips';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export function TooltipSettings() {
  const { toast } = useToast();
  const { getSeenTooltips, resetTooltip, resetAllTooltips } = useTooltips();
  
  // Get the list of seen tooltips for display
  const seenTooltips = getSeenTooltips();
  
  // Function to get readable tooltip name from ID
  const getTooltipReadableName = (id: TooltipId): string => {
    const tooltipNames: Record<TooltipId, string> = {
      // Dashboard
      'dashboard-first-visit': 'Dashboard: Primeira visita',
      'dashboard-sidebar-navigation': 'Dashboard: Navegação lateral',
      'dashboard-user-menu': 'Dashboard: Menu do usuário',
      
      // Entities
      'entities-overview': 'Entidades: Visão geral',
      'entity-creation': 'Entidades: Criação',
      'entity-import': 'Entidades: Importação',
      'entity-members': 'Entidades: Membros',
      
      // Subjects
      'subjects-overview': 'Assuntos: Visão geral',
      'subject-creation': 'Assuntos: Criação',
      'subject-entity-relationship': 'Assuntos: Relacionamento com entidades',
      
      // Meetings
      'meetings-overview': 'Reuniões: Visão geral',
      'meeting-creation': 'Reuniões: Criação',
      'meeting-attendees': 'Reuniões: Participantes',
      'meeting-reactions': 'Reuniões: Reações',
      
      // Tasks
      'tasks-overview': 'Tarefas: Visão geral',
      'task-creation': 'Tarefas: Criação',
      'task-assignment': 'Tarefas: Atribuição',
      
      // Communications
      'communications-overview': 'Comunicações: Visão geral',
      'communication-channels': 'Comunicações: Canais',
      'communication-attachments': 'Comunicações: Anexos',
      
      // User Profile & Settings
      'user-profile': 'Perfil do usuário',
      'notification-settings': 'Configurações de notificação'
    };
    
    return tooltipNames[id] || id;
  };
  
  const handleResetAllTooltips = () => {
    resetAllTooltips();
    toast({
      title: 'Dicas contextuais resetadas',
      description: 'Todas as dicas serão exibidas novamente.',
    });
  };
  
  const handleResetTooltip = (id: TooltipId) => {
    resetTooltip(id);
    toast({
      title: 'Dica contextual resetada',
      description: `A dica "${getTooltipReadableName(id)}" será exibida novamente.`,
    });
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Configurações de dicas contextuais</CardTitle>
          <CardDescription>
            Gerencie como as dicas contextuais são exibidas no aplicativo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-y-0">
            <div className="space-y-0.5">
              <Label>Dicas visualizadas</Label>
              <p className="text-sm text-muted-foreground">
                Estas são as dicas que você já viu e que não serão exibidas novamente.
              </p>
            </div>
          </div>
          
          <Separator />
          
          {seenTooltips.length === 0 ? (
            <div className="py-3 text-center">
              <p className="text-sm text-muted-foreground">
                Você ainda não visualizou nenhuma dica contextual.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[200px] rounded-md border px-4">
              <div className="space-y-2 py-2">
                {seenTooltips.map((id) => (
                  <div key={id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{getTooltipReadableName(id)}</span>
                    </div>
                    <Button
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleResetTooltip(id)}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Resetar
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Dicas de uso</AlertTitle>
            <AlertDescription>
              Resetar as dicas fará com que elas sejam exibidas novamente ao navegar pelas páginas correspondentes.
              Isso é útil se você quiser rever as instruções ou se está treinando um novo usuário.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 border-t px-6 py-4">
          <Button 
            variant="secondary"
            onClick={handleResetAllTooltips}
            disabled={seenTooltips.length === 0}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetar todas as dicas
          </Button>
        </CardFooter>
      </Card>
      
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Tour de boas-vindas</CardTitle>
          <CardDescription>
            Configurações relacionadas ao tour de boas-vindas do aplicativo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-y-0">
            <div className="space-y-0.5">
              <Label htmlFor="welcome-tour">Tour de boas-vindas</Label>
              <p className="text-sm text-muted-foreground">
                Exibir novamente o tour de boas-vindas que mostra as funcionalidades principais do sistema.
              </p>
            </div>
            <Button 
              onClick={() => {
                localStorage.removeItem('comunigov-has-seen-welcome-tour');
                toast({
                  title: 'Tour de boas-vindas resetado',
                  description: 'O tour será exibido na próxima vez que você acessar o dashboard.',
                });
              }}
              variant="outline"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Mostrar tour novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}