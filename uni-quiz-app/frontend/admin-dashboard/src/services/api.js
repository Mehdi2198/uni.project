import axios from 'axios'
import { useAuthStore } from '../store/authStore'

// Create axios instance
const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const { accessToken } = useAuthStore.getState()

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor - handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        // If 401 and haven't tried refreshing yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            const { refreshAccessToken, logout } = useAuthStore.getState()
            const success = await refreshAccessToken()

            if (success) {
                // Retry the original request with new token
                const { accessToken } = useAuthStore.getState()
                originalRequest.headers.Authorization = `Bearer ${accessToken}`
                return api(originalRequest)
            } else {
                logout()
                window.location.href = '/login'
            }
        }

        return Promise.reject(error)
    }
)

export default api

// API helper functions
export const classesApi = {
    getAll: (params) => api.get('/instructor/classes', { params }),
    getById: (id) => api.get(`/instructor/classes/${id}`),
    create: (data) => api.post('/instructor/classes', data),
    update: (id, data) => api.put(`/instructor/classes/${id}`, data),
    delete: (id) => api.delete(`/instructor/classes/${id}`),
    getInviteLink: (id) => api.get(`/instructor/classes/${id}/invite-link`),
    getStudents: (id) => api.get(`/instructor/classes/${id}/students`),
}

export const filesApi = {
    uploadImage: (file) => {
        const formData = new FormData()
        formData.append('file', file)
        return api.post('/instructor/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
    },
}

export const questionsApi = {
    getAll: (params) => api.get('/instructor/questions', { params }),
    getById: (id) => api.get(`/instructor/questions/${id}`),
    create: (data) => api.post('/instructor/questions', data),
    update: (id, data) => api.put(`/instructor/questions/${id}`, data),
    delete: (id) => api.delete(`/instructor/questions/${id}`),
    bulkImport: (data) => api.post('/instructor/questions/bulk', data),
    generateFromText: (text, count) => api.post('/instructor/ai/generate-text', { text, count }),
    generateFromImage: (file) => {
        const formData = new FormData()
        formData.append('file', file)
        return api.post('/instructor/ai/generate-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
    },
}

export const quizzesApi = {
    getAll: (params) => api.get('/instructor/quizzes', { params }),
    getById: (id) => api.get(`/instructor/quizzes/${id}`),
    create: (data) => api.post('/instructor/quizzes', data),
    update: (id, data) => api.put(`/instructor/quizzes/${id}`, data),
    delete: (id) => api.delete(`/instructor/quizzes/${id}`),
    publish: (id, isPublished) => api.post(`/instructor/quizzes/${id}/publish`, { is_published: isPublished }),
    addQuestions: (id, questionIds) => api.post(`/instructor/quizzes/${id}/add-questions`, { question_ids: questionIds }),
    getResults: (id) => api.get(`/instructor/quizzes/${id}/results`),
    exportResults: (id) => api.get(`/instructor/quizzes/${id}/export`, { responseType: 'blob' }),
}
