import { create } from 'zustand'

import { createGoal, deleteGoal, fetchDashboard, login, register, updateGoal, uploadStatement } from '@/lib/api'
import type { AuthPayload, DashboardOverview } from '@/types'

type Mode = 'landing' | 'auth' | 'dashboard'

type AppState = {
  mode: Mode
  auth: AuthPayload
  dashboard: DashboardOverview
  loading: boolean
  error: string | null
  setMode: (mode: Mode) => void
  hydrate: () => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  loadDashboard: () => Promise<void>
  uploadFile: (file: File) => Promise<{ processed_transactions: number; months: number } | null>
  addGoal: (payload: { name: string; target_amount: number; current_amount: number; monthly_savings_target: number; target_date?: string | null }) => Promise<void>
  editGoal: (goalId: string, payload: { name: string; target_amount: number; current_amount: number; monthly_savings_target: number; target_date?: string | null }) => Promise<void>
  removeGoal: (goalId: string) => Promise<void>
  logout: () => void
}

const authKey = 'finpilot-auth'

const emptyDashboard: DashboardOverview = {
  monthly_spend: 0,
  monthly_savings: 0,
  financial_health_score: 0,
  subscription_costs: 0,
  budget_utilization: 0,
  upcoming_bills: [],
  insights: [],
  subscriptions: [],
  health_breakdown: {},
  challenge: 'Upload a statement to generate autonomous financial analysis.',
  monthly_trend: [],
  category_breakdown: [],
  heatmap: [],
  goals: [],
  transactions: [],
  health_summary: 'No statement has been analyzed yet.',
  overspending_risk: { risk_percentage: 0, risk_label: 'Low', spend_vs_income_pct: 0, projected_monthly_spend: 0 },
}

function persistAuth(auth: AuthPayload | null) {
  if (!auth) {
    window.localStorage.removeItem(authKey)
    return
  }
  window.localStorage.setItem(authKey, JSON.stringify(auth))
}

export const useAppStore = create<AppState>((set, get) => ({
  mode: 'landing',
  auth: { user: null, token: null },
  dashboard: emptyDashboard,
  loading: false,
  error: null,
  setMode: (mode) => set({ mode }),
  hydrate: () => {
    const raw = window.localStorage.getItem(authKey)
    if (!raw) return
    const auth = JSON.parse(raw) as AuthPayload
    set({ auth, mode: auth.token ? 'dashboard' : 'auth' })
    if (auth.token) {
      get().loadDashboard().catch(() => undefined)
    }
  },
  signIn: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const response = await login(email, password)
      const auth = { user: response.user, token: response.token }
      persistAuth(auth)
      set({ auth, mode: 'dashboard', error: null })
      await get().loadDashboard()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed.'
      const friendly = msg.toLowerCase().includes('invalid credentials') || msg.includes('401')
        ? 'Invalid email or password.'
        : msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('networkerror')
        ? 'Cannot reach the backend. Make sure the server is running on port 8000.'
        : msg
      set({ error: friendly })
      persistAuth(null)
    } finally {
      set({ loading: false })
    }
  },
  signUp: async (name, email, password) => {
    set({ loading: true, error: null })
    try {
      const response = await register(name, email, password)
      const auth = { user: response.user, token: response.token }
      persistAuth(auth)
      set({ auth, mode: 'dashboard', error: null })
      await get().loadDashboard()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed.'
      const friendly = msg.toLowerCase().includes('already exists')
        ? 'An account with this email already exists. Try signing in instead.'
        : msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('networkerror')
        ? 'Cannot reach the backend. Make sure the server is running on port 8000.'
        : msg
      set({ error: friendly })
      persistAuth(null)
    } finally {
      set({ loading: false })
    }
  },
  loadDashboard: async () => {
    try {
      const dashboard = await fetchDashboard()
      set({ dashboard })
    } catch {
      set({ dashboard: emptyDashboard })
    }
  },
  uploadFile: async (file) => {
    set({ loading: true, error: null })
    try {
      const response = await uploadStatement(file)
      set({ dashboard: { ...response.overview, transactions: response.transactions } })
      // count distinct months in the transactions
      const months = new Set(response.transactions.map((t) => t.date.slice(0, 7))).size
      return { processed_transactions: response.processed_transactions, months }
    } catch {
      set({ error: 'Statement upload failed. Make sure the backend is running and you are signed in.' })
      return null
    } finally {
      set({ loading: false })
    }
  },
  addGoal: async (payload) => {
    set({ loading: true, error: null })
    try {
      const response = await createGoal(payload)
      set((state) => ({ dashboard: { ...state.dashboard, goals: [response.goal, ...(state.dashboard.goals ?? [])] } }))
    } catch {
      set({ error: 'Goal creation failed. Make sure the backend is running and authenticated.' })
    } finally {
      set({ loading: false })
    }
  },
  editGoal: async (goalId, payload) => {
    set({ loading: true, error: null })
    try {
      const response = await updateGoal(goalId, payload)
      set((state) => ({
        dashboard: {
          ...state.dashboard,
          goals: (state.dashboard.goals ?? []).map((g) => g.id === goalId ? response.goal : g),
        },
      }))
    } catch {
      set({ error: 'Goal update failed.' })
    } finally {
      set({ loading: false })
    }
  },
  removeGoal: async (goalId) => {
    set({ loading: true, error: null })
    try {
      await deleteGoal(goalId)
      set((state) => ({
        dashboard: {
          ...state.dashboard,
          goals: (state.dashboard.goals ?? []).filter((g) => g.id !== goalId),
        },
      }))
    } catch {
      set({ error: 'Goal deletion failed.' })
    } finally {
      set({ loading: false })
    }
  },
  logout: () => {
    persistAuth(null)
    set({ auth: { user: null, token: null }, mode: 'landing', dashboard: emptyDashboard, error: null })
  },
}))
