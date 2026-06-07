import type { DashboardOverview } from '@/types'

export const mockDashboard: DashboardOverview = {
  monthly_spend: 28450,
  monthly_savings: 11550,
  financial_health_score: 82,
  subscription_costs: 2490,
  budget_utilization: 71.2,
  upcoming_bills: [
    { merchant: 'Electricity Board', expected_amount: 1840, due_in_days: 2, due_date: '2026-06-05' },
    { merchant: 'Mobile Plan', expected_amount: 799, due_in_days: 5, due_date: '2026-06-08' },
  ],
  insights: [
    { id: 'i1', title: 'Food spending increased by 42% this month.', detail: 'Delivery and dining are your fastest growing spend categories.', severity: 'warning' },
    { id: 'i2', title: 'Detected 3 recurring subscriptions.', detail: 'Your recurring stack is stable but one service looks underused.', severity: 'info' },
    { id: 'i3', title: 'You can save ₹2500/month by reducing delivery spending.', detail: 'A 20% cut in delivery spend creates room for faster goal completion.', severity: 'positive' },
    { id: 'i4', title: 'Electricity bill expected in 2 days.', detail: 'The Bill Prediction Agent has forecast the next bill cycle.', severity: 'warning' },
  ],
  subscriptions: [
    { merchant: 'Netflix', monthly_cost: 649, last_seen: '2026-06-01', status: 'active' },
    { merchant: 'Spotify', monthly_cost: 299, last_seen: '2026-06-02', status: 'active' },
    { merchant: 'Gym Membership', monthly_cost: 1542, last_seen: '2026-06-01', status: 'watch' },
  ],
  health_breakdown: {
    savings_ratio: 22,
    subscription_burden: 16,
    spending_discipline: 18,
    emergency_reserve: 12,
    budget_adherence: 14,
  },
  challenge: 'No Swiggy Week: cap delivery spend at ₹0 for 7 days and redirect the savings to your emergency fund.',
  monthly_trend: [
    { month: 'Jan', spend: 22000 },
    { month: 'Feb', spend: 24800 },
    { month: 'Mar', spend: 27300 },
    { month: 'Apr', spend: 26100 },
    { month: 'May', spend: 28450 },
  ],
  category_breakdown: [
    { name: 'Bills', value: 12900 },
    { name: 'Food', value: 8200 },
    { name: 'Shopping', value: 5100 },
    { name: 'Entertainment', value: 4200 },
    { name: 'Transport', value: 1800 },
  ],
  heatmap: Array.from({ length: 14 }, (_, index) => ({ day: index % 7, week: Math.floor(index / 7), value: 250 + index * 20 })),
  goals: [
    { id: 'g1', name: 'Emergency Fund', target_amount: 200000, current_amount: 72000, monthly_savings_target: 12000, progress: 36, estimated_completion: '2026-12-01' },
    { id: 'g2', name: 'Buy iPhone', target_amount: 120000, current_amount: 26000, monthly_savings_target: 8000, progress: 21.7, estimated_completion: '2026-12-20' },
  ],
  transactions: [
    { id: 't1', date: '2026-06-01', merchant: 'Swiggy', amount: 980, category: 'Food', source: 'demo', confidence: 0.98 },
    { id: 't2', date: '2026-06-02', merchant: 'Netflix', amount: 649, category: 'Entertainment', source: 'demo', confidence: 0.97 },
    { id: 't3', date: '2026-06-03', merchant: 'Electricity Board', amount: 1840, category: 'Bills', source: 'demo', confidence: 0.94 },
  ],
  health_summary: 'Healthy trajectory with room to reduce subscriptions and improve savings consistency.',
  overspending_risk: {
    risk_percentage: 38,
    risk_label: 'Medium',
    spend_vs_income_pct: 71.2,
    projected_monthly_spend: 31200,
  },
}
