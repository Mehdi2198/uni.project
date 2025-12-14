import { useQuery, useMutation } from '@tanstack/react-query'
import { quizzesApi } from '../services/api'
import { Link } from 'react-router-dom'
import { Download, BarChart3, FileQuestion, Users, TrendingUp, TrendingDown } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResultsPage() {
    const { data: quizzesData, isLoading } = useQuery({
        queryKey: ['quizzes'],
        queryFn: () => quizzesApi.getAll({}),
    })

    const exportMutation = useMutation({
        mutationFn: (quizId) => quizzesApi.exportResults(quizId),
        onSuccess: (response, quizId) => {
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `quiz_results_${quizId}.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            toast.success('Results exported!')
        },
    })

    const quizzes = quizzesData?.data?.quizzes?.filter(q => q.is_published) || []

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-dark-900">Results</h1>
                <p className="text-dark-500">View and export quiz results</p>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-xl border border-dark-100 p-6 animate-pulse">
                            <div className="h-6 bg-dark-100 rounded w-1/3 mb-4" />
                            <div className="h-4 bg-dark-100 rounded w-1/4" />
                        </div>
                    ))}
                </div>
            ) : quizzes.length === 0 ? (
                <div className="bg-white rounded-xl border border-dark-100 p-12 text-center">
                    <BarChart3 className="w-16 h-16 mx-auto text-dark-300 mb-4" />
                    <h3 className="text-lg font-semibold text-dark-900 mb-2">No published quizzes</h3>
                    <p className="text-dark-500 mb-4">Publish quizzes to see results here</p>
                    <Link to="/quizzes" className="btn btn-primary">Go to Quizzes</Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {quizzes.map(quiz => (
                        <QuizResultCard key={quiz.id} quiz={quiz} onExport={() => exportMutation.mutate(quiz.id)} exporting={exportMutation.isPending} />
                    ))}
                </div>
            )}
        </div>
    )
}

function QuizResultCard({ quiz, onExport, exporting }) {
    const { data: resultsData } = useQuery({
        queryKey: ['quiz-results', quiz.id],
        queryFn: () => quizzesApi.getResults(quiz.id),
    })

    const results = resultsData?.data?.results || []
    const totalAttempts = results.length
    const passedCount = results.filter(r => r.passed).length
    const avgScore = totalAttempts > 0 ? results.reduce((sum, r) => sum + (r.score || 0), 0) / totalAttempts : 0
    const passRate = totalAttempts > 0 ? (passedCount / totalAttempts) * 100 : 0

    return (
        <div className="bg-white rounded-xl border border-dark-100 p-6">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <Link to={`/quizzes/${quiz.id}`} className="text-lg font-semibold text-dark-900 hover:text-primary-600">
                        {quiz.title}
                    </Link>
                    <div className="flex items-center gap-4 mt-1 text-sm text-dark-500">
                        <span className="flex items-center gap-1">
                            <FileQuestion className="w-4 h-4" /> {quiz.question_count} questions
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" /> {totalAttempts} submissions
                        </span>
                    </div>
                </div>
                <button onClick={onExport} disabled={exporting || totalAttempts === 0} className="btn btn-secondary">
                    <Download className="w-4 h-4" /> Export
                </button>
            </div>

            {totalAttempts > 0 ? (
                <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-dark-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-dark-900">{avgScore.toFixed(1)}%</p>
                        <p className="text-sm text-dark-500">Avg Score</p>
                    </div>
                    <div className="bg-dark-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-emerald-600">{passedCount}</p>
                        <p className="text-sm text-dark-500">Passed</p>
                    </div>
                    <div className="bg-dark-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-dark-900">{passRate.toFixed(0)}%</p>
                        <p className="text-sm text-dark-500">Pass Rate</p>
                    </div>
                </div>
            ) : (
                <div className="mt-4 p-4 bg-dark-50 rounded-lg text-center text-dark-500">
                    No submissions yet
                </div>
            )}
        </div>
    )
}
