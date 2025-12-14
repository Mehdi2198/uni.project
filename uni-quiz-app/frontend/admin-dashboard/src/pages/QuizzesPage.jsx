import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { quizzesApi, classesApi, questionsApi } from '../services/api'
import { Link } from 'react-router-dom'
import { Plus, FileQuestion, Clock, Users, Trash2, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function QuizzesPage() {
    const [showCreateModal, setShowCreateModal] = useState(false)
    const queryClient = useQueryClient()

    const { data: quizzesData, isLoading } = useQuery({
        queryKey: ['quizzes'],
        queryFn: () => quizzesApi.getAll({}),
    })

    const { data: classesData } = useQuery({
        queryKey: ['classes'],
        queryFn: () => classesApi.getAll({}),
    })

    const createMutation = useMutation({
        mutationFn: quizzesApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries(['quizzes'])
            setShowCreateModal(false)
            toast.success('Quiz created!')
        },
        onError: (error) => toast.error(error.response?.data?.detail || 'Failed to create'),
    })

    const publishMutation = useMutation({
        mutationFn: ({ id, isPublished }) => quizzesApi.publish(id, isPublished),
        onSuccess: () => {
            queryClient.invalidateQueries(['quizzes'])
            toast.success('Quiz updated!')
        },
    })

    const deleteMutation = useMutation({
        mutationFn: quizzesApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries(['quizzes'])
            toast.success('Quiz deleted')
        },
    })

    const handleCreate = (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        createMutation.mutate({
            class_id: formData.get('class_id'),
            title: formData.get('title'),
            description: formData.get('description') || null,
            question_count: parseInt(formData.get('question_count')),
            time_limit_minutes: formData.get('time_limit') ? parseInt(formData.get('time_limit')) : null,
            passing_score: parseInt(formData.get('passing_score')) || 60,
            max_attempts: parseInt(formData.get('max_attempts')) || 1,
            show_results: true,
            show_explanations: true,
        })
    }

    const quizzes = quizzesData?.data?.quizzes || []
    const classes = classesData?.data?.classes || []

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900">Quizzes</h1>
                    <p className="text-dark-500">{quizzesData?.data?.total || 0} quizzes</p>
                </div>
                <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                    <Plus className="w-5 h-5" /> Create Quiz
                </button>
            </div>

            {/* Quizzes List */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map(i => (
                        <div key={i} className="bg-white rounded-xl border border-dark-100 p-6 animate-pulse">
                            <div className="h-6 bg-dark-100 rounded w-3/4 mb-4" />
                            <div className="h-4 bg-dark-100 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : quizzes.length === 0 ? (
                <div className="bg-white rounded-xl border border-dark-100 p-12 text-center">
                    <FileQuestion className="w-16 h-16 mx-auto text-dark-300 mb-4" />
                    <h3 className="text-lg font-semibold text-dark-900 mb-2">No quizzes yet</h3>
                    <p className="text-dark-500 mb-6">Create your first quiz</p>
                    <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                        <Plus className="w-5 h-5" /> Create Quiz
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quizzes.map((quiz) => (
                        <div key={quiz.id} className="bg-white rounded-xl border border-dark-100 p-6 card-hover">
                            <div className="flex items-start justify-between mb-4">
                                <Link to={`/quizzes/${quiz.id}`}>
                                    <h3 className="font-semibold text-dark-900 hover:text-primary-600">{quiz.title}</h3>
                                </Link>
                                <span className={`badge ${quiz.is_published ? 'badge-success' : 'badge-warning'}`}>
                                    {quiz.is_published ? 'Published' : 'Draft'}
                                </span>
                            </div>

                            {quiz.description && (
                                <p className="text-sm text-dark-500 mb-4 line-clamp-2">{quiz.description}</p>
                            )}

                            <div className="flex flex-wrap gap-3 text-sm text-dark-500 mb-4">
                                <span className="flex items-center gap-1">
                                    <FileQuestion className="w-4 h-4" /> {quiz.question_count} questions
                                </span>
                                {quiz.time_limit_minutes && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" /> {quiz.time_limit_minutes} min
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    Pool: {quiz.pool_size}/{quiz.question_count}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => publishMutation.mutate({ id: quiz.id, isPublished: !quiz.is_published })}
                                    className={`btn flex-1 ${quiz.is_published ? 'btn-secondary' : 'btn-success'}`}
                                    disabled={!quiz.is_published && quiz.pool_size < quiz.question_count}
                                >
                                    {quiz.is_published ? (
                                        <><EyeOff className="w-4 h-4" /> Unpublish</>
                                    ) : (
                                        <><Eye className="w-4 h-4" /> Publish</>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm('Delete this quiz?')) deleteMutation.mutate(quiz.id)
                                    }}
                                    className="btn btn-outline text-red-600 hover:bg-red-50 px-3"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-dark-900 mb-6">Create Quiz</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-dark-700 mb-2">Class *</label>
                                <select name="class_id" required className="input">
                                    <option value="">Select a class</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark-700 mb-2">Quiz Title *</label>
                                <input name="title" type="text" required className="input" placeholder="Midterm Exam" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark-700 mb-2">Description</label>
                                <textarea name="description" className="input min-h-[80px]" placeholder="Quiz description..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-dark-700 mb-2">Questions per Student *</label>
                                    <input name="question_count" type="number" required min={1} max={100} defaultValue={10} className="input" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark-700 mb-2">Time Limit (min)</label>
                                    <input name="time_limit" type="number" min={1} max={480} className="input" placeholder="No limit" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-dark-700 mb-2">Passing Score (%)</label>
                                    <input name="passing_score" type="number" min={0} max={100} defaultValue={60} className="input" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark-700 mb-2">Max Attempts</label>
                                    <input name="max_attempts" type="number" min={1} max={10} defaultValue={1} className="input" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary flex-1">Cancel</button>
                                <button type="submit" disabled={createMutation.isPending} className="btn btn-primary flex-1">
                                    {createMutation.isPending ? 'Creating...' : 'Create Quiz'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
