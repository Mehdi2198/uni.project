import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,

            // Login action
            login: async (email, password) => {
                try {
                    const response = await api.post('/auth/instructor/login', {
                        email,
                        password,
                    })

                    const { access_token, refresh_token } = response.data

                    set({
                        accessToken: access_token,
                        refreshToken: refresh_token,
                        isAuthenticated: true,
                    })

                    // Fetch user profile
                    const profileResponse = await api.get('/instructor/profile', {
                        headers: { Authorization: `Bearer ${access_token}` },
                    })

                    set({ user: profileResponse.data })

                    return { success: true }
                } catch (error) {
                    const message = error.response?.data?.detail || 'Login failed'
                    return { success: false, error: message }
                }
            },

            // Register action
            register: async (data) => {
                try {
                    await api.post('/auth/instructor/register', data)
                    return { success: true }
                } catch (error) {
                    const message = error.response?.data?.detail || 'Registration failed'
                    return { success: false, error: message }
                }
            },

            // Logout action
            logout: () => {
                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                })
            },

            // Check authentication
            checkAuth: () => {
                const { accessToken } = get()
                return !!accessToken
            },

            // Refresh token
            refreshAccessToken: async () => {
                const { refreshToken } = get()

                if (!refreshToken) {
                    get().logout()
                    return false
                }

                try {
                    const response = await api.post('/auth/instructor/refresh', {
                        refresh_token: refreshToken,
                    })

                    const { access_token, refresh_token } = response.data

                    set({
                        accessToken: access_token,
                        refreshToken: refresh_token,
                    })

                    return true
                } catch (error) {
                    get().logout()
                    return false
                }
            },

            // Update user profile
            updateProfile: (userData) => {
                set({ user: { ...get().user, ...userData } })
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
)
