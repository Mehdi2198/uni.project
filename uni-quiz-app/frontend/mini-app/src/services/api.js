import axios from 'axios'

// Create axios instance
const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor - add Telegram initData
api.interceptors.request.use(
    (config) => {
        const tg = window.Telegram?.WebApp
        if (tg?.initData) {
            config.headers['X-Telegram-Init-Data'] = tg.initData
        }
        return config
    },
    (error) => Promise.reject(error)
)

export default api

// Student API helpers
export const studentApi = {
    // Profile
    getProfile: () => api.get('/student/profile'),
    updateProfile: (data) => api.put('/student/profile', data),

    // Classes
    getClasses: () => api.get('/student/classes'),
    getClassQuizzes: (classId) => api.get(`/student/classes/${classId}/quizzes`),

    // Quiz taking
    startQuiz: (quizId) => api.post(`/student/quizzes/${quizId}/start`),
    getAttempt: (attemptId) => api.get(`/student/attempts/${attemptId}`),
    submitAnswer: (attemptId, questionId, answer) =>
        api.post(`/student/attempts/${attemptId}/answer`, {
            question_id: questionId,
            selected_answer: answer,
        }),
    submitQuiz: (attemptId, answers) =>
        api.post(`/student/attempts/${attemptId}/submit`, { answers }),
    getResults: (attemptId) => api.get(`/student/attempts/${attemptId}/results`),

    // History
    getHistory: () => api.get('/student/history'),
}
