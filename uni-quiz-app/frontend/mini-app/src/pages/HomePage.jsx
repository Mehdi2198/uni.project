import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { studentApi } from '../services/api'
import { useTelegram } from '../hooks/useTelegram'
import { BookOpen, Clock, ChevronRight, CheckCircle2, XCircle } from 'lucide-react'

export default function HomePage() {
    const { user, hideBackButton } = useTelegram()
    const navigate = useNavigate()

    useEffect(() => {
        hideBackButton()
    }, [])

    const { data: classesData, isLoading: loadingClasses } = useQuery({
        queryKey: ['classes'],
        queryFn: () => studentApi.getClasses(),
    })

    const { data: historyData } = useQuery({
        queryKey: ['history'],
        queryFn: () => studentApi.getHistory(),
    })

    const classes = classesData?.data || []
    const history = historyData?.data || []

    if (loadingClasses) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner" />
            </div>
        )
    }

    return (
        <div className="p-4 space-y-6">
            {/* Header */}
            <div className="text-center py-4">
                <h1 className="text-2xl font-bold">👋 Hi, {user?.first_name || 'Student'}!</h1>
                <p className="tg-hint mt-1">Ready to take a quiz?</p>
            </div>

            {/* Classes with Quizzes */}
            {classes.length === 0 ? (
                <div className="tg-card text-center py-8">
                    <BookOpen className="w-12 h-12 mx-auto tg-hint mb-4" />
                    <p className="font-medium">No classes yet</p>
                    <p className="tg-hint text-sm mt-1">
                        Use a class invite link from your instructor to enroll
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Your Classes</h2>
                    {classes.map((cls) => (
                        <ClassCard key={cls.id} classInfo={cls} onQuizSelect={(quizId) => navigate(`/quiz/${quizId}`)} />
                    ))}
                </div>
            )}

            {/* Quiz History */}
            {history.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold">Recent Quizzes</h2>
                    <div className="space-y-2">
                        {history.slice(0, 5).map((attempt) => (
                            <div
                                key={attempt.attempt_id}
                                onClick={() => navigate(`/result/${attempt.attempt_id}`)}
                                className="tg-card flex items-center justify-between cursor-pointer active:opacity-80"
                            >
                                <div>
                                    <p className="font-medium">{attempt.quiz_title}</p>
                                    <p className="text-sm tg-hint">{attempt.class_name}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {attempt.passed ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-500" />
                                    )}
                                    <span className="font-semibold">{attempt.score?.toFixed(0)}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function ClassCard({ classInfo, onQuizSelect }) {
    const { data: quizzesData, isLoading } = useQuery({
        queryKey: ['class-quizzes', classInfo.id],
        queryFn: () => studentApi.getClassQuizzes(classInfo.id),
    })

    const quizzes = quizzesData?.data || []
    const availableQuizzes = quizzes.filter(q => q.is_available)

    return (
        <div className="tg-card space-y-3">
            <div>
                <h3 className="font-semibold">{classInfo.name}</h3>
                <p className="text-sm tg-hint">{classInfo.instructor_name}</p>
            </div>

            {isLoading ? (
                <div className="py-4 text-center tg-hint">Loading quizzes...</div>
            ) : quizzes.length === 0 ? (
                <p className="text-sm tg-hint">No quizzes available</p>
            ) : (
                <div className="space-y-2">
                    {quizzes.map((quiz) => (
                        <button
                            key={quiz.id}
                            onClick={() => quiz.is_available && onQuizSelect(quiz.id)}
                            disabled={!quiz.is_available}
                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${quiz.is_available
                                    ? 'bg-white active:scale-[0.98]'
                                    : 'bg-gray-100 opacity-60'
                                }`}
                        >
                            <div className="text-left">
                                <p className="font-medium">{quiz.title}</p>
                                <div className="flex items-center gap-3 text-sm tg-hint mt-1">
                                    <span>{quiz.question_count} questions</span>
                                    {quiz.time_limit_minutes && (
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {quiz.time_limit_minutes} min
                                        </span>
                                    )}
                                </div>
                            </div>
                            {quiz.is_available ? (
                                <ChevronRight className="w-5 h-5 tg-hint" />
                            ) : (
                                <span className="text-xs tg-hint">
                                    {quiz.attempts_used >= quiz.max_attempts ? 'Completed' : 'Unavailable'}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
