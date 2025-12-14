import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { studentApi } from '../services/api'
import { useTelegram } from '../hooks/useTelegram'
import { Clock, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'

export default function QuizPage() {
    const { quizId } = useParams()
    const navigate = useNavigate()
    const { showBackButton, hideBackButton, haptic, showMainButton, hideMainButton } = useTelegram()

    const [currentIndex, setCurrentIndex] = useState(0)
    const [answers, setAnswers] = useState({})
    const [timeLeft, setTimeLeft] = useState(null)
    const [quizStarted, setQuizStarted] = useState(false)

    // Start quiz mutation
    const startMutation = useMutation({
        mutationFn: () => studentApi.startQuiz(quizId),
        onSuccess: (data) => {
            setQuizStarted(true)
            if (data.data.time_limit_minutes) {
                setTimeLeft(data.data.time_limit_minutes * 60)
            }
        },
    })

    // Submit quiz mutation
    const submitMutation = useMutation({
        mutationFn: () => {
            const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
                question_id: questionId,
                selected_answer: answer,
            }))
            return studentApi.submitQuiz(startMutation.data?.data?.attempt_id, formattedAnswers)
        },
        onSuccess: (data) => {
            hideMainButton()
            navigate(`/result/${startMutation.data?.data?.attempt_id}`, { replace: true })
        },
    })

    // Timer
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return

        const timer = setInterval(() => {
            setTimeLeft((t) => {
                if (t <= 1) {
                    clearInterval(timer)
                    submitMutation.mutate()
                    return 0
                }
                return t - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [timeLeft])

    // Back button
    useEffect(() => {
        if (quizStarted) {
            hideBackButton()
        } else {
            showBackButton(() => navigate('/'))
        }
        return () => hideBackButton()
    }, [quizStarted])

    const quiz = startMutation.data?.data
    const questions = quiz?.questions || []
    const currentQuestion = questions[currentIndex]

    const selectAnswer = (answer) => {
        haptic.selection()
        setAnswers((prev) => ({
            ...prev,
            [currentQuestion.id]: answer,
        }))
    }

    const goNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex((i) => i + 1)
            haptic.impact('light')
        }
    }

    const goPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex((i) => i - 1)
            haptic.impact('light')
        }
    }

    const handleSubmit = () => {
        if (confirm('Submit your quiz? You cannot change answers after submission.')) {
            haptic.notification('warning')
            submitMutation.mutate()
        }
    }

    // Pre-quiz screen
    if (!quizStarted) {
        return (
            <div className="min-h-screen p-4 flex flex-col">
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    {startMutation.isPending ? (
                        <>
                            <div className="spinner mb-4" />
                            <p>Starting quiz...</p>
                        </>
                    ) : startMutation.isError ? (
                        <>
                            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                            <p className="font-semibold">Unable to start quiz</p>
                            <p className="tg-hint text-sm mt-2">
                                {startMutation.error?.response?.data?.detail || 'Please try again'}
                            </p>
                            <button onClick={() => navigate('/')} className="tg-btn-secondary mt-4 w-auto px-6">
                                Go Back
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="text-5xl mb-4">📝</div>
                            <h1 className="text-xl font-bold mb-6">Ready to Start?</h1>
                            <button onClick={() => startMutation.mutate()} className="tg-btn w-full max-w-xs">
                                Start Quiz
                            </button>
                        </>
                    )}
                </div>
            </div>
        )
    }

    // Quiz taking screen
    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-tg-secondary-bg p-4 space-y-3">
                {/* Timer & Progress */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                        {currentIndex + 1} / {questions.length}
                    </span>
                    {timeLeft !== null && (
                        <span className={`timer ${timeLeft < 60 ? 'danger' : timeLeft < 300 ? 'warning' : ''}`}>
                            <Clock className="w-4 h-4 inline mr-1" />
                            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                        </span>
                    )}
                </div>

                {/* Progress bar */}
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
                </div>
            </div>

            {/* Question */}
            <div className="flex-1 p-4">
                {currentQuestion && (
                    <div className="space-y-6">
                        {/* Question text */}
                        <div>
                            <h2 className="text-lg font-semibold leading-relaxed">
                                {currentQuestion.question_text}
                            </h2>
                            {currentQuestion.image_url && (
                                <img
                                    src={currentQuestion.image_url}
                                    alt="Question"
                                    className="mt-4 rounded-xl max-h-48 object-contain w-full"
                                />
                            )}
                        </div>

                        {/* Options */}
                        <div className="space-y-3">
                            {currentQuestion.options?.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => selectAnswer(option.id)}
                                    className={`option ${answers[currentQuestion.id] === option.id ? 'selected' : ''}`}
                                >
                                    <span className="font-semibold mr-2">{option.id.toUpperCase()}.</span>
                                    {option.text}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="sticky bottom-0 bg-tg-bg p-4 border-t flex gap-3 safe-area-bottom">
                <button
                    onClick={goPrev}
                    disabled={currentIndex === 0}
                    className="tg-btn-secondary flex-1 flex items-center justify-center gap-1 disabled:opacity-40"
                >
                    <ChevronLeft className="w-5 h-5" /> Prev
                </button>

                {currentIndex === questions.length - 1 ? (
                    <button
                        onClick={handleSubmit}
                        disabled={submitMutation.isPending}
                        className="tg-btn flex-1"
                    >
                        {submitMutation.isPending ? 'Submitting...' : 'Submit'}
                    </button>
                ) : (
                    <button onClick={goNext} className="tg-btn flex-1 flex items-center justify-center gap-1">
                        Next <ChevronRight className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    )
}
