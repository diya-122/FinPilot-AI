import type { DashboardOverview, Goal, UploadResponse } from '@/types'

const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

function getAuthToken() {
  if (typeof window === 'undefined') {
    return null
  }
  const raw = window.localStorage.getItem('finpilot-auth')
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw) as { token?: string | null }
    return parsed.token ?? null
  } catch {
    return null
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken()
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    let detail = `Request failed: ${response.status}`
    try {
      const body = await response.json()
      if (body?.detail) detail = body.detail
    } catch { /* ignore */ }
    throw new Error(detail)
  }

  return response.json() as Promise<T>
}

export async function login(email: string, password: string) {
  return request<{ user: { id: string; name: string; email: string }; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function register(name: string, email: string, password: string) {
  return request<{ user: { id: string; name: string; email: string }; token: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
}

export async function fetchDashboard(): Promise<DashboardOverview> {
  return request<DashboardOverview>('/dashboard/overview')
}

export async function uploadStatement(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  const token = getAuthToken()
  const response = await fetch(`${baseUrl}/transactions/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`)
  }
  return response.json() as Promise<UploadResponse>
}

export async function createGoal(payload: { name: string; target_amount: number; current_amount: number; monthly_savings_target: number; target_date?: string | null }): Promise<{ goal: Goal }> {
  return request<{ goal: Goal }>('/goals', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateGoal(goalId: string, payload: { name: string; target_amount: number; current_amount: number; monthly_savings_target: number; target_date?: string | null }): Promise<{ goal: Goal }> {
  return request<{ goal: Goal }>(`/goals/${goalId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteGoal(goalId: string): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/goals/${goalId}`, {
    method: 'DELETE',
  })
}
