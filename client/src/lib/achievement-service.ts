import { AchievementData } from '@/components/celebrations/confetti-celebration';

// Define the milestone types that can trigger achievements
export type MilestoneType = 
  | 'entity_created' 
  | 'subject_created' 
  | 'meeting_created' 
  | 'task_completed' 
  | 'task_assigned'
  | 'communication_sent'
  | 'first_login'
  | 'profile_completed'
  | 'welcome_tour_completed';

// Maps milestone types to counts that trigger achievements
const milestoneThresholds: Record<MilestoneType, number[]> = {
  entity_created: [1, 5, 10, 25],
  subject_created: [1, 10, 25, 50],
  meeting_created: [1, 5, 15, 30],
  task_completed: [1, 5, 15, 30],
  task_assigned: [1, 5, 15, 30],
  communication_sent: [1, 5, 15, 30],
  first_login: [1],
  profile_completed: [1],
  welcome_tour_completed: [1]
};

// Achievement definitions with localized titles and descriptions
const achievementDefinitions: Record<MilestoneType, (level: number) => Omit<AchievementData, 'id'>> = {
  entity_created: (level: number) => {
    const types: AchievementData['type'][] = ['bronze', 'silver', 'gold', 'platinum'];
    const titles = [
      'Primeira Entidade',
      'Construtor de Rede',
      'Coordenador de Entidades',
      'Mestre de Organizações'
    ];
    const descriptions = [
      'Você criou sua primeira entidade no sistema.',
      'Você criou 5 entidades no sistema.',
      'Você criou 10 entidades no sistema.',
      'Você criou 25 entidades no sistema. Impressionante!'
    ];
    return {
      title: titles[level - 1] || titles[0],
      description: descriptions[level - 1] || descriptions[0],
      type: types[level - 1] || 'bronze',
      icon: 'award'
    };
  },
  
  subject_created: (level: number) => {
    const types: AchievementData['type'][] = ['bronze', 'silver', 'gold', 'platinum'];
    const titles = [
      'Iniciador de Assuntos',
      'Criador de Tópicos',
      'Especialista em Assuntos',
      'Maestro de Conteúdo'
    ];
    const descriptions = [
      'Você criou seu primeiro assunto.',
      'Você criou 10 assuntos diferentes.',
      'Você criou 25 assuntos diferentes.',
      'Você criou 50 assuntos! Sua contribuição é incrível.'
    ];
    return {
      title: titles[level - 1] || titles[0],
      description: descriptions[level - 1] || descriptions[0],
      type: types[level - 1] || 'bronze',
      icon: 'star'
    };
  },
  
  meeting_created: (level: number) => {
    const types: AchievementData['type'][] = ['bronze', 'silver', 'gold', 'platinum'];
    const titles = [
      'Primeira Reunião',
      'Organizador Regular',
      'Coordenador Experiente',
      'Maestro de Reuniões'
    ];
    const descriptions = [
      'Você organizou sua primeira reunião.',
      'Você organizou 5 reuniões com sucesso.',
      'Você organizou 15 reuniões. Impressionante!',
      'Você organizou 30 reuniões. Sua liderança é notável!'
    ];
    return {
      title: titles[level - 1] || titles[0],
      description: descriptions[level - 1] || descriptions[0],
      type: types[level - 1] || 'bronze',
      icon: 'trophy'
    };
  },
  
  task_completed: (level: number) => {
    const types: AchievementData['type'][] = ['bronze', 'silver', 'gold', 'platinum'];
    const titles = [
      'Primeira Tarefa Concluída',
      'Executor Eficiente',
      'Realizador de Tarefas',
      'Mestre em Produtividade'
    ];
    const descriptions = [
      'Você concluiu sua primeira tarefa.',
      'Você concluiu 5 tarefas com sucesso.',
      'Você concluiu 15 tarefas.',
      'Você concluiu 30 tarefas. Sua produtividade é impressionante!'
    ];
    return {
      title: titles[level - 1] || titles[0],
      description: descriptions[level - 1] || descriptions[0],
      type: types[level - 1] || 'bronze',
      icon: 'star'
    };
  },

  task_assigned: (level: number) => {
    const types: AchievementData['type'][] = ['bronze', 'silver', 'gold', 'platinum'];
    const titles = [
      'Primeiro Delegamento',
      'Delegador Ativo',
      'Delegador Experiente',
      'Líder Supremo'
    ];
    const descriptions = [
      'Você delegou sua primeira tarefa.',
      'Você delegou 5 tarefas com sucesso.',
      'Você delegou 15 tarefas.',
      'Você delegou 30 tarefas. Isso é liderança!'
    ];
    return {
      title: titles[level - 1] || titles[0],
      description: descriptions[level - 1] || descriptions[0],
      type: types[level - 1] || 'bronze',
      icon: 'award'
    };
  },
  
  communication_sent: (level: number) => {
    const types: AchievementData['type'][] = ['bronze', 'silver', 'gold', 'platinum'];
    const titles = [
      'Primeira Comunicação',
      'Comunicador Regular',
      'Comunicador Ativo',
      'Comunicador Mestre'
    ];
    const descriptions = [
      'Você enviou sua primeira comunicação.',
      'Você enviou 5 comunicações.',
      'Você enviou 15 comunicações.',
      'Você enviou 30 comunicações. Seu engajamento é exemplar!'
    ];
    return {
      title: titles[level - 1] || titles[0],
      description: descriptions[level - 1] || descriptions[0],
      type: types[level - 1] || 'bronze',
      icon: 'star'
    };
  },
  
  first_login: (level: number) => ({
    title: 'Boas-vindas',
    description: 'Bem-vindo ao ComuniGov! Você completou seu primeiro login.',
    type: 'bronze',
    icon: 'trophy'
  }),
  
  profile_completed: (level: number) => ({
    title: 'Perfil Completo',
    description: 'Você preencheu todas as informações do seu perfil.',
    type: 'bronze',
    icon: 'award'
  }),
  
  welcome_tour_completed: (level: number) => ({
    title: 'Tour Concluído',
    description: 'Você concluiu o tour de boas-vindas.',
    type: 'bronze',
    icon: 'star'
  })
};

// Local storage key for user achievements
const ACHIEVEMENTS_STORAGE_KEY = 'comunigov-user-achievements';

// Get all user achievements from local storage
export const getUserAchievements = (): Record<string, number> => {
  const storedAchievements = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
  if (!storedAchievements) return {};
  
  try {
    return JSON.parse(storedAchievements);
  } catch (error) {
    console.error('Error parsing stored achievements:', error);
    return {};
  }
};

// Check if the user has unlocked a new achievement and return it if so
export const checkNewAchievement = (milestoneType: MilestoneType, count?: number): AchievementData | null => {
  const achievements = getUserAchievements();
  
  // Use provided count or increment existing count by 1
  const newCount = count !== undefined ? count : (achievements[milestoneType] || 0) + 1;
  
  // Save the new count
  achievements[milestoneType] = newCount;
  localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(achievements));
  
  // Find the achievement level based on count
  const thresholds = milestoneThresholds[milestoneType];
  if (!thresholds) return null;
  
  // Find the highest unlocked level that matches the new count exactly
  const achievementLevel = thresholds.findIndex(threshold => threshold === newCount) + 1;
  if (achievementLevel > 0) {
    // Generate an achievement ID
    const id = `${milestoneType}_${achievementLevel}`;
    
    // Check if this achievement was already shown
    const shownAchievements = getShownAchievements();
    if (shownAchievements.includes(id)) return null;
    
    // Add to shown achievements
    markAchievementAsShown(id);
    
    // Return the new achievement data
    return {
      id,
      ...achievementDefinitions[milestoneType](achievementLevel)
    };
  }
  
  return null;
};

// Mark an achievement as shown to avoid showing it again
const SHOWN_ACHIEVEMENTS_KEY = 'comunigov-shown-achievements';

const getShownAchievements = (): string[] => {
  const shown = localStorage.getItem(SHOWN_ACHIEVEMENTS_KEY);
  if (!shown) return [];
  
  try {
    return JSON.parse(shown);
  } catch {
    return [];
  }
};

const markAchievementAsShown = (id: string): void => {
  const shown = getShownAchievements();
  shown.push(id);
  localStorage.setItem(SHOWN_ACHIEVEMENTS_KEY, JSON.stringify(shown));
};

// Reset all achievements (for testing purposes)
export const resetAchievements = (): void => {
  localStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
  localStorage.removeItem(SHOWN_ACHIEVEMENTS_KEY);
};