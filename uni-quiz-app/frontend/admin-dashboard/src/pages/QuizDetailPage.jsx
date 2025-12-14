import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { quizzesApi, questionsApi } from '../services/api'
import { ArrowLeft, Plus, FileQuestion, Clock, Users, Check, Download, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function QuizDetailPage() {
    const { id } = useParams()
    const [showAddQuestions, setShowAddQuestions] = useState(false)
    const [selectedQuestions, setSelectedQuestions] = useState([])
    const queryClient = useQueryClient()

    const { data: quizData, isLoading } = useQuery({
        queryKey: ['quiz', id],
        queryFn: () => quizzesApi.getById(id),
    })

    const { data: resultsData } = useQuery({
        queryKey: ['quiz-results', id],
        queryFn: () => quizzesApi.getResults(id),
    })

    const { data: questionsData } = useQuery({
        queryKey: ['questions'],
        queryFn: () => questionsApi.getAll({ limit: 100 }),
        enabled: showAddQuestions,
    })

    const addQuestionsMutation = useMutation({
        mutationFn: (questionIds) => quizzesApi.addQuestions(id, questionIds),
        onSuccess: (data) => {
            queryClient.invalidateQueries(['quiz', id])
            setShowAddQuestions(false)
            setSelectedQuestions([])
            toast.success(`Added ${data.data.added} questions to pool`)
        },
    })

    const exportMutation = useMutation({
        mutationFn: () => quizzesApi.exportResults(id),
        onSuccess: (response) => {
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `quiz_results_${id}.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            toast.success('Results exported!')
        },
    })

    if (isLoading) {
        return <div className="animate-pulse"><div className="h-8 bg-dark-100 rounded w-48 mb-4" /></div>
    }

    const quiz = quizData?.data
    const results = resultsData?.data?.results || []
    const questions = questionsData?.data?.questions || []

    return (
        <div className="space-y-6 animate-fade-in">
            <Link to="/quizzes" className="inline-flex items-center gap-2 text-dark-500 hover:text-dark-900">
                <ArrowLeft className="w-5 h-5" /> Back to Quizzes
            </Link>

            {/* Quiz Info */}
            <div className="bg-white rounded-xl border border-dark-100 p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-dark-900">{quiz?.title}</h1>
                        {quiz?.description && <p className="text-dark-500 mt-1">{quiz.description}</p>}
                    </div>
                    <span className={`badge ${quiz?.is_published ? 'badge-success' : 'badge-warning'}`}>
                        {quiz?.is_published ? 'Published' : 'Draft'}
                    </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-dark-50 rounded-lg p-4">
                        <p className="text-sm text-dark-500">Questions</p>
                        <p className="text-2xl font-bold text-dark-900">{quiz?.question_count}</p>
                    </div>
                    <div className="bg-dark-50 rounded-lg p-4">
                        <p className="text-sm text-dark-500">Pool Size</p>
                        <p className="text-2xl font-bold text-dark-900">{quiz?.pool_size}</p>
                    </div>
                    <div className="bg-dark-50 rounded-lg p-4">
                        <p className="text-sm text-dark-500">Time Limit</p>
                        <p className="text-2xl font-bold text-dark-900">{quiz?.time_limit_minutes || '∞'} min</p>
                    </div>
                    <div className="bg-dark-50 rounded-lg p-4">
                        <p className="text-sm text-dark-500">Passing Score</p>
                        <p className="text-2xl font-bold text-dark-900">{quiz?.passing_score}%</p>
                    </div>
                </div>

                {quiz?.pool_size < quiz?.question_count && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
                        ⚠️ Add at least {quiz.question_count - quiz.pool_size} more questions to publish this quiz.
                    </div>
                )}

                <div className="flex gap-3 mt-6">
                    <button onClick={() => setShowAddQuestions(true)} className="btn btn-primary">
                        <Plus className="w-4 h-4" /> Add Questions
                    </button>
                    {results.length > 0 && (
                        <button onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending} className="btn btn-secondary">
                            <Download className="w-4 h-4" /> {exportMutation.isPending ? 'Exporting...' : 'Export Results'}
                        </button>
                    )}
                </div>
            </div>

            {/* Results */}
            <div className="bg-white rounded-xl border border-dark-100 overflow-hidden">
                <div className="p-6 border-b border-dark-100">
                    <h2 className="text-lg font-semibold text-dark-900">Results ({results.length} submissions)</h2>
                </div>

                {results.length === 0 ? (
                    <div className="p-12 text-center text-dark-500">
                        <Users className="w-12 h-12 mx-auto text-dark-300 mb-4" />
                        <p>No submissions yet</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Student</th>
                                    <th>Score</th>
                                    <th>Status</th>
                                    <th>Time Spent</th>
                                    <th>Submitted</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((r, idx) => (
                                    <tr key={idx}>
                                        <td className="font-medium">{idx + 1}</td>
                                        <td>{r.student_name}</td>
                                        <td className="font-bold">{r.score?.toFixed(1)}%</td>
                                        <td>
                                            <span className={`badge ${r.passed ? 'badge-success' : 'badge-danger'}`}>
                                                {r.passed ? 'Passed' : 'Failed'}
                                            </span>
                                        </td>
                                        <td>{r.time_spent_seconds ? `${Math.floor(r.time_spent_seconds / 60)}m ${r.time_spent_seconds % 60}s` : '-'}</td>
                                        <td className="text-dark-500">{r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Questions Modal */}
            {showAddQuestions && (
                <div className="modal-overlay" onClick={() => setShowAddQuestions(false)}>
                    <div className="modal-content p-6 max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-dark-900 mb-4">Add Questions to Pool</h2>
                        <p className="text-dark-500 mb-4">Select questions to add ({selectedQuestions.length} selected)</p>

                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {questions.map(q => (
                                <label key={q.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedQuestions.includes(q.id) ? 'border-primary-500 bg-primary-50' : 'border-dark-200 hover:bg-dark-50'
                                    }`}>
                                    <input
                                        type="checkbox"
                                        checked={selectedQuestions.includes(q.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedQuestions([...selectedQuestions, q.id])
                                            } else {
                                                setSelectedQuestions(selectedQuestions.filter(id => id !== q.id))
                                            }
                                        }}
                                        className="mt-1"
                                    />
                                    <div>
                                        <p className="text-dark-900">{q.question_text}</p>
                                        <div className="flex gap-2 mt-1">
                                            <span className={`badge ${q.difficulty === 'easy' ? 'badge-success' : q.difficulty === 'medium' ? 'badge-warning' : 'badge-danger'}`}>
                                                {q.difficulty}
                                            </span>
                                            <span className="badge badge-gray">{q.points} pts</span>
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>

                        <div className="flex gap-3 pt-4 mt-4 border-t border-dark-100">
                            <button onClick={() => setShowAddQuestions(false)} className="btn btn-secondary flex-1">Cancel</button>
                            <button
                                onClick={() => addQuestionsMutation.mutate(selectedQuestions)}
                                disabled={selectedQuestions.length === 0 || addQuestionsMutation.isPending}
                                className="btn btn-primary flex-1"
                            >
                                {addQuestionsMutation.isPending ? 'Adding...' : `Add ${selectedQuestions.length} Questions`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
