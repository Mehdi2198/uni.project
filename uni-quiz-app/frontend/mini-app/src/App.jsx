import { Routes, Route } from 'react-router-dom'
import { useTelegram } from './hooks/useTelegram'
import HomePage from './pages/HomePage'
import QuizPage from './pages/QuizPage'
import ResultPage from './pages/ResultPage'

import { Toaster } from 'react-hot-toast'

export default function App() {
    const { user, isReady } = useTelegram()

    // Wait for Timegram to be ready
    if (!isReady) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner" />
            </div>
        )
    }

    return (
        <div className="min-h-screen safe-area-bottom">
            <Toaster position="top-center" />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/quiz/:quizId" element={<QuizPage />} />
                <Route path="/result/:attemptId" element={<ResultPage />} />
            </Routes>
        </div>
    )
}
