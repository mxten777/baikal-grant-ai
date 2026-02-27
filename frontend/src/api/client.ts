import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ──────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; full_name: string }) =>
    api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
}

// ─── Programs ──────────────────────────────────────────────────
export const programsApi = {
  list: () => api.get('/programs/'),
  get: (id: number) => api.get(`/programs/${id}`),
  create: (data: any) => api.post('/programs/', data),
  update: (id: number, data: any) => api.put(`/programs/${id}`, data),
  delete: (id: number) => api.delete(`/programs/${id}`),
}

// ─── Forms ─────────────────────────────────────────────────────
export const formsApi = {
  getByProgram: (programId: number) => api.get(`/forms/by-program/${programId}`),
  create: (data: any) => api.post('/forms/', data),
  addField: (formId: number, data: any) => api.post(`/forms/${formId}/fields`, data),
  updateField: (formId: number, fieldId: number, data: any) =>
    api.put(`/forms/${formId}/fields/${fieldId}`, data),
  deleteField: (formId: number, fieldId: number) =>
    api.delete(`/forms/${formId}/fields/${fieldId}`),
  reorderFields: (formId: number, fieldIds: number[]) =>
    api.put(`/forms/${formId}/fields/reorder`, fieldIds),
}

// ─── Applications ──────────────────────────────────────────────
export const applicationsApi = {
  create: (data: any) => api.post('/applications/', data),
  submit: (id: number) => api.post(`/applications/${id}/submit`),
  uploadFile: (id: number, file: File, fieldId?: number) => {
    const form = new FormData()
    form.append('file', file)
    if (fieldId) form.append('field_id', String(fieldId))
    return api.post(`/applications/${id}/files`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  myApplications: () => api.get('/applications/my'),
  adminList: (params?: { program_id?: number; status?: string }) =>
    api.get('/applications/admin/all', { params }),
  get: (id: number) => api.get(`/applications/${id}`),
  updateStatus: (id: number, status: string, comments?: string) =>
    api.put(`/applications/admin/${id}/status`, { status, comments }),
  downloadPdf: (id: number) =>
    api.get(`/applications/${id}/pdf`, { responseType: 'blob' }),
}

// ─── Dashboard ─────────────────────────────────────────────────
export const dashboardApi = {
  summary: () => api.get('/dashboard/summary'),
  recentApplications: (limit = 10) =>
    api.get('/dashboard/recent-applications', { params: { limit } }),
  programStats: () => api.get('/dashboard/program-stats'),
  activityLogs: (limit = 15) =>
    api.get('/dashboard/activity-logs', { params: { limit } }),
}

export default api
