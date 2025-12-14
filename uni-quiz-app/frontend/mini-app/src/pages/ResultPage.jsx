import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { studentApi } from '../services/api'
import { useTelegram } from '../hooks/useTelegram'
import { CheckCircle2, XCircle, Trophy, TrendingUp, Clock, Home } from 'lucide-react'

export default function ResultPage() {
    const { attemptId } = useParams()
    const navigate = useNavigate()
    const { haptic, showBackButton, hideBackButton } = useTelegram()

    useEffect(() => {
        showBackButton(() => navigate('/'))
        return () => hideBackButton()
    }, [])

    const { data, isLoading, isError } = useQuery({
        queryKey: ['result', attemptId],
        queryFn: () => studentApi.getResults(attemptId),
    })

    useEffect(() => {
        if (data?.data) {
            if (data.data.passed) {
                haptic.notification('success')
            } else {
                haptic.notification('error')
            }
        }
    }, [data])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner" />
            </div>
        )
    }

    if (isError) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <XCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="font-medium">Could not load results</p>
                <button onClick={() => navigate('/')} className="tg-btn mt-4 w-auto px-6">
                    Go Home
                </button>
            </div>
        )
    }

    const result = data?.data
    const passed = result?.passed
    const score = result?.score || 0
    const questions = result?.questions || []

    return (
        <div className="min-h-screen">
            {/* Score Header */}
            <div className={`p-8 text-center text-white ${passed ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
                <div className="text-6xl mb-4">
                    {passed ? <Trophy className="w-20 h-20 mx-auto" /> : '📚'}
                </div>
                <h1 className="text-3xl font-bold mb-2">{score.toFixed(0)}%</h1>
                <p className="text-lg opacity-90">
                    {passed ? 'Congratulations! You passed!' : 'Keep practicing!'}
                </p>
                <div className="flex items-center justify-center gap-4 mt-4 text-sm opacity-80">
                    <span>{result?.earned_points}/{result?.total_points} points</span>
                    {result?.time_spent_seconds && (
                        <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {Math.floor(result.time_spent_seconds / 60)}:{String(result.time_spent_seconds % 60).padStart(2, '0')}
                        </span>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="p-4 grid grid-cols-3 gap-3">
                <div className="tg-card text-center py-3">
                    <p className="text-2xl font-bold">{questions.filter(q => q.is_correct).length}</p>
                    <p className="text-xs tg-hint">Correct</p>
                </div>
                <div className="tg-card text-center py-3">
                    <p className="text-2xl font-bold">{questions.filter(q => !q.is_correct).length}</p>
                    <p className="text-xs tg-hint">Incorrect</p>
                </div>
                <div className="tg-card text-center py-3">
                    <p className="text-2xl font-bold">{result?.passing_score}%</p>
                    <p className="text-xs tg-hint">Required</p>
                </div>
            </div>

            {/* Questions Review */}
            {result?.show_explanations && questions.length > 0 && (
                <div className="p-4 space-y-4">
                    <h2 className="text-lg font-semibold">Review Answers</h2>

                    {questions.map((q, idx) => (
                        <div key={q.question_id} className="tg-card space-y-3">
                            <div className="flex items-start gap-3">
                                {q.is_correct ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                )}
                                <div>
                                    <p className="font-medium">{idx + 1}. {q.question_text}</p>

                                    {q.options && (
                                        <div className="mt-2 space-y-1.5">
                                            {q.options.map((opt) => (
                                                <div
                                                    key={opt.id}
                                                    className={`text-sm px-3 py-2 rounded-lg ${opt.id === q.correct_answer
                                                            ? 'bg-green-100 text-green-800'
                                                            : opt.id === q.selected_answer && !q.is_correct
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-gray-50'
                                                        }`}
                                                >
                                                    <span className="font-medium">{opt.id.toUpperCase()}.</span> {opt.text}
                                                    {opt.id === q.correct_answer && <span className="ml-2">✓</span>}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {q.explanation && (
                                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                            <p className="text-sm text-blue-800">
                                                <strong>Explanation:</strong> {q.explanation}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Home Button */}
            <div className="p-4 safe-area-bottom">
                <button onClick={() => navigate('/')} className="tg-btn flex items-center justify-center gap-2">
                    <Home className="w-5 h-5" /> Back to Home
                </button>
            </div>
        </div>
    )
}
