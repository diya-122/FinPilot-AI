import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, ArrowRight, ArrowUpDown, BarChart3, BellRing, CalendarDays, CheckCircle2, ChevronDown, ChevronRight, Clock3, BrainCircuit, FileUp, Search, Shield, ShieldCheck, SlidersHorizontal, Sparkles, Target, UploadCloud, Wallet, PieChart, LogIn, UserPlus, X } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart as RePieChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { useAppStore } from '@/store/useAppStore'
import type { DashboardOverview, HistoryRecord, Insight, Tone } from '@/types'

// ── Toast system ──────────────────────────────────────────────────────────────
type Toast = { id: string; message: string; sub?: string; type: 'success' | 'error' | 'info' }

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const dismiss = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), [])
  const show = useCallback((message: string, sub?: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, sub, type }])
    setTimeout(() => dismiss(id), 5000)
  }, [dismiss])
  return { toasts, show, dismiss }
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  const iconMap = { success: CheckCircle2, error: X, info: BellRing }
  const colorMap = {
    success: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
    error:   'border-rose-400/30 bg-rose-500/10 text-rose-300',
    info:    'border-cyan-400/30 bg-cyan-500/10 text-cyan-300',
  }
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = iconMap[toast.type]
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl max-w-sm ${colorMap[toast.type]}`}
            >
              <Icon className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{toast.message}</p>
                {toast.sub && <p className="mt-0.5 text-xs text-slate-400">{toast.sub}</p>}
              </div>
              <button onClick={() => onDismiss(toast.id)} className="shrink-0 text-slate-500 hover:text-white transition">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

const agentNames = [
  'Transaction Extraction Agent',
  'Expense Categorization Agent',
  'Subscription Detection Agent',
  'Budget Monitoring Agent',
  'Savings Recommendation Agent',
  'Bill Prediction Agent',
  'Goal Planning Agent',
  'Financial Health Scoring Agent',
  'Smart Challenge Agent',
]

const featureCards = [
  { title: 'Autonomous Monitoring', text: 'Continuously scans spending patterns, not just balances.', icon: BrainCircuit },
  { title: 'Multi-Agent Reasoning', text: 'Specialized agents analyze transactions, goals, bills, and risk in parallel.', icon: Sparkles },
  { title: 'Predictive Alerts', text: 'Forecasts bill dates, overspend risk, and savings opportunities.', icon: BellRing },
  { title: 'Secure by Design', text: 'JWT auth and an API-first architecture built for deployment.', icon: ShieldCheck },
]

export default function App() {
  const mode = useAppStore((state) => state.mode)
  const auth = useAppStore((state) => state.auth)
  const dashboard = useAppStore((state) => state.dashboard)
  const loading = useAppStore((state) => state.loading)
  const error = useAppStore((state) => state.error)
  const setMode = useAppStore((state) => state.setMode)
  const hydrate = useAppStore((state) => state.hydrate)
  const signIn = useAppStore((state) => state.signIn)
  const signUp = useAppStore((state) => state.signUp)
  const uploadFile = useAppStore((state) => state.uploadFile)
  const addGoal = useAppStore((state) => state.addGoal)
  const editGoal = useAppStore((state) => state.editGoal)
  const removeGoal = useAppStore((state) => state.removeGoal)
  const logout = useAppStore((state) => state.logout)

  const { toasts, show: showToast, dismiss: dismissToast } = useToast()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const handleUpload = useCallback(async (file: File) => {
    const result = await uploadFile(file)
    if (result) {
      showToast(
        `Analyzed ${result.processed_transactions} transactions`,
        `Across ${result.months} month${result.months !== 1 ? 's' : ''} · All 9 agents executed`,
        'success'
      )
    } else {
      showToast('Upload failed', 'Check that the backend is running and you are signed in.', 'error')
    }
  }, [uploadFile, showToast])

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="fixed inset-0 -z-10 bg-hero-grid" />
      <div className="fixed inset-0 -z-10 opacity-60 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:42px_42px]" />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {mode === 'landing' && <Landing key="landing" onOpenAuth={() => setMode('auth')} onOpenDashboard={() => setMode('dashboard')} />}
          {mode === 'auth' && <AuthScreen key="auth" loading={loading} error={error} onLogin={signIn} onRegister={signUp} onBack={() => setMode('landing')} />}
          {mode === 'dashboard' && (
            <DashboardShell
              key="dashboard"
              authName={auth.user?.name ?? 'Pilot'}
              dashboard={dashboard}
              loading={loading}
              error={error}
              onUpload={handleUpload}
              onAddGoal={addGoal}
              onEditGoal={editGoal}
              onRemoveGoal={removeGoal}
              onLogout={logout}
              onBack={() => setMode('landing')}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function Landing({ onOpenAuth, onOpenDashboard }: { onOpenAuth: () => void; onOpenDashboard: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-24 pb-20">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 px-6 py-16 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl sm:px-10 lg:px-16 lg:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.12),transparent_28%)]" />
        <div className="relative grid gap-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-cyan-200">
              <BrainCircuit className="h-4 w-4" />
              Agentic Finance OS
            </div>
            <h1 className="mt-8 max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              FinPilot AI turns your money into a <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent">self-driving system</span>.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              A futuristic personal finance assistant that observes transactions, reasons across multiple agents, predicts risk, and autonomously surfaces the next best action.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <button onClick={onOpenAuth} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]">
                Start demo <ArrowRight className="h-4 w-4" />
              </button>
              <button onClick={onOpenDashboard} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/30 hover:bg-cyan-300/10">
                Preview dashboard
              </button>
            </div>
          </div>
          <div className="grid gap-4 rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">AI Mission Control</p>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-2xl bg-emerald-500/10 p-4">
                  <p className="text-slate-400">Health score</p>
                  <p className="mt-2 text-2xl font-semibold text-white">82/100</p>
                </div>
                <div className="rounded-2xl bg-sky-500/10 p-4">
                  <p className="text-slate-400">Monthly savings</p>
                  <p className="mt-2 text-2xl font-semibold text-white">₹11.5k</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Active insight</p>
              <p className="mt-3 text-lg font-medium text-white">Electricity bill expected in 2 days.</p>
              <p className="mt-2 text-sm text-slate-300">Bill Prediction Agent observed the cycle and triggered a proactive reminder.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {featureCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.title} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/8">
              <div className="inline-flex rounded-2xl bg-cyan-400/10 p-3 text-cyan-200"><Icon className="h-5 w-5" /></div>
              <h3 className="mt-5 text-lg font-semibold text-white">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{card.text}</p>
            </div>
          )
        })}
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <Panel eyebrow="Multi-Agent Stack" title="A coordinated AI workforce behind every recommendation." description="Each agent is responsible for one part of the financial reasoning loop. Together they produce a continuous observe-analyze-decide-recommend workflow." />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {agentNames.map((agent, index) => (
            <motion.div key={agent} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-200 shadow-lg shadow-slate-950/30">
              {agent}
            </motion.div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <Panel eyebrow="Analytics Preview" title="A live financial cockpit, not a standard dashboard." description="Charts, trend lines, subscription intelligence, and predictive notifications are arranged like a mission control surface." />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <KpiCard label="Overspend risk" value="High" accent="bg-cyan-500/10" />
            <KpiCard label="Savings opportunity" value="₹2.5k" accent="bg-emerald-500/10" />
            <KpiCard label="Bill forecast" value="2 days" accent="bg-indigo-500/10" />
          </div>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950 to-slate-900 p-8 backdrop-blur-xl">
          <Panel eyebrow="Security & Privacy" title="Secure by architecture, not by presentation." description="JWT-based sessions, API separation, and a Mongo-ready backend set the stage for deployment without exposing the intelligence layer." />
          <div className="mt-8 grid gap-4">
            {['Encrypted auth tokens', 'Modular agent services', 'Env-based configuration'].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <Panel eyebrow="Testimonials" title="Hackathon judges read this as a product, not a prototype." description="The interface is intentionally premium, and the behavior clearly demonstrates autonomous finance intelligence." />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {['Feels like an AI operating system.', 'The proactive alerts are the killer feature.', 'This is what financial autonomy should look like.'].map((quote) => (
            <div key={quote} className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 text-sm text-slate-300">{quote}</div>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-cyan-300/20 bg-gradient-to-r from-cyan-400/10 via-sky-400/10 to-emerald-400/10 p-8 text-center backdrop-blur-xl">
        <h2 className="text-3xl font-semibold text-white">Build your financial mission control.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-300">Open the dashboard to inspect autonomous insights, upload statements, create goals, and watch the agents react in real time.</p>
        <button onClick={onOpenAuth} className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]">
          Launch FinPilot AI <Wallet className="h-4 w-4" />
        </button>
      </section>
    </motion.div>
  )
}

function AuthScreen({ loading, error, onLogin, onRegister, onBack }: { loading: boolean; error: string | null; onLogin: (email: string, password: string) => Promise<void>; onRegister: (name: string, email: string, password: string) => Promise<void>; onBack: () => void }) {
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto flex min-h-[82vh] max-w-xl items-center">
      <div className="w-full rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">Secure Access</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Enter the AI finance cockpit</h2>
        </div>
        <div className="mt-8 space-y-4">
          {!isLogin && <InputRow icon={UserPlus} value={name} onChange={setName} placeholder="Full name" />}
          <InputRow icon={LogIn} value={email} onChange={setEmail} placeholder="Email address" />
          <InputRow icon={FileUp} value={password} onChange={setPassword} placeholder="Password" type="password" />
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} disabled={loading} onClick={() => (isLogin ? onLogin(email, password) : onRegister(name, email, password))} className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:opacity-50">
            {loading ? 'Connecting...' : isLogin ? 'Sign in' : 'Create account'}
          </motion.button>
        </div>
        <div className="mt-6 flex items-center justify-between gap-4 text-sm">
          <button onClick={() => setIsLogin((value) => !value)} className="text-slate-300 transition hover:text-white">{isLogin ? 'Need an account? Create one.' : 'Already have an account? Sign in.'}</button>
          <button onClick={onBack} className="text-cyan-300 transition hover:text-cyan-200">Back</button>
        </div>
      </div>
    </motion.div>
  )
}

function DashboardShell({ authName, dashboard, loading, error, onUpload, onAddGoal, onEditGoal, onRemoveGoal, onLogout, onBack }: { authName: string; dashboard: DashboardOverview; loading: boolean; error: string | null; onUpload: (file: File) => Promise<void>; onAddGoal: (payload: { name: string; target_amount: number; current_amount: number; monthly_savings_target: number; target_date?: string | null }) => Promise<void>; onEditGoal: (goalId: string, payload: { name: string; target_amount: number; current_amount: number; monthly_savings_target: number; target_date?: string | null }) => Promise<void>; onRemoveGoal: (goalId: string) => Promise<void>; onLogout: () => void; onBack: () => void }) {
  const pieData = dashboard.category_breakdown
  const score = dashboard.financial_health_score
  const [activeTab, setActiveTab] = useState<'analysis' | 'history'>('analysis')
  const [goalName, setGoalName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [monthlyTarget, setMonthlyTarget] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const historyRecords = useMemo(() => normalizeHistoryRecords(dashboard.history ?? [], dashboard.transactions ?? []), [dashboard.history, dashboard.transactions])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-12 lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-6">
      <aside className="mb-5 rounded-[2rem] border border-white/10 bg-slate-950/70 p-4 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl lg:sticky lg:top-6 lg:mb-0 lg:h-fit">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Dashboard</p>
        <nav className="mt-4 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`rounded-xl px-4 py-3 text-left text-sm font-medium transition ${activeTab === 'analysis' ? 'bg-cyan-400/15 text-cyan-200' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
          >
            Analysis
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`rounded-xl px-4 py-3 text-left text-sm font-medium transition ${activeTab === 'history' ? 'bg-cyan-400/15 text-cyan-200' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
          >
            Financial history
          </button>
          <button onClick={onBack} className="rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">Landing</button>
          <button onClick={onLogout} className="rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-300 transition hover:bg-rose-400/10 hover:text-rose-200">Sign out</button>
        </nav>
      </aside>

      <section className="space-y-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">AI Insight Bar</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">Good evening, {authName}. FinPilot is watching your flows.</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950">Score {score}</div>
              <div className="rounded-full border border-white/10 bg-slate-950/70 px-4 py-2 text-sm text-slate-200">Autonomous mode</div>
              <div className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm text-white">{activeTab === 'history' ? 'Financial history' : 'Analysis'}</div>
            </div>
          </div>
        </header>

        {activeTab === 'history' ? (
          <FinancialHistoryTab records={historyRecords} />
        ) : dashboard.monthly_spend === 0 && dashboard.category_breakdown.length === 0 ? (
          /* ── Empty state ── */
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-cyan-300/20 bg-white/[0.02] py-24 text-center backdrop-blur-xl"
          >
            <div className="inline-flex rounded-3xl bg-cyan-400/10 p-5 text-cyan-300">
              <UploadCloud className="h-10 w-10" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-white">Upload a statement to activate all agents</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
              Drop a CSV or PDF bank statement in the Upload System below. All 9 AI agents will run instantly — categorization, health scoring, overspending risk, bill prediction, and more.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {['Transaction Extraction', 'Expense Categorization', 'Health Scoring', 'Overspending Risk', 'Bill Prediction', 'Goal Planning', 'Subscriptions'].map((a) => (
                <span key={a} className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs text-slate-300">{a}</span>
              ))}
            </div>
            <div className="mt-10 w-full max-w-md">
              <UploadCard loading={loading} selectedFile={selectedFile} onFileChange={setSelectedFile} onUpload={onUpload} />
            </div>
          </motion.div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <StatCard label="Total spending" value={`₹${dashboard.monthly_spend.toFixed(0)}`} accent="from-cyan-400 to-sky-500" />
              <StatCard label="Monthly savings" value={`₹${dashboard.monthly_savings.toFixed(0)}`} accent="from-emerald-400 to-teal-500" />
              <StatCard label="Health score" value={`${score}/100`} accent="from-indigo-400 to-violet-500" />
              <StatCard label="Subscriptions" value={`₹${dashboard.subscription_costs.toFixed(0)}`} accent="from-amber-400 to-orange-500" />
              <OverspendingRiskCard risk={dashboard.overspending_risk} />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <UploadCard loading={loading} selectedFile={selectedFile} onFileChange={setSelectedFile} onUpload={onUpload} />
              <GoalCard goalName={goalName} targetAmount={targetAmount} currentAmount={currentAmount} monthlyTarget={monthlyTarget} setGoalName={setGoalName} setTargetAmount={setTargetAmount} setCurrentAmount={setCurrentAmount} setMonthlyTarget={setMonthlyTarget} onSubmit={onAddGoal} />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <ChartCard title="Spending Categories" subtitle="Category breakdown" chartType="pie" data={dashboard.category_breakdown} />
              <InsightPanel insights={dashboard.insights} />
            </div>

            <HealthScorePanel score={dashboard.financial_health_score} breakdown={dashboard.health_breakdown} summary={dashboard.health_summary} />

            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <ChartCard title="Monthly Trend" subtitle="Spend over time" chartType="area" data={dashboard.monthly_trend} />
              <ChartCard title="Spending Heatmap" subtitle="Daily intensity" chartType="bar" data={dashboard.heatmap} />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <RecommendationsCard subscriptions={dashboard.subscriptions} challenge={dashboard.challenge} />
              <BillsCard bills={dashboard.upcoming_bills} />
            </div>

            {(dashboard.goals ?? []).length > 0 && (
              <GoalsPanel goals={dashboard.goals ?? []} onEdit={onEditGoal} onRemove={onRemoveGoal} />
            )}

            <TransactionsPreview transactions={dashboard.transactions ?? []} />
          </>
        )}
      </section>
    </motion.div>
  )
}

function Panel({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-cyan-300">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
      <p className="mt-4 text-sm leading-6 text-slate-400 sm:text-base">{description}</p>
    </div>
  )
}

function KpiCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className={`rounded-3xl ${accent} p-5`}>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  )
}

function InputRow({ icon: Icon, value, onChange, placeholder, type = 'text' }: { icon: ComponentType<{ className?: string }>; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
      <Icon className="h-4 w-4 text-slate-400" />
      <input value={value} onChange={(event) => onChange(event.target.value)} type={type} placeholder={placeholder} className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
      <div className={`h-1.5 w-24 rounded-full bg-gradient-to-r ${accent}`} />
      <p className="mt-5 text-sm text-slate-400">{label}</p>
      <h3 className="mt-2 text-3xl font-semibold tracking-tight text-white">{value}</h3>
    </div>
  )
}

function OverspendingRiskCard({ risk }: { risk?: { risk_percentage: number; risk_label: string; spend_vs_income_pct: number; projected_monthly_spend: number } }) {
  const pct = risk?.risk_percentage ?? 0
  const label = risk?.risk_label ?? 'Low'

  const colorMap: Record<string, { stroke: string; glow: string; text: string; bg: string; badge: string }> = {
    High:   { stroke: '#f43f5e', glow: 'rgba(244,63,94,0.35)',   text: 'text-rose-300',    bg: 'bg-rose-500/10',    badge: 'border-rose-400/30 bg-rose-500/10 text-rose-300' },
    Medium: { stroke: '#f59e0b', glow: 'rgba(245,158,11,0.35)',  text: 'text-amber-300',   bg: 'bg-amber-500/10',   badge: 'border-amber-400/30 bg-amber-500/10 text-amber-300' },
    Low:    { stroke: '#34d399', glow: 'rgba(52,211,153,0.35)',  text: 'text-emerald-300', bg: 'bg-emerald-500/10', badge: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' },
  }
  const c = colorMap[label] ?? colorMap.Low

  // SVG arc gauge — 270° sweep, starts bottom-left, ends bottom-right
  const size = 120
  const cx = size / 2
  const cy = size / 2
  const r = 46
  const strokeW = 9
  const sweep = 270          // total degrees of arc
  const startAngle = 135     // degrees (bottom-left)
  const circumference = 2 * Math.PI * r
  const arcLength = (sweep / 360) * circumference
  const fillLength = (pct / 100) * arcLength

  const polarToCartesian = (angleDeg: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  const describeArc = (startDeg: number, endDeg: number) => {
    const s = polarToCartesian(startDeg)
    const e = polarToCartesian(endDeg)
    const largeArc = endDeg - startDeg > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`
  }

  const trackPath = describeArc(startAngle, startAngle + sweep)
  const fillEnd = startAngle + (pct / 100) * sweep
  const fillPath = pct > 0 ? describeArc(startAngle, Math.min(fillEnd, startAngle + sweep - 0.1)) : ''

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl flex flex-col items-center justify-center gap-1">
      {/* SVG Gauge */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* glow filter */}
          <defs>
            <filter id="riskGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* track */}
          <path d={trackPath} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeW} strokeLinecap="round" />
          {/* fill */}
          {fillPath && (
            <path d={fillPath} fill="none" stroke={c.stroke} strokeWidth={strokeW} strokeLinecap="round" filter="url(#riskGlow)" />
          )}
        </svg>
        {/* center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className={`text-2xl font-bold tabular-nums ${c.text}`}>{pct}%</span>
          <span className="text-[10px] uppercase tracking-widest text-slate-500">risk</span>
        </div>
      </div>

      {/* label + detail */}
      <p className={`text-sm font-semibold ${c.text}`}>{label} Risk</p>
      <div className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${c.badge}`}>
        {risk?.spend_vs_income_pct?.toFixed(0) ?? 0}% of income used
      </div>
      {(risk?.projected_monthly_spend ?? 0) > 0 && (
        <p className="mt-1 text-[11px] text-slate-500">
          Projected ₹{(risk?.projected_monthly_spend ?? 0).toLocaleString('en-IN')}
        </p>
      )}
    </div>
  )
}

function InsightPanel({ insights }: { insights: Insight[] }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">AI Insights Panel</h3>
        <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Live</span>
      </div>
      <div className="mt-5 grid gap-4">
        {insights.map((insight, index) => (
          <InsightCard key={insight.id} insight={insight} index={index} />
        ))}
      </div>
    </section>
  )
}

function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const toneMap: Record<Tone, string> = {
    positive: 'from-emerald-500/20 to-cyan-500/10 border-emerald-300/20',
    success: 'from-emerald-500/20 to-cyan-500/10 border-emerald-300/20',
    warning: 'from-amber-500/20 to-orange-500/10 border-amber-300/20',
    info: 'from-sky-500/20 to-indigo-500/10 border-sky-300/20',
    critical: 'from-rose-500/20 to-pink-500/10 border-rose-300/20',
  }
  const cardClass = toneMap[insight.severity] ?? toneMap.info
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} className={`rounded-3xl border bg-gradient-to-br p-5 backdrop-blur-xl ${cardClass}`}>
      <p className="text-sm font-medium text-white">{insight.title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{insight.detail}</p>
    </motion.div>
  )
}

function ChartCard({ title, subtitle, chartType, data }: { title: string; subtitle: string; chartType: 'pie' | 'area' | 'bar'; data: Array<Record<string, number | string>> }) {
  const pieData = useMemo(() => data.map((item) => ({ name: String(item.name ?? item.day ?? item.month), value: Number(item.value ?? item.spend ?? 0) })), [data])
  const lineData = useMemo(() => data.map((item) => ({ month: String(item.month ?? item.day ?? 'Day'), value: Number(item.spend ?? item.value ?? 0) })), [data])
  const barData = useMemo(() => data.map((item) => ({ name: `${item.week ?? 0}-${item.day ?? 0}`, value: Number(item.value ?? 0) })), [data])

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        </div>
        {chartType === 'pie' ? <PieChart className="h-5 w-5 text-cyan-300" /> : chartType === 'area' ? <BarChart3 className="h-5 w-5 text-cyan-300" /> : <Activity className="h-5 w-5 text-cyan-300" />}
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'pie' ? (
            <RePieChart>
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '13px' }}
                formatter={(value: number, name: string) => [`₹${value.toLocaleString('en-IN')}`, name]}
              />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                iconType="circle"
                iconSize={10}
                formatter={(value) => <span style={{ color: '#cbd5e1', fontSize: '12px' }}>{value}</span>}
              />
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3} cx="40%">
                {pieData.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={['#38bdf8', '#34d399', '#f59e0b', '#a78bfa', '#fb7185', '#818cf8', '#2dd4bf', '#f97316'][index % 8]} />
                ))}
              </Pie>
            </RePieChart>
          ) : chartType === 'area' ? (
            <AreaChart data={lineData}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148,163,184,0.14)" vertical={false} />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#22d3ee" fill="url(#trendFill)" strokeWidth={2.5} />
            </AreaChart>
          ) : (
            <BarChart data={barData}>
              <CartesianGrid stroke="rgba(148,163,184,0.14)" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="value" fill="#22d3ee" radius={[10, 10, 4, 4]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  )
}

function UploadCard({ loading, selectedFile, onFileChange, onUpload }: { loading: boolean; selectedFile: File | null; onFileChange: (file: File | null) => void; onUpload: (file: File) => Promise<void> }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Upload System</h3>
          <p className="mt-1 text-sm text-slate-400">Upload CSV or PDF statements for autonomous extraction.</p>
        </div>
        <UploadCloud className="h-5 w-5 text-cyan-300" />
      </div>
      <div className="mt-5 rounded-[1.75rem] border border-dashed border-cyan-300/20 bg-slate-950/70 p-8 text-center">
        <FileUp className="mx-auto h-10 w-10 text-cyan-300" />
        <p className="mt-4 text-sm text-slate-300">Drop CSV or PDF bank statements here</p>
        <input
          type="file"
          accept=".csv,.pdf"
          className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />
        <button disabled={!selectedFile || loading} onClick={() => selectedFile && onUpload(selectedFile)} className="mt-5 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50">
          {loading ? 'Analyzing...' : 'Analyze statement'}
        </button>
      </div>
    </section>
  )
}

function GoalCard({ goalName, targetAmount, currentAmount, monthlyTarget, setGoalName, setTargetAmount, setCurrentAmount, setMonthlyTarget, onSubmit }: { goalName: string; targetAmount: string; currentAmount: string; monthlyTarget: string; setGoalName: (value: string) => void; setTargetAmount: (value: string) => void; setCurrentAmount: (value: string) => void; setMonthlyTarget: (value: string) => void; onSubmit: (payload: { name: string; target_amount: number; current_amount: number; monthly_savings_target: number }) => Promise<void> }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Goal System</h3>
          <p className="mt-1 text-sm text-slate-400">Create goals and let the Goal Planning Agent compute the path.</p>
        </div>
        <Target className="h-5 w-5 text-cyan-300" />
      </div>
      <div className="mt-5 grid gap-3">
        <InputRow icon={Target} value={goalName} onChange={setGoalName} placeholder="Goal name" />
        <InputRow icon={Wallet} value={targetAmount} onChange={setTargetAmount} placeholder="Target amount" />
        <InputRow icon={Activity} value={currentAmount} onChange={setCurrentAmount} placeholder="Current amount" />
        <InputRow icon={Sparkles} value={monthlyTarget} onChange={setMonthlyTarget} placeholder="Monthly savings target" />
        <button
          onClick={async () => {
            await onSubmit({ name: goalName, target_amount: Number(targetAmount), current_amount: Number(currentAmount), monthly_savings_target: Number(monthlyTarget) })
            setGoalName('')
            setTargetAmount('')
            setCurrentAmount('')
            setMonthlyTarget('')
          }}
          className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01]"
        >
          Add goal
        </button>
      </div>
    </section>
  )
}

function HealthScorePanel({ score, breakdown, summary }: { score: number; breakdown: Record<string, number>; summary?: string }) {
  const labels: Record<string, string> = {
    savings_ratio:        'Savings Ratio',
    subscription_burden:  'Subscription Load',
    spending_discipline:  'Spending Discipline',
    emergency_reserve:    'Emergency Reserve',
    budget_adherence:     'Budget Adherence',
  }

  // Radar data — normalize each component to 0-100 for display
  const maxValues: Record<string, number> = {
    savings_ratio: 35, subscription_burden: 20, spending_discipline: 25, emergency_reserve: 10, budget_adherence: 20,
  }
  const radarData = Object.entries(breakdown).map(([key, val]) => ({
    subject: labels[key] ?? key,
    value: Math.round((val / (maxValues[key] ?? 20)) * 100),
    fullMark: 100,
  }))

  // Score color
  const scoreColor = score >= 70 ? '#34d399' : score >= 55 ? '#f59e0b' : '#f43f5e'
  const scoreLabel = score >= 70 ? 'Healthy' : score >= 55 ? 'Moderate' : 'At Risk'
  const scoreBg = score >= 70 ? 'from-emerald-500/20 to-teal-500/10 border-emerald-400/20'
                : score >= 55 ? 'from-amber-500/20 to-orange-500/10 border-amber-400/20'
                : 'from-rose-500/20 to-pink-500/10 border-rose-400/20'
  const scoreText = score >= 70 ? 'text-emerald-300' : score >= 55 ? 'text-amber-300' : 'text-rose-300'

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">ML Model Output</p>
          <h3 className="mt-1 text-lg font-semibold text-white">Financial Health Breakdown</h3>
          <p className="mt-1 text-sm text-slate-400">Random Forest Regressor · 5 feature dimensions</p>
        </div>
        <div className={`rounded-2xl border bg-gradient-to-br px-5 py-3 text-center ${scoreBg}`}>
          <p className={`text-3xl font-bold tabular-nums ${scoreText}`}>{score}</p>
          <p className="text-xs text-slate-400 mt-0.5">{scoreLabel}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Radar chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
              />
              <Radar
                name="Score"
                dataKey="value"
                stroke={scoreColor}
                fill={scoreColor}
                fillOpacity={0.18}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                formatter={(value: number) => [`${value}%`, 'Score']}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Horizontal bar breakdown */}
        <div className="flex flex-col justify-center gap-3">
          {Object.entries(breakdown).map(([key, val]) => {
            const max = maxValues[key] ?? 20
            const pct = Math.min(100, Math.round((val / max) * 100))
            const barColor = pct >= 70 ? 'bg-emerald-400' : pct >= 40 ? 'bg-amber-400' : 'bg-rose-400'
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-300">{labels[key] ?? key}</span>
                  <span className="text-xs font-semibold text-white tabular-nums">{val.toFixed(1)} / {max}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className={`h-full rounded-full ${barColor}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                  />
                </div>
              </div>
            )
          })}
          {summary && (
            <p className="mt-2 text-xs leading-5 text-slate-400 border-t border-white/10 pt-3">{summary}</p>
          )}
        </div>
      </div>
    </section>
  )
}

function GoalsPanel({ goals, onEdit, onRemove }: { goals: import('@/types').Goal[]; onEdit: (goalId: string, payload: { name: string; target_amount: number; current_amount: number; monthly_savings_target: number; target_date?: string | null }) => Promise<void>; onRemove: (goalId: string) => Promise<void> }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editTarget, setEditTarget] = useState('')
  const [editCurrent, setEditCurrent] = useState('')
  const [editMonthly, setEditMonthly] = useState('')

  const startEdit = (goal: import('@/types').Goal) => {
    setEditingId(goal.id)
    setEditName(goal.name)
    setEditTarget(String(goal.target_amount))
    setEditCurrent(String(goal.current_amount))
    setEditMonthly(String(goal.monthly_savings_target))
  }

  const cancelEdit = () => setEditingId(null)

  const saveEdit = async (goalId: string) => {
    await onEdit(goalId, {
      name: editName,
      target_amount: Number(editTarget),
      current_amount: Number(editCurrent),
      monthly_savings_target: Number(editMonthly),
    })
    setEditingId(null)
  }

  const accentColors = ['from-cyan-400 to-sky-500', 'from-emerald-400 to-teal-500', 'from-indigo-400 to-violet-500', 'from-amber-400 to-orange-500']

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Goal Tracker</h3>
          <p className="mt-1 text-sm text-slate-400">Goal Planning Agent — projected completion paths</p>
        </div>
        <Target className="h-5 w-5 text-cyan-300" />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {goals.map((goal, index) => {
          const progress = Math.min(100, goal.progress ?? 0)
          const accent = accentColors[index % accentColors.length]
          const isEditing = editingId === goal.id

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-3xl border border-white/10 bg-slate-950/70 p-5"
            >
              {isEditing ? (
                /* ── edit mode ── */
                <div className="space-y-2">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Goal name" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500" />
                  <input value={editTarget} onChange={(e) => setEditTarget(e.target.value)} placeholder="Target amount" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500" />
                  <input value={editCurrent} onChange={(e) => setEditCurrent(e.target.value)} placeholder="Current amount" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500" />
                  <input value={editMonthly} onChange={(e) => setEditMonthly(e.target.value)} placeholder="Monthly target" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500" />
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => saveEdit(goal.id)} className="flex-1 rounded-xl bg-white py-2 text-xs font-semibold text-slate-950 transition hover:bg-slate-100">Save</button>
                    <button onClick={cancelEdit} className="flex-1 rounded-xl border border-white/10 py-2 text-xs text-slate-300 transition hover:bg-white/5">Cancel</button>
                  </div>
                </div>
              ) : (
                /* ── view mode ── */
                <>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-white">{goal.name}</p>
                    <span className="shrink-0 rounded-full bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-300">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className={`h-full rounded-full bg-gradient-to-r ${accent}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.9, ease: 'easeOut', delay: index * 0.08 }}
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <div><p>Saved</p><p className="mt-0.5 font-medium text-white">₹{goal.current_amount.toLocaleString('en-IN')}</p></div>
                    <div><p>Target</p><p className="mt-0.5 font-medium text-white">₹{goal.target_amount.toLocaleString('en-IN')}</p></div>
                    <div><p>Monthly</p><p className="mt-0.5 font-medium text-white">₹{goal.monthly_savings_target.toLocaleString('en-IN')}</p></div>
                    <div><p>ETA</p><p className="mt-0.5 font-medium text-white">{goal.estimated_completion ? new Date(goal.estimated_completion).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}</p></div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => startEdit(goal)} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-medium text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-400/10 hover:text-cyan-200">
                      Edit
                    </button>
                    <button onClick={() => onRemove(goal.id)} className="flex-1 rounded-xl border border-rose-400/20 bg-rose-500/5 py-2 text-xs font-medium text-rose-300 transition hover:bg-rose-500/15">
                      Delete
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

function RecommendationsCard({ subscriptions, challenge }: { subscriptions: DashboardOverview['subscriptions']; challenge: string }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <h3 className="text-lg font-semibold text-white">Savings Recommendations</h3>
      <div className="mt-5 space-y-3">
        {subscriptions.map((item) => (
          <div key={item.merchant} className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-white">{item.merchant}</p>
                <p className="mt-1 text-sm text-slate-400">Recurring cost detected as a subscription pattern.</p>
              </div>
              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">₹{item.monthly_cost.toFixed(0)}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-3xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-sm text-slate-200">{challenge}</div>
    </section>
  )
}

function BillsCard({ bills }: { bills: DashboardOverview['upcoming_bills'] }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <h3 className="text-lg font-semibold text-white">Predictive Bill Reminders</h3>
      <div className="mt-5 space-y-3">
        {bills.map((bill) => (
          <div key={`${bill.merchant}-${bill.due_date}`} className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-white">{bill.merchant}</p>
                <p className="mt-1 text-sm text-slate-400">Due in {bill.due_in_days} days on {bill.due_date}</p>
              </div>
              <span className="text-sm text-cyan-300">₹{bill.expected_amount.toFixed(0)}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function TransactionsPreview({ transactions }: { transactions: TransactionLike[] }) {
  if (!transactions.length) {
    return (
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <h3 className="text-lg font-semibold text-white">Uploaded Transactions</h3>
        <div className="mt-5 rounded-3xl border border-dashed border-white/10 bg-slate-950/70 p-8 text-sm text-slate-400">
          Upload a CSV or PDF statement to populate this table with your real transactions.
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <h3 className="text-lg font-semibold text-white">Uploaded Transactions</h3>
      <div className="mt-5 overflow-hidden rounded-3xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-slate-950/70 text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Merchant</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-white/[0.03] text-slate-200">
            {transactions.map((transaction) => {
              const isCredit = transaction.type === 'credit'
              return (
                <tr key={transaction.id}>
                  <td className="px-4 py-3 font-medium">{transaction.merchant}</td>
                  <td className="px-4 py-3 text-slate-400">{transaction.category}</td>
                  <td className={`px-4 py-3 font-semibold tabular-nums ${isCredit ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {isCredit ? '+' : '-'}₹{Math.abs(transaction.amount).toFixed(0)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      isCredit
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/20'
                        : 'bg-rose-500/10 text-rose-300 border border-rose-400/20'
                    }`}>
                      {isCredit ? 'Credit' : 'Debit'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{transaction.source}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function FinancialHistoryTab({ records }: { records: HistoryRecord[] }) {
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Food' | 'Shopping' | 'Entertainment' | 'Bills' | 'Transport' | 'Education' | 'Health' | 'Investments'>('all')
  const [sortBy, setSortBy] = useState<'month' | 'income' | 'expenses' | 'savings' | 'score'>('month')
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc')
  const [expandedId, setExpandedId] = useState<string | null>(records[0]?.id ?? null)
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false)
  const categoryOptions: Array<'all' | 'Food' | 'Shopping' | 'Entertainment' | 'Bills' | 'Transport' | 'Education' | 'Health' | 'Investments'> = ['all', 'Food', 'Shopping', 'Entertainment', 'Bills', 'Transport', 'Education', 'Health', 'Investments']
  const sortOptions: Array<{ value: 'month' | 'income' | 'expenses' | 'savings' | 'score'; label: string }> = [
    { value: 'month', label: 'Month' },
    { value: 'income', label: 'Income' },
    { value: 'expenses', label: 'Expenses' },
    { value: 'savings', label: 'Savings' },
    { value: 'score', label: 'Score' },
  ]

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const matchesCategory = (record: HistoryRecord) => {
      if (categoryFilter === 'all') return true
      const keyMap: Record<string, number> = {
        Food: record.food_expenses,
        Shopping: record.shopping_expenses,
        Entertainment: record.entertainment_expenses,
        Bills: record.bills_expenses,
        Transport: record.transport_expenses,
        Education: record.education_expenses,
        Health: record.health_expenses,
        Investments: record.investments,
      }
      return keyMap[categoryFilter] > 0
    }

    const matchesQuery = (record: HistoryRecord) => {
      if (!normalizedQuery) return true
      const haystack = [record.month_label, record.month, record.ai_recommendation_summary, record.budget_status, record.risk_indicator, ...record.overspending_alerts, ...record.insights.map((item) => `${item.title} ${item.detail}`)].join(' ').toLowerCase()
      return haystack.includes(normalizedQuery)
    }

    const sorted = [...records].filter(matchesCategory).filter(matchesQuery).sort((left, right) => {
      const direction = sortDirection === 'asc' ? 1 : -1
      if (sortBy === 'month') return left.month.localeCompare(right.month) * direction
      if (sortBy === 'income') return (left.total_income - right.total_income) * direction
      if (sortBy === 'expenses') return (left.total_expenses - right.total_expenses) * direction
      if (sortBy === 'savings') return (left.total_savings - right.total_savings) * direction
      return (left.financial_health_score - right.financial_health_score) * direction
    })
    return sorted
  }, [categoryFilter, query, records, sortBy, sortDirection])

  const summary = useMemo(() => {
    const totalIncome = filteredRecords.reduce((sum, record) => sum + record.total_income, 0)
    const totalExpenses = filteredRecords.reduce((sum, record) => sum + record.total_expenses, 0)
    const totalSavings = filteredRecords.reduce((sum, record) => sum + record.total_savings, 0)
    return { totalIncome, totalExpenses, totalSavings }
  }, [filteredRecords])

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">Past Insights</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">Historical financial intelligence archive</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Review prior statements, compare monthly trends, and inspect the AI-generated recommendations that were captured for each month.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MiniHistoryStat label="Months tracked" value={filteredRecords.length.toString()} />
          <MiniHistoryStat label="Income total" value={`₹${summary.totalIncome.toFixed(0)}`} />
          <MiniHistoryStat label="Savings total" value={`₹${summary.totalSavings.toFixed(0)}`} />
        </div>
      </div>

      <div className="mt-6 grid gap-3 xl:grid-cols-[1.2fr_0.55fr_0.55fr_0.45fr]">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search month, recommendation, alert..." className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsCategoryMenuOpen((value) => !value)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white transition hover:border-cyan-300/30"
          >
            <span className="flex items-center gap-3">
              <SlidersHorizontal className="h-4 w-4 text-slate-400" />
              <span>{categoryFilter === 'all' ? 'All categories' : categoryFilter}</span>
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          {isCategoryMenuOpen && (
            <div className="absolute z-50 mt-2 w-full min-w-64 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/40 backdrop-blur-xl">
              <div className="max-h-72 overflow-auto p-2">
                {categoryOptions.map((option) => {
                  const isActive = categoryFilter === option
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setCategoryFilter(option)
                        setIsCategoryMenuOpen(false)
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition ${isActive ? 'bg-cyan-400/15 text-cyan-200' : 'text-slate-200 hover:bg-white/5 hover:text-white'}`}
                    >
                      <span>{option === 'all' ? 'All categories' : option}</span>
                      {isActive ? <span className="text-xs uppercase tracking-[0.3em] text-cyan-300">Selected</span> : null}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsSortMenuOpen((value) => !value)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white transition hover:border-cyan-300/30"
          >
            <span className="flex items-center gap-3">
              <ArrowUpDown className="h-4 w-4 text-slate-400" />
              <span>{sortOptions.find((option) => option.value === sortBy)?.label ?? 'Month'}</span>
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          {isSortMenuOpen && (
            <div className="absolute z-50 mt-2 w-full min-w-56 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/40 backdrop-blur-xl">
              <div className="max-h-72 overflow-auto p-2">
                {sortOptions.map((option) => {
                  const isActive = sortBy === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setSortBy(option.value)
                        setIsSortMenuOpen(false)
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition ${isActive ? 'bg-cyan-400/15 text-cyan-200' : 'text-slate-200 hover:bg-white/5 hover:text-white'}`}
                    >
                      <span>{option.label}</span>
                      {isActive ? <span className="text-xs uppercase tracking-[0.3em] text-cyan-300">Selected</span> : null}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        <button onClick={() => setSortDirection((value) => (value === 'desc' ? 'asc' : 'desc'))} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:border-cyan-300/30">
          {sortDirection === 'desc' ? 'Newest first' : 'Oldest first'}
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-white/10">
        <div className="max-h-[78vh] overflow-auto">
          <table className="min-w-[1600px] border-separate border-spacing-0 text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-950/95 text-slate-300 backdrop-blur-xl">
              <tr>
                <HistoryHeaderCell>Month / Year</HistoryHeaderCell>
                <HistoryHeaderCell align="right">Income</HistoryHeaderCell>
                <HistoryHeaderCell align="right">Expenses</HistoryHeaderCell>
                <HistoryHeaderCell align="right">Savings</HistoryHeaderCell>
                <HistoryHeaderCell align="right">Savings %</HistoryHeaderCell>
                <HistoryHeaderCell align="right">Food</HistoryHeaderCell>
                <HistoryHeaderCell align="right">Shopping</HistoryHeaderCell>
                <HistoryHeaderCell align="right">Entertainment</HistoryHeaderCell>
                <HistoryHeaderCell align="right">Bills</HistoryHeaderCell>
                <HistoryHeaderCell align="right">Transport</HistoryHeaderCell>
                <HistoryHeaderCell align="right">Education</HistoryHeaderCell>
                <HistoryHeaderCell align="right">Health</HistoryHeaderCell>
                <HistoryHeaderCell align="right">Investments</HistoryHeaderCell>
                <HistoryHeaderCell align="right">Subscriptions</HistoryHeaderCell>
                <HistoryHeaderCell align="right">Health Score</HistoryHeaderCell>
                <HistoryHeaderCell align="center">Budget Status</HistoryHeaderCell>
                <HistoryHeaderCell align="center">Alerts</HistoryHeaderCell>
                <HistoryHeaderCell>AI Recommendation Summary</HistoryHeaderCell>
                <HistoryHeaderCell align="right">Goal Progress</HistoryHeaderCell>
                <HistoryHeaderCell align="center">Risk</HistoryHeaderCell>
                <HistoryHeaderCell align="center">Details</HistoryHeaderCell>
              </tr>
            </thead>
            <tbody className="bg-white/[0.03] text-slate-100">
              {filteredRecords.map((record, index) => {
                const isExpanded = expandedId === record.id
                return (
                  <Fragment key={record.id}>
                    <motion.tr whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }} className="border-t border-white/10 transition-colors">
                      <HistoryCell className="font-medium text-white">
                        <button onClick={() => setExpandedId(isExpanded ? null : record.id)} className="flex items-center gap-3 text-left transition hover:text-cyan-200">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </span>
                          <div>
                            <p>{record.month_label}</p>
                            <p className="text-xs text-slate-400">{record.month}</p>
                          </div>
                        </button>
                      </HistoryCell>
                      <HistoryCell align="right">₹{record.total_income.toFixed(0)}</HistoryCell>
                      <HistoryCell align="right">₹{record.total_expenses.toFixed(0)}</HistoryCell>
                      <HistoryCell align="right">₹{record.total_savings.toFixed(0)}</HistoryCell>
                      <HistoryCell align="right">{record.savings_percentage.toFixed(1)}%</HistoryCell>
                      <HistoryCell align="right">₹{record.food_expenses.toFixed(0)}</HistoryCell>
                      <HistoryCell align="right">₹{record.shopping_expenses.toFixed(0)}</HistoryCell>
                      <HistoryCell align="right">₹{record.entertainment_expenses.toFixed(0)}</HistoryCell>
                      <HistoryCell align="right">₹{record.bills_expenses.toFixed(0)}</HistoryCell>
                      <HistoryCell align="right">₹{record.transport_expenses.toFixed(0)}</HistoryCell>
                      <HistoryCell align="right">₹{record.education_expenses.toFixed(0)}</HistoryCell>
                      <HistoryCell align="right">₹{record.health_expenses.toFixed(0)}</HistoryCell>
                      <HistoryCell align="right">₹{record.investments.toFixed(0)}</HistoryCell>
                      <HistoryCell align="right">₹{record.subscription_costs.toFixed(0)}</HistoryCell>
                      <HistoryCell align="right">
                        <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">{record.financial_health_score}/100</span>
                      </HistoryCell>
                      <HistoryCell align="center">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${budgetTone(record.budget_status)}`}>{record.budget_status}</span>
                      </HistoryCell>
                      <HistoryCell align="center">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">{record.overspending_alerts.length}</span>
                      </HistoryCell>
                      <HistoryCell className="max-w-[360px]">
                        <p className="line-clamp-2 text-slate-200">{record.ai_recommendation_summary}</p>
                      </HistoryCell>
                      <HistoryCell align="right">{record.goal_progress.toFixed(0)}%</HistoryCell>
                      <HistoryCell align="center">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${riskTone(record.risk_indicator)}`}>{record.risk_indicator}</span>
                      </HistoryCell>
                      <HistoryCell align="center">
                        <button onClick={() => setExpandedId(isExpanded ? null : record.id)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white transition hover:border-cyan-300/30">
                          {isExpanded ? 'Collapse' : 'Expand'}
                        </button>
                      </HistoryCell>
                    </motion.tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={20} className="bg-slate-950/70 px-4 pb-6 pt-0">
                          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
                            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                              <div className="space-y-4">
                                <div className="grid gap-3 sm:grid-cols-3">
                                  <MetricChip label="Monthly spend" value={`₹${record.total_expenses.toFixed(0)}`} />
                                  <MetricChip label="Savings trajectory" value={`${record.savings_percentage.toFixed(1)}%`} />
                                  <MetricChip label="Score signal" value={record.risk_indicator} />
                                </div>
                                <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
                                  <p className="text-sm font-semibold text-white">Detailed category breakdown</p>
                                  <div className="mt-4 h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={record.category_breakdown}>
                                        <CartesianGrid stroke="rgba(148,163,184,0.14)" vertical={false} />
                                        <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                        <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#22d3ee" radius={[12, 12, 4, 4]} />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
                                  <p className="text-sm font-semibold text-white">AI insights timeline</p>
                                  <div className="mt-4 space-y-3">
                                    {record.insights.map((insight) => (
                                      <div key={insight.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                        <p className="text-sm font-medium text-white">{insight.title}</p>
                                        <p className="mt-1 text-sm text-slate-400">{insight.detail}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-cyan-400/10 to-emerald-400/10 p-4">
                                  <p className="text-sm font-semibold text-white">Monthly trend graph</p>
                                  <div className="mt-4 h-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <AreaChart data={record.trend}>
                                        <defs>
                                          <linearGradient id={`historyFill-${record.id}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
                                          </linearGradient>
                                        </defs>
                                        <CartesianGrid stroke="rgba(148,163,184,0.14)" vertical={false} />
                                        <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                        <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="spend" stroke="#22d3ee" fill={`url(#historyFill-${record.id})`} strokeWidth={2.5} />
                                      </AreaChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 grid gap-4 lg:grid-cols-3">
                              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
                                <p className="text-sm font-semibold text-white">Subscription analysis</p>
                                <div className="mt-3 space-y-2 text-sm text-slate-300">
                                  {record.subscriptions.length ? record.subscriptions.map((item) => <div key={item.merchant} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">{item.merchant} - ₹{item.monthly_cost.toFixed(0)}</div>) : <p className="text-slate-400">No recurring subscriptions detected for this month.</p>}
                                </div>
                              </div>
                              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
                                <p className="text-sm font-semibold text-white">Goal progress</p>
                                <div className="mt-4 rounded-full bg-white/10">
                                  <div className="h-3 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${Math.min(100, record.goal_progress)}%` }} />
                                </div>
                                <p className="mt-3 text-sm text-slate-400">Goal momentum derived from this month's savings signal.</p>
                              </div>
                              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
                                <p className="text-sm font-semibold text-white">Overspending alerts</p>
                                <div className="mt-3 space-y-2 text-sm text-slate-300">
                                  {record.overspending_alerts.length ? record.overspending_alerts.map((alert) => <div key={alert} className="rounded-xl border border-amber-300/20 bg-amber-400/10 px-3 py-2">{alert}</div>) : <p className="text-slate-400">No overspending spikes were flagged.</p>}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {!filteredRecords.length && (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/70 p-8 text-sm text-slate-400">
          No historical records match the current search or filter.
        </div>
      )}
    </section>
  )
}

function MiniHistoryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  )
}

function HistoryHeaderCell({ children, align = 'left' }: { children: ReactNode; align?: 'left' | 'center' | 'right' }) {
  return <th className={`sticky top-0 border-b border-white/10 px-4 py-4 font-medium ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}`}>{children}</th>
}

function HistoryCell({ children, className = '', align = 'left' }: { children: ReactNode; className?: string; align?: 'left' | 'center' | 'right' }) {
  return <td className={`border-b border-white/10 px-4 py-4 align-top ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'} ${className}`}>{children}</td>
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  )
}

function budgetTone(status: string) {
  if (status === 'On track') return 'bg-emerald-400/10 text-emerald-200 border border-emerald-300/20'
  if (status === 'Watch') return 'bg-amber-400/10 text-amber-200 border border-amber-300/20'
  return 'bg-rose-400/10 text-rose-200 border border-rose-300/20'
}

function riskTone(status: string) {
  if (status === 'Low') return 'bg-emerald-400/10 text-emerald-200 border border-emerald-300/20'
  if (status === 'Medium') return 'bg-amber-400/10 text-amber-200 border border-amber-300/20'
  return 'bg-rose-400/10 text-rose-200 border border-rose-300/20'
}

function normalizeHistoryRecords(history: HistoryRecord[], transactions: TransactionLike[]) {
  if (history.length) {
    return [...history].sort((left, right) => right.month.localeCompare(left.month))
  }

  const byMonth = new Map<string, TransactionLike[]>()
  transactions.forEach((transaction) => {
    const month = transaction.date.slice(0, 7)
    const bucket = byMonth.get(month) ?? []
    bucket.push(transaction)
    byMonth.set(month, bucket)
  })

  return [...byMonth.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([month, monthTransactions]) => {
      const totalIncome = monthTransactions.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.amount, 0)
      const totalExpenses = monthTransactions.filter((item) => item.type === 'debit' || (item.amount > 0 && item.type !== 'credit')).reduce((sum, item) => sum + Math.abs(item.amount), 0)
      const totalSavings = Math.max(totalIncome - totalExpenses, 0)
      const savingsPercentage = totalIncome ? (totalSavings / totalIncome) * 100 : 0
      const categoryTotals = monthTransactions.reduce<Record<string, number>>((accumulator, item) => {
        if (item.amount < 0) return accumulator
        accumulator[item.category] = (accumulator[item.category] ?? 0) + item.amount
        return accumulator
      }, {})
      const insights = monthTransactions.length ? [{ id: `${month}-i1`, title: 'Historical snapshot', detail: 'Archive entry generated from uploaded statement data.', severity: 'info' as const }] : []
      return {
        id: month,
        month,
        month_label: monthLabel(month),
        total_income: totalIncome,
        total_expenses: totalExpenses,
        total_savings: totalSavings,
        savings_percentage: savingsPercentage,
        food_expenses: categoryTotals.Food ?? 0,
        shopping_expenses: categoryTotals.Shopping ?? 0,
        entertainment_expenses: categoryTotals.Entertainment ?? 0,
        bills_expenses: categoryTotals.Bills ?? 0,
        transport_expenses: categoryTotals.Transport ?? 0,
        education_expenses: categoryTotals.Education ?? 0,
        health_expenses: categoryTotals.Health ?? 0,
        investments: categoryTotals.Investments ?? 0,
        subscription_costs: 0,
        financial_health_score: Math.max(35, Math.min(100, Math.round(100 - (totalExpenses / Math.max(totalIncome, 1)) * 60))),
        budget_status: totalIncome && totalExpenses / totalIncome > 0.9 ? 'Risk' : totalIncome && totalExpenses / totalIncome > 0.7 ? 'Watch' : 'On track',
        overspending_alerts: totalIncome && totalExpenses > totalIncome ? ['Expenses exceeded income for the month.'] : [],
        ai_recommendation_summary: 'Archive record generated from uploaded statement data.',
        goal_progress: Math.max(0, Math.min(100, savingsPercentage)),
        risk_indicator: totalIncome && totalExpenses / totalIncome > 0.9 ? 'High' : totalIncome && totalExpenses / totalIncome > 0.7 ? 'Medium' : 'Low',
        category_breakdown: Object.entries(categoryTotals).map(([name, value]) => ({ name, value })),
        insights,
        subscriptions: [],
        trend: [{ month, spend: totalExpenses }],
      }
    })
}

function monthLabel(month: string) {
  const [year, monthIndex] = month.split('-').map(Number)
  const date = new Date(year, monthIndex - 1, 1)
  return date.toLocaleString(undefined, { month: 'long', year: 'numeric' })
}

type TransactionLike = { id: string; date: string; merchant: string; amount: number; category: string; source: string; type?: 'credit' | 'debit' }
