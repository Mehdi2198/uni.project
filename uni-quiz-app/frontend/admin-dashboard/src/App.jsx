import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Layouts
import DashboardLayout from './components/layout/DashboardLayout'
import AuthLayout from './components/layout/AuthLayout'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ClassesPage from './pages/ClassesPage'
import ClassDetailPage from './pages/ClassDetailPage'
import QuestionsPage from './pages/QuestionsPage'
import QuizzesPage from './pages/QuizzesPage'
import QuizDetailPage from './pages/QuizDetailPage'
import ResultsPage from './pages/ResultsPage'

// Protected Route component
function ProtectedRoute({ children }) {
    const { isAuthenticated, checkAuth } = useAuthStore()

    // Check if we have a token
    if (!checkAuth()) {
        return <Navigate to="/login" replace />
    }

    return children
}

// Public Route component (redirects to dashboard if authenticated)
function PublicRoute({ children }) {
    const { checkAuth } = useAuthStore()

    if (checkAuth()) {
        return <Navigate to="/dashboard" replace />
    }

    return children
}

function App() {
    return (
        <Routes>
            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <LoginPage />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <PublicRoute>
                            <RegisterPage />
                        </PublicRoute>
                    }
                />
            </Route>

            {/* Dashboard Routes */}
            <Route
                element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/classes" element={<ClassesPage />} />
                <Route path="/classes/:id" element={<ClassDetailPage />} />
                <Route path="/questions" element={<QuestionsPage />} />
                <Route path="/quizzes" element={<QuizzesPage />} />
                <Route path="/quizzes/:id" element={<QuizDetailPage />} />
                <Route path="/results" element={<ResultsPage />} />
            </Route>

            {/* Redirect root to dashboard or login */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    )
}

export default App
