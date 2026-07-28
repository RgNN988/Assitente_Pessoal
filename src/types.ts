export type CategoryId = string

export type Group = 'estudos' | 'iniciativas' | 'jiujitsu' | 'pessoal'

export interface Category {
  id: CategoryId
  label: string
  icon: string
  group: Group
}

export interface Task {
  id: string
  title: string
  category: CategoryId
  points: number
  createdAt: string
  doneAt: string | null
}

export type StudyKind = 'lista' | 'prova' | 'material'

export interface StudyItem {
  id: string
  title: string
  subject: string
  kind: StudyKind
  totalUnits: number
  doneUnits: number
  points: number
  awarded: number
  examDate: string | null
  createdAt: string
}

export interface LedgerEntry {
  id: string
  ts: string
  points: number
  group: Group | 'resgate'
  label: string
}

export interface Reward {
  id: string
  name: string
  cost: number
  icon: string
}

export type EventKind = 'aula' | 'treino' | 'iniciativa' | 'outro'

export interface ScheduleEvent {
  id: string
  day: number // 0 = segunda … 6 = domingo
  start: string // "HH:MM"
  end: string
  title: string
  kind: EventKind
}

export interface Toast {
  id: string
  text: string
  tone: 'xp' | 'spend' | 'level'
}
