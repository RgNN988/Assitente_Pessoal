import type { Category, CategoryId, Group, Reward, ScheduleEvent } from '../types'

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'prova', label: 'Estudo para prova', group: 'estudos', icon: '⚔️' },
  { id: 'lista', label: 'Lista de exercícios', group: 'estudos', icon: '📜' },
  { id: 'material', label: 'Material / leitura', group: 'estudos', icon: '📖' },
  { id: 'leitura', label: 'Leitura diária (1h)', group: 'estudos', icon: '📚' },
  { id: 'itajr', label: 'ITA Júnior', group: 'iniciativas', icon: '🏛️' },
  { id: 'lei', label: 'Liga de Empreendedorismo', group: 'iniciativas', icon: '🚀' },
  { id: 'jiujitsu', label: 'Jiu-jitsu', group: 'jiujitsu', icon: '🥋' },
  { id: 'pessoal', label: 'Pessoal', group: 'pessoal', icon: '🎒' },
]

/** Categoria pode ter sido excluída; tarefas antigas ainda apontam para ela. */
export function categoryInfo(categories: Category[], id: CategoryId): Category {
  return (
    categories.find((c) => c.id === id) ?? {
      id,
      label: 'Categoria removida',
      icon: '❔',
      group: 'pessoal',
    }
  )
}

export const GROUPS: Record<Group, { label: string; color: string }> = {
  estudos: { label: 'Estudos', color: 'var(--c-estudos)' },
  iniciativas: { label: 'Iniciativas', color: 'var(--c-iniciativas)' },
  jiujitsu: { label: 'Jiu-jitsu', color: 'var(--c-jiujitsu)' },
  pessoal: { label: 'Pessoal', color: 'var(--c-pessoal)' },
}

export const GROUP_IDS = Object.keys(GROUPS) as Group[]

// Estudar para prova é o que mais vale ponto — pedido explícito.
export const DEFAULT_WEIGHTS: Record<CategoryId, number> = {
  prova: 50,
  lista: 35,
  material: 25,
  leitura: 20,
  itajr: 20,
  lei: 20,
  jiujitsu: 15,
  pessoal: 10,
}

export const DEFAULT_REWARDS: Reward[] = [
  { id: 'r1', name: '1 episódio de série', cost: 150, icon: '📺' },
  { id: 'r2', name: '1h de jogos', cost: 250, icon: '🎮' },
  { id: 'r3', name: 'Lanche especial', cost: 300, icon: '🍔' },
  { id: 'r4', name: 'Noite livre (sem culpa)', cost: 600, icon: '🌙' },
  { id: 'r5', name: 'Rolê no fim de semana', cost: 1000, icon: '🎉' },
]

const JIU_JITSU: ScheduleEvent[] = [
  { id: 'jj-seg', day: 0, start: '19:30', end: '21:00', title: 'Jiu-jitsu', kind: 'treino' },
  { id: 'jj-qua', day: 2, start: '19:30', end: '21:00', title: 'Jiu-jitsu', kind: 'treino' },
  { id: 'jj-sex', day: 4, start: '19:30', end: '21:00', title: 'Jiu-jitsu', kind: 'treino' },
]

// Grade oficial 1º FUND 2026 · 2º semestre (PDF do usuário), blocos consecutivos já mesclados.
// Formato: [dia, início, fim, matéria, sala]
type AulaRow = [number, string, string, string, string]

const TURMA_AULAS: Record<number, AulaRow[]> = {
  1: [
    [0, '08:00', '09:50', 'FIS-15', 'Pompeia'],
    [0, '10:10', '12:00', 'QUI-28', '1506'],
    [0, '13:30', '16:30', 'QUI-28 LAB', 'Lab. E 1506'],
    [1, '08:00', '09:50', 'CES-11', 'F3-103'],
    [1, '10:10', '12:00', 'MAT-22', 'F2-103'],
    [1, '13:30', '16:30', 'FIS-16 LAB', 'Laboratório'],
    [2, '08:00', '09:50', 'FIS-15', 'F2-105'],
    [2, '10:10', '12:00', 'MAT-27', 'F2-103'],
    [2, '13:30', '16:30', 'HUM-01', 'F2-107'],
    [3, '08:00', '12:00', 'CPOR', ''],
    [3, '13:30', '15:20', 'MAT-22', 'F2-103'],
    [4, '08:00', '09:50', 'CES-11', 'F3-103'],
    [4, '10:10', '12:00', 'MAT-27', 'F2-103'],
  ],
  2: [
    [0, '08:00', '09:50', 'QUI-28', '1506'],
    [0, '10:10', '12:00', 'CES-11', 'F3-103'],
    [0, '13:30', '15:20', 'FIS-15', 'Pompeia'],
    [1, '08:00', '09:50', 'MAT-22', 'F2-107'],
    [1, '10:10', '12:00', 'MAT-27', 'F2-107'],
    [1, '13:30', '16:30', 'QUI-28 LAB', 'Lab. E 1506'],
    [2, '08:00', '09:50', 'CES-11', 'F3-103'],
    [2, '10:10', '12:00', 'FIS-15', 'F2-105'],
    [2, '13:30', '16:30', 'HUM-01', 'F2-105'],
    [3, '08:00', '12:00', 'CPOR', ''],
    [3, '13:30', '16:30', 'FIS-16 LAB', 'Laboratório'],
    [4, '08:00', '09:50', 'MAT-27', 'F2-107'],
    [4, '10:10', '12:00', 'MAT-22', 'F2-107'],
  ],
  3: [
    [0, '08:00', '09:50', 'FIS-15', 'Pompeia'],
    [0, '10:10', '12:00', 'MAT-22', 'F2-107'],
    [0, '13:30', '16:30', 'FIS-16 LAB', 'Laboratório'],
    [1, '08:00', '09:50', 'MAT-27', 'F2-103'],
    [1, '10:10', '12:00', 'QUI-28', '1506'],
    [1, '13:30', '15:20', 'HUM-70', 'F2-107'],
    [2, '08:00', '09:50', 'MAT-22', 'F2-107'],
    [2, '10:10', '12:00', 'CES-11', 'SCEPE'],
    [2, '13:30', '16:30', 'QUI-28 LAB', 'Lab. E 1506'],
    [3, '08:00', '12:00', 'CPOR', ''],
    [3, '13:30', '15:20', 'MAT-27', 'F2-105'],
    [3, '15:40', '16:30', 'HUM-70', 'F2-107'],
    [4, '08:00', '09:50', 'CES-11', 'SCEPE'],
    [4, '10:10', '12:00', 'FIS-15', 'F2-105'],
  ],
  4: [
    [0, '08:00', '09:50', 'CES-11', 'SCEPE'],
    [0, '10:10', '12:00', 'MAT-27', 'F2-103'],
    [0, '13:30', '15:20', 'FIS-15', 'Pompeia'],
    [0, '15:40', '16:30', 'HUM-70', 'F2-105'],
    [1, '08:00', '09:50', 'QUI-28', '1506'],
    [1, '10:10', '12:00', 'MAT-22', 'F3-102'],
    [1, '13:30', '15:20', 'HUM-70', 'F2-105'],
    [2, '08:00', '09:50', 'CES-11', 'SCEPE'],
    [2, '10:10', '12:00', 'MAT-27', 'F2-107'],
    [2, '13:30', '16:30', 'FIS-16 LAB', 'Laboratório'],
    [3, '08:00', '12:00', 'CPOR', ''],
    [3, '13:30', '16:30', 'QUI-28 LAB', 'Lab. E 1506'],
    [4, '08:00', '09:50', 'FIS-15', 'F2-105'],
    [4, '10:10', '12:00', 'MAT-22', 'F3-106'],
  ],
}

export const TURMAS = [1, 2, 3, 4]

/** Aulas da turma como eventos (ids prefixados para poder trocar de turma). */
export function aulasForTurma(turma: number): ScheduleEvent[] {
  const rows = TURMA_AULAS[turma] ?? []
  return rows.map(([day, start, end, subject, room], i) => ({
    id: `aula-${turma}-${i}`,
    day,
    start,
    end,
    title: room ? `${subject} · ${room}` : subject,
    kind: 'aula' as const,
  }))
}

export const DEFAULT_TURMA = 4

export const DEFAULT_SCHEDULE: ScheduleEvent[] = [
  ...JIU_JITSU,
  ...aulasForTurma(DEFAULT_TURMA),
]

export const EVENT_KINDS: Record<
  string,
  { label: string; color: string; ink: string }
> = {
  aula: { label: 'Aula', color: 'rgba(189,134,31,0.22)', ink: '#e8b44c' },
  treino: { label: 'Treino', color: 'rgba(146,104,240,0.22)', ink: '#b79af7' },
  iniciativa: { label: 'Iniciativa', color: 'rgba(31,148,190,0.22)', ink: '#5cc0e4' },
  outro: { label: 'Outro', color: 'rgba(214,82,124,0.20)', ink: '#e58aa8' },
}

export const DAY_NAMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export interface Belt {
  name: string
  color: string
  edge: string
  xp: number // XP mínimo para entrar na faixa
}

// Níveis = faixas de jiu-jitsu, cada faixa com 4 graus.
export const BELTS: Belt[] = [
  { name: 'Faixa Branca', color: '#e9e4f2', edge: '#b9b2c9', xp: 0 },
  { name: 'Faixa Azul', color: '#2f6fd1', edge: '#1d4d99', xp: 2000 },
  { name: 'Faixa Roxa', color: '#7b4fd0', edge: '#5a37a3', xp: 5000 },
  { name: 'Faixa Marrom', color: '#8a5a33', edge: '#63401f', xp: 10000 },
  { name: 'Faixa Preta', color: '#17131f', edge: '#3d3161', xp: 18000 },
  { name: 'Faixa Coral', color: '#d1452f', edge: '#8a2c1c', xp: 32000 },
]

export interface AchievementDef {
  id: string
  name: string
  desc: string
  icon: string
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-blood', name: 'Primeiro Golpe', desc: 'Complete sua primeira missão', icon: '🗡️' },
  { id: 'prova-1', name: 'Batismo de Fogo', desc: 'Primeira sessão de estudo para prova', icon: '🔥' },
  { id: 'streak-3', name: 'Aquecendo', desc: '3 dias seguidos farmando pontos', icon: '✨' },
  { id: 'streak-7', name: 'Disciplina de Ferro', desc: '7 dias seguidos farmando pontos', icon: '🛡️' },
  { id: 'streak-14', name: 'Imparável', desc: '14 dias seguidos farmando pontos', icon: '⚡' },
  { id: 'streak-30', name: 'Lenda do ITA', desc: '30 dias seguidos farmando pontos', icon: '👑' },
  { id: 'xp-1000', name: 'Aventureiro', desc: 'Acumule 1.000 XP', icon: '🧭' },
  { id: 'xp-5000', name: 'Veterano', desc: 'Acumule 5.000 XP', icon: '🏹' },
  { id: 'xp-10000', name: 'Campeão da Guilda', desc: 'Acumule 10.000 XP', icon: '🏆' },
  { id: 'oss-10', name: 'Oss!', desc: '10 treinos de jiu-jitsu registrados', icon: '🥋' },
  { id: 'arsenal-5', name: 'Arsenal Limpo', desc: 'Complete 5 itens de estudo', icon: '🗃️' },
  { id: 'shopper', name: 'Recompensa Merecida', desc: 'Resgate sua primeira recompensa', icon: '🎁' },
]
