import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Category,
  CategoryId,
  Group,
  LedgerEntry,
  Reward,
  ScheduleEvent,
  StudyItem,
  Task,
  Toast,
} from './types'
import {
  ACHIEVEMENTS,
  DEFAULT_CATEGORIES,
  DEFAULT_REWARDS,
  DEFAULT_SCHEDULE,
  DEFAULT_TURMA,
  DEFAULT_WEIGHTS,
  aulasForTurma,
  categoryInfo,
} from './data/defaults'
import { balance, jjTitle, rankFor, streakDays, todayKey, totalXp, uid } from './lib/helpers'
import { BELTS } from './data/defaults'

interface State {
  heroName: string
  categories: Category[]
  weights: Record<CategoryId, number>
  tasks: Task[]
  studyItems: StudyItem[]
  ledger: LedgerEntry[]
  rewards: Reward[]
  schedule: ScheduleEvent[]
  turma: number
  trainings: string[] // dias de treino de jiu-jitsu (formato YYYY-MM-DD, um por dia)
  readings: string[] // dias com 1h de leitura (formato YYYY-MM-DD, um por dia)
  jjBeltIndex: number // graduação real, controlada manualmente
  jjDegree: number // 0..4 graus
  jjPromotedAt: string | null // dia da última graduação (zera o contador)
  seenAchievements: string[]
  toasts: Toast[]

  setHeroName: (name: string) => void
  setWeight: (cat: CategoryId, points: number) => void

  addCategory: (label: string, icon: string, group: Group, points: number) => void
  updateCategory: (id: CategoryId, patch: Partial<Omit<Category, 'id'>>) => void
  deleteCategory: (id: CategoryId) => void

  addTask: (title: string, category: CategoryId, points?: number) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void

  addStudyItem: (
    item: Omit<StudyItem, 'id' | 'doneUnits' | 'awarded' | 'createdAt'>,
  ) => void
  setStudyProgress: (id: string, doneUnits: number) => void
  deleteStudyItem: (id: string) => void

  addReward: (name: string, cost: number, icon: string) => void
  deleteReward: (id: string) => void
  redeemReward: (id: string) => void

  addEvent: (ev: Omit<ScheduleEvent, 'id'>) => void
  deleteEvent: (id: string) => void
  setTurma: (turma: number) => void

  addTraining: (day: string) => void
  removeTraining: (day: string) => void
  promoteJJ: () => void

  addReading: (day: string) => void
  removeReading: (day: string) => void

  pushToast: (text: string, tone: Toast['tone']) => void
  dismissToast: (id: string) => void

  exportData: () => string
  importData: (json: string) => boolean
  resetPoints: () => void
  resetAll: () => void
}

export function unlockedAchievements(s: {
  tasks: Task[]
  studyItems: StudyItem[]
  ledger: LedgerEntry[]
}): string[] {
  const xp = totalXp(s.ledger)
  const streak = streakDays(s.ledger)
  const out: string[] = []
  const doneTasks = s.tasks.filter((t) => t.doneAt)
  if (doneTasks.length > 0 || s.ledger.some((e) => e.points > 0)) out.push('first-blood')
  if (doneTasks.some((t) => t.category === 'prova') || s.studyItems.some((i) => i.kind === 'prova' && i.awarded > 0))
    out.push('prova-1')
  if (streak >= 3) out.push('streak-3')
  if (streak >= 7) out.push('streak-7')
  if (streak >= 14) out.push('streak-14')
  if (streak >= 30) out.push('streak-30')
  if (xp >= 1000) out.push('xp-1000')
  if (xp >= 5000) out.push('xp-5000')
  if (xp >= 10000) out.push('xp-10000')
  const treinos =
    doneTasks.filter((t) => t.category === 'jiujitsu').length +
    s.ledger.filter((e) => e.group === 'jiujitsu' && e.points > 0).length -
    doneTasks.filter((t) => t.category === 'jiujitsu').length // ledger já cobre as tasks
  if (s.ledger.filter((e) => e.group === 'jiujitsu' && e.points > 0).length >= 10 || treinos >= 10)
    out.push('oss-10')
  if (s.studyItems.filter((i) => i.totalUnits > 0 && i.doneUnits >= i.totalUnits).length >= 5)
    out.push('arsenal-5')
  if (s.ledger.some((e) => e.group === 'resgate')) out.push('shopper')
  return out
}

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const toast = (text: string, tone: Toast['tone']) => {
        const t: Toast = { id: uid(), text, tone }
        set((s) => ({ toasts: [...s.toasts, t] }))
        setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter((x) => x.id !== t.id) }))
        }, 3800)
      }

      /** Chamar após qualquer ganho: detecta subida de faixa e conquistas novas. */
      const afterEarn = (xpBefore: number) => {
        const s = get()
        const xpNow = totalXp(s.ledger)
        const before = rankFor(xpBefore)
        const now = rankFor(xpNow)
        if (now.title !== before.title) toast(`⬆️ Graduação! ${now.title}`, 'level')
        const unlocked = unlockedAchievements(s)
        const fresh = unlocked.filter((a) => !s.seenAchievements.includes(a))
        if (fresh.length) {
          for (const id of fresh) {
            const def = ACHIEVEMENTS.find((a) => a.id === id)
            if (def) toast(`${def.icon} Conquista: ${def.name}`, 'level')
          }
          set({ seenAchievements: [...s.seenAchievements, ...fresh] })
        }
      }

      return {
        heroName: 'Guerreiro',
        categories: [...DEFAULT_CATEGORIES],
        weights: { ...DEFAULT_WEIGHTS },
        tasks: [],
        studyItems: [],
        ledger: [],
        rewards: DEFAULT_REWARDS,
        schedule: DEFAULT_SCHEDULE,
        turma: DEFAULT_TURMA,
        trainings: [],
        readings: [],
        jjBeltIndex: 0,
        jjDegree: 0,
        jjPromotedAt: null,
        seenAchievements: [],
        toasts: [],

        setHeroName: (heroName) => set({ heroName }),
        setWeight: (cat, points) =>
          set((s) => ({ weights: { ...s.weights, [cat]: Math.max(0, points) } })),

        addCategory: (label, icon, group, points) => {
          const id = uid()
          set((s) => ({
            categories: [...s.categories, { id, label, icon: icon || '⭐', group }],
            weights: { ...s.weights, [id]: Math.max(0, points) },
          }))
          toast(`${icon || '⭐'} Categoria criada: ${label}`, 'level')
        },

        updateCategory: (id, patch) =>
          set((s) => ({
            categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
          })),

        deleteCategory: (id) => {
          const s = get()
          if (s.categories.length <= 1) {
            toast('Mantenha ao menos uma categoria', 'spend')
            return
          }
          const weights = { ...s.weights }
          delete weights[id]
          set({ categories: s.categories.filter((c) => c.id !== id), weights })
        },

        addTask: (title, category, points) =>
          set((s) => ({
            tasks: [
              {
                id: uid(),
                title,
                category,
                points: points ?? s.weights[category],
                createdAt: new Date().toISOString(),
                doneAt: null,
              },
              ...s.tasks,
            ],
          })),

        toggleTask: (id) => {
          const s = get()
          const task = s.tasks.find((t) => t.id === id)
          if (!task) return
          const xpBefore = totalXp(s.ledger)
          if (!task.doneAt) {
            const entry: LedgerEntry = {
              id: `task-${task.id}`,
              ts: new Date().toISOString(),
              points: task.points,
              group: categoryInfo(s.categories, task.category).group,
              label: task.title,
            }
            set({
              tasks: s.tasks.map((t) =>
                t.id === id ? { ...t, doneAt: new Date().toISOString() } : t,
              ),
              ledger: [...s.ledger, entry],
            })
            toast(`+${task.points} XP · ${task.title}`, 'xp')
            afterEarn(xpBefore)
          } else {
            set({
              tasks: s.tasks.map((t) => (t.id === id ? { ...t, doneAt: null } : t)),
              ledger: s.ledger.filter((e) => e.id !== `task-${task.id}`),
            })
          }
        },

        deleteTask: (id) =>
          set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

        addStudyItem: (item) =>
          set((s) => ({
            studyItems: [
              {
                ...item,
                id: uid(),
                doneUnits: 0,
                awarded: 0,
                createdAt: new Date().toISOString(),
              },
              ...s.studyItems,
            ],
          })),

        setStudyProgress: (id, doneUnits) => {
          const s = get()
          const item = s.studyItems.find((i) => i.id === id)
          if (!item) return
          const clamped = Math.max(0, Math.min(item.totalUnits, doneUnits))
          const newAwarded = Math.round((item.points * clamped) / item.totalUnits)
          const delta = newAwarded - item.awarded
          const xpBefore = totalXp(s.ledger)
          const ledger = delta
            ? [
                ...s.ledger,
                {
                  id: uid(),
                  ts: new Date().toISOString(),
                  points: delta,
                  group: 'estudos' as const,
                  label: `${item.subject} · ${item.title}`,
                },
              ]
            : s.ledger
          set({
            studyItems: s.studyItems.map((i) =>
              i.id === id ? { ...i, doneUnits: clamped, awarded: newAwarded } : i,
            ),
            ledger,
          })
          if (delta > 0) {
            const finished = clamped >= item.totalUnits
            toast(
              finished
                ? `🏁 +${delta} XP · ${item.title} completo!`
                : `+${delta} XP · ${item.title}`,
              'xp',
            )
            afterEarn(xpBefore)
          }
        },

        deleteStudyItem: (id) =>
          set((s) => ({ studyItems: s.studyItems.filter((i) => i.id !== id) })),

        addReward: (name, cost, icon) =>
          set((s) => ({
            rewards: [...s.rewards, { id: uid(), name, cost, icon }],
          })),

        deleteReward: (id) =>
          set((s) => ({ rewards: s.rewards.filter((r) => r.id !== id) })),

        redeemReward: (id) => {
          const s = get()
          const reward = s.rewards.find((r) => r.id === id)
          if (!reward) return
          if (balance(s.ledger) < reward.cost) {
            toast(`Saldo insuficiente para "${reward.name}"`, 'spend')
            return
          }
          set({
            ledger: [
              ...s.ledger,
              {
                id: uid(),
                ts: new Date().toISOString(),
                points: -reward.cost,
                group: 'resgate',
                label: reward.name,
              },
            ],
          })
          toast(`${reward.icon} Resgatado: ${reward.name} (-${reward.cost} pts)`, 'spend')
          const unlocked = unlockedAchievements(get())
          if (unlocked.includes('shopper') && !get().seenAchievements.includes('shopper')) {
            set({ seenAchievements: [...get().seenAchievements, 'shopper'] })
            toast('🎁 Conquista: Recompensa Merecida', 'level')
          }
        },

        addEvent: (ev) =>
          set((s) => ({ schedule: [...s.schedule, { ...ev, id: uid() }] })),

        deleteEvent: (id) =>
          set((s) => ({ schedule: s.schedule.filter((e) => e.id !== id) })),

        addTraining: (day) => {
          const s = get()
          if (s.trainings.includes(day)) return
          const xpBefore = totalXp(s.ledger)
          const jjPoints = s.weights.jiujitsu ?? DEFAULT_WEIGHTS.jiujitsu
          set({
            trainings: [...s.trainings, day].sort(),
            ledger: [
              ...s.ledger,
              {
                id: `jj-${day}`,
                ts: new Date(day + 'T20:00:00').toISOString(),
                points: jjPoints,
                group: 'jiujitsu',
                label: 'Treino de jiu-jitsu',
              },
            ],
          })
          toast(`🥋 Treino registrado! +${jjPoints} XP`, 'xp')
          afterEarn(xpBefore)
        },

        removeTraining: (day) =>
          set((s) => ({
            trainings: s.trainings.filter((d) => d !== day),
            ledger: s.ledger.filter((e) => e.id !== `jj-${day}`),
          })),

        addReading: (day) => {
          const s = get()
          if (s.readings.includes(day)) return
          const xpBefore = totalXp(s.ledger)
          const pts = s.weights.leitura ?? DEFAULT_WEIGHTS.leitura
          set({
            readings: [...s.readings, day].sort(),
            ledger: [
              ...s.ledger,
              {
                id: `read-${day}`,
                ts: new Date(day + 'T21:00:00').toISOString(),
                points: pts,
                group: 'estudos',
                label: 'Leitura diária (1h)',
              },
            ],
          })
          toast(`📚 Leitura registrada! +${pts} XP`, 'xp')
          afterEarn(xpBefore)
        },

        removeReading: (day) =>
          set((s) => ({
            readings: s.readings.filter((d) => d !== day),
            ledger: s.ledger.filter((e) => e.id !== `read-${day}`),
          })),

        promoteJJ: () => {
          const s = get()
          let belt = s.jjBeltIndex
          let degree = s.jjDegree
          if (degree < 4) {
            degree += 1
          } else if (belt < BELTS.length - 1) {
            belt += 1
            degree = 0
          } else {
            return // topo da escala
          }
          set({ jjBeltIndex: belt, jjDegree: degree, jjPromotedAt: todayKey() })
          toast(`🥋 OSS! Graduação: ${jjTitle(belt, degree)}!`, 'level')
        },

        setTurma: (turma) =>
          set((s) => ({
            turma,
            schedule: [
              ...s.schedule.filter((e) => !e.id.startsWith('aula-')),
              ...aulasForTurma(turma),
            ],
          })),

        pushToast: toast,
        dismissToast: (id) =>
          set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

        exportData: () => {
          const { heroName, categories, weights, tasks, studyItems, ledger, rewards, schedule, turma, trainings, readings, jjBeltIndex, jjDegree, jjPromotedAt, seenAchievements } = get()
          return JSON.stringify(
            { version: 2, heroName, categories, weights, tasks, studyItems, ledger, rewards, schedule, turma, trainings, readings, jjBeltIndex, jjDegree, jjPromotedAt, seenAchievements },
            null,
            2,
          )
        },

        importData: (json) => {
          try {
            const d = JSON.parse(json)
            if (!d || typeof d !== 'object' || !Array.isArray(d.ledger)) return false
            set({
              heroName: d.heroName ?? 'Guerreiro',
              categories: Array.isArray(d.categories) && d.categories.length ? d.categories : [...DEFAULT_CATEGORIES],
              weights: { ...DEFAULT_WEIGHTS, ...(d.weights ?? {}) },
              tasks: d.tasks ?? [],
              studyItems: d.studyItems ?? [],
              ledger: d.ledger,
              rewards: d.rewards ?? DEFAULT_REWARDS,
              schedule: d.schedule ?? DEFAULT_SCHEDULE,
              turma: d.turma ?? DEFAULT_TURMA,
              trainings: d.trainings ?? [],
              readings: d.readings ?? [],
              jjBeltIndex: d.jjBeltIndex ?? 0,
              jjDegree: d.jjDegree ?? 0,
              jjPromotedAt: d.jjPromotedAt ?? null,
              seenAchievements: d.seenAchievements ?? [],
            })
            return true
          } catch {
            return false
          }
        },

        resetPoints: () => {
          set((s) => ({
            ledger: [],
            seenAchievements: [],
            tasks: s.tasks.map((t) => ({ ...t, doneAt: null })),
            studyItems: s.studyItems.map((i) => ({ ...i, doneUnits: 0, awarded: 0 })),
          }))
          toast('🌅 Nova temporada! Pontos, XP e sequência zerados.', 'level')
        },

        resetAll: () =>
          set({
            heroName: 'Guerreiro',
            categories: [...DEFAULT_CATEGORIES],
            weights: { ...DEFAULT_WEIGHTS },
            tasks: [],
            studyItems: [],
            ledger: [],
            rewards: DEFAULT_REWARDS,
            schedule: DEFAULT_SCHEDULE,
            turma: DEFAULT_TURMA,
            trainings: [],
            readings: [],
            jjBeltIndex: 0,
            jjDegree: 0,
            jjPromotedAt: null,
            seenAchievements: [],
          }),
      }
    },
    {
      name: 'guilda-ita',
      version: 4,
      // v2: turma do usuário confirmada = 4; regenera as aulas uma única vez.
      // v3: categorias viram dados editáveis no estado.
      // v4: leitura diária (dias lidos + categoria/peso "leitura").
      migrate: (persisted, version) => {
        const p = persisted as Partial<State> | undefined
        if (p && version < 2 && Array.isArray(p.schedule)) {
          p.turma = DEFAULT_TURMA
          p.schedule = [
            ...p.schedule.filter((e) => !e.id.startsWith('aula-')),
            ...aulasForTurma(DEFAULT_TURMA),
          ]
        }
        if (p && (!Array.isArray(p.categories) || p.categories.length === 0)) {
          p.categories = [...DEFAULT_CATEGORIES]
        }
        if (p && version < 4) {
          p.readings ??= []
          if (Array.isArray(p.categories) && !p.categories.some((c) => c.id === 'leitura')) {
            const leitura = DEFAULT_CATEGORIES.find((c) => c.id === 'leitura')!
            const at = p.categories.findIndex((c) => c.id === 'material')
            p.categories.splice(at === -1 ? p.categories.length : at + 1, 0, leitura)
          }
          if (p.weights && p.weights.leitura === undefined) {
            p.weights.leitura = DEFAULT_WEIGHTS.leitura
          }
        }
        return p as State
      },
      partialize: (s) => ({
        heroName: s.heroName,
        categories: s.categories,
        weights: s.weights,
        tasks: s.tasks,
        studyItems: s.studyItems,
        ledger: s.ledger,
        rewards: s.rewards,
        schedule: s.schedule,
        turma: s.turma,
        trainings: s.trainings,
        readings: s.readings,
        jjBeltIndex: s.jjBeltIndex,
        jjDegree: s.jjDegree,
        jjPromotedAt: s.jjPromotedAt,
        seenAchievements: s.seenAchievements,
      }),
    },
  ),
)
