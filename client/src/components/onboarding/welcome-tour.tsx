import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { useTooltips } from '@/hooks/use-tooltips';
import { Lightbulb, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

// Tour steps
const tourSteps = [
  {
    id: 'welcome',
    icon: <Lightbulb className="h-6 w-6 text-yellow-500" />,
    title: 'Bem-vindo ao ComuniGov',
    description: 'O sistema de comunicação institucional que facilita o relacionamento entre entidades e a coordenação de reuniões e tarefas. Vamos fazer um tour rápido pelas principais funcionalidades.'
  },
  {
    id: 'sidebar',
    icon: <Lightbulb className="h-6 w-6 text-yellow-500" />,
    title: 'Navegação Principal',
    description: 'Use a barra lateral para navegar entre as diferentes seções do sistema: Dashboard, Entidades, Assuntos, Reuniões, Tarefas e Comunicações.'
  },
  {
    id: 'entities',
    icon: <Lightbulb className="h-6 w-6 text-yellow-500" />,
    title: 'Entidades',
    description: 'Gerencie as instituições e organizações que fazem parte da sua rede. Você pode adicionar membros, definir responsáveis e categorizar por tipo.'
  },
  {
    id: 'subjects',
    icon: <Lightbulb className="h-6 w-6 text-yellow-500" />,
    title: 'Assuntos',
    description: 'Organize seus temas de trabalho em assuntos. Cada assunto pode ser associado a entidades específicas, facilitando a organização de reuniões e tarefas.'
  },
  {
    id: 'meetings',
    icon: <Lightbulb className="h-6 w-6 text-yellow-500" />,
    title: 'Reuniões',
    description: 'Agende e gerencie reuniões, definindo participantes, data, hora e local. As reações às reuniões permitem feedback rápido dos participantes.'
  },
  {
    id: 'tasks',
    icon: <Lightbulb className="h-6 w-6 text-yellow-500" />,
    title: 'Tarefas',
    description: 'Crie e atribua tarefas relacionadas aos assuntos e entidades. Acompanhe o status e o progresso de cada tarefa.'
  },
  {
    id: 'communications',
    icon: <Lightbulb className="h-6 w-6 text-yellow-500" />,
    title: 'Comunicações',
    description: 'Envie mensagens por diferentes canais (Email, WhatsApp, Telegram, Notificações do Sistema) para manter todos informados.'
  },
  {
    id: 'tooltips',
    icon: <CheckCircle className="h-6 w-6 text-green-500" />,
    title: 'Dicas Contextuais',
    description: 'Durante sua navegação, você encontrará dicas como esta para ajudar a entender cada funcionalidade. Você pode desativar cada dica individualmente ou todas nas configurações.'
  }
];

interface WelcomeTourProps {
  onComplete?: () => void;
}

export function WelcomeTour({ onComplete }: WelcomeTourProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { markTooltipAsSeen } = useTooltips();
  const totalSteps = tourSteps.length;
  
  // Check localStorage to see if the user has seen the tour
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('comunigov-has-seen-welcome-tour');
    if (!hasSeenTour) {
      setIsOpen(true);
    }
  }, []);
  
  // When the tour is completed
  const handleComplete = () => {
    localStorage.setItem('comunigov-has-seen-welcome-tour', 'true');
    
    // Mark dashboard tooltips as seen since the tour covered them
    markTooltipAsSeen('dashboard-first-visit');
    markTooltipAsSeen('dashboard-sidebar-navigation');
    
    setIsOpen(false);
    
    if (onComplete) {
      onComplete();
    }
  };
  
  // Handle step navigation
  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const handleSkip = () => {
    const confirmSkip = window.confirm(
      'Tem certeza que deseja pular o tour de boas-vindas? Você pode encontrar estas informações nas dicas contextuais ao usar o sistema.'
    );
    
    if (confirmSkip) {
      handleComplete();
    }
  };
  
  // Get current step data
  const currentStepData = tourSteps[currentStep];
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {currentStepData.icon}
            <DialogTitle>{currentStepData.title}</DialogTitle>
          </div>
          <DialogDescription>
            Passo {currentStep + 1} de {totalSteps}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p>{currentStepData.description}</p>
        </div>
        
        {/* Progress indicators */}
        <div className="flex justify-center gap-1 my-2">
          {tourSteps.map((_, index) => (
            <div 
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                index === currentStep 
                  ? 'w-8 bg-primary' 
                  : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>
        
        <DialogFooter className="flex justify-between items-center">
          <div>
            {currentStep > 0 ? (
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                size="sm"
                className="gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Anterior
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                onClick={handleSkip}
                size="sm"
              >
                Pular Tour
              </Button>
            )}
          </div>
          
          <Button 
            onClick={handleNext}
            className="gap-1"
            size="sm"
          >
            {currentStep < totalSteps - 1 ? (
              <>
                Próximo
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              'Começar a usar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}