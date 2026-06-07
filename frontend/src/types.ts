export type Tone = 'positive' | 'warning' | 'info' | 'critical' | 'success'

export type Insight = {
  id: string
  title: string
  detail: string
  severity: Tone
  action_label?: string
}

export type Transaction = {
  id: string
  date: string
  merchant: string
  amount: number
  category: string
  source: string
  confidence?: number
  type?: 'credit' | 'debit'
}

export type Goal = {
  id: string
  name: string
  target_amount: number
  current_amount: number
  monthly_savings_target: number
  target_date?: string | null
  progress: number
  estimated_completion?: string | null
}

export type DashboardOverview = {
  monthly_spend: number
  monthly_savings: number
  financial_health_score: number
  subscription_costs: number
  budget_utilization: number
  upcoming_bills: Array<{ merchant: string; expected_amount: number; due_in_days: number; due_date: string }>
  insights: Insight[]
  subscriptions: Array<{ merchant: string; monthly_cost: number; last_seen?: string | null; status: string }>
  health_breakdown: Record<string, number>
  challenge: string
  monthly_trend: Array<{ month: string; spend: number }>
  category_breakdown: Array<{ name: string; value: number }>
  heatmap: Array<{ day: number; week: number; value: number }>
  goals?: Goal[]
  transactions?: Transaction[]
  health_summary?: string
  history?: HistoryRecord[]
  overspending_risk?: {
    risk_percentage: number
    risk_label: 'Low' | 'Medium' | 'High'
    spend_vs_income_pct: number
    projected_monthly_spend: number
  }
}

export type HistoryRecord = {
  id: string
  month: string
  month_label: string
  total_income: number
  total_expenses: number
  total_savings: number
  savings_percentage: number
  food_expenses: number
  shopping_expenses: number
  entertainment_expenses: number
  bills_expenses: number
  transport_expenses: number
  education_expenses: number
  health_expenses: number
  investments: number
  subscription_costs: number
  financial_health_score: number
  budget_status: string
  overspending_alerts: string[]
  ai_recommendation_summary: string
  goal_progress: number
  risk_indicator: string
  category_breakdown: Array<{ name: string; value: number }>
  insights: Insight[]
  subscriptions: Array<{ merchant: string; monthly_cost: number; last_seen?: string | null; status: string }>
  trend: Array<{ month: string; spend: number }>
}

export type UploadResponse = {
  file_name: string
  processed_transactions: number
  overview: DashboardOverview
  transactions: Transaction[]
}

export type AuthUser = { id: string; name: string; email: string }
export type AuthPayload = { user: AuthUser | null; token: string | null }
