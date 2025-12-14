import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { questionsApi, classesApi } from '../services/api'
import { Plus, Search, Filter, Trash2, Edit2, Image, HelpCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function QuestionsPage() {
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [filters, setFilters] = useState({ class_id: '', difficulty: '' })
    const queryClient = useQueryClient()

    const { data: questionsData, isLoading } = useQuery({
        queryKey: ['questions', filters],
        queryFn: () => {
            const cleanFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== '')
            );
            return questionsApi.getAll(cleanFilters);
        },
    })

    const { data: classesData } = useQuery({
        queryKey: ['classes'],
        queryFn: () => classesApi.getAll({}),
    })

    const createMutation = useMutation({
        mutationFn: questionsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries(['questions'])
            setShowCreateModal(false)
            toast.success('Question created!')
        },
        onError: (error) => toast.error(error.response?.data?.detail || 'Failed to create'),
    })

    const deleteMutation = useMutation({
        mutationFn: questionsApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries(['questions'])
            toast.success('Question deleted')
        },
    })

    const handleCreate = (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)

        const options = ['a', 'b', 'c', 'd'].map(id => ({
            id,
            text: formData.get(`option_${id}`)
        })).filter(opt => opt.text)

        createMutation.mutate({
            class_id: formData.get('class_id') || null,
            question_text: formData.get('question_text'),
            question_type: 'multiple_choice',
            options,
            correct_answer: formData.get('correct_answer'),
            explanation: formData.get('explanation') || null,
            points: parseInt(formData.get('points')) || 1,
            difficulty: formData.get('difficulty'),
        })
    }

    const questions = questionsData?.data?.questions || []
    const classes = classesData?.data?.classes || []

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900">Question Bank</h1>
                    <p className="text-dark-500">{questionsData?.data?.total || 0} questions</p>
                </div>
                <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                    <Plus className="w-5 h-5" /> Add Question
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <select
                    value={filters.class_id}
                    onChange={(e) => setFilters(f => ({ ...f, class_id: e.target.value }))}
                    className="input w-auto"
                >
                    <option value="">All Classes</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select
                    value={filters.difficulty}
                    onChange={(e) => setFilters(f => ({ ...f, difficulty: e.target.value }))}
                    className="input w-auto"
                >
                    <option value="">All Difficulties</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                </select>
            </div>

            {/* Questions List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-xl border border-dark-100 p-6 animate-pulse">
                            <div className="h-5 bg-dark-100 rounded w-3/4 mb-3" />
                            <div className="h-4 bg-dark-100 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : questions.length === 0 ? (
                <div className="bg-white rounded-xl border border-dark-100 p-12 text-center">
                    <HelpCircle className="w-16 h-16 mx-auto text-dark-300 mb-4" />
                    <h3 className="text-lg font-semibold text-dark-900 mb-2">No questions yet</h3>
                    <p className="text-dark-500 mb-6">Add questions to your question bank</p>
                    <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                        <Plus className="w-5 h-5" /> Add Question
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {questions.map((q) => (
                        <div key={q.id} className="bg-white rounded-xl border border-dark-100 p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <p className="font-medium text-dark-900 mb-2">{q.question_text}</p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className={`badge ${q.difficulty === 'easy' ? 'badge-success' :
                                            q.difficulty === 'medium' ? 'badge-warning' : 'badge-danger'
                                            }`}>
                                            {q.difficulty}
                                        </span>
                                        <span className="badge badge-gray">{q.points} pts</span>
                                        {q.image_url && <span className="badge badge-primary"><Image className="w-3 h-3" /> Image</span>}
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        if (confirm('Delete this question?')) deleteMutation.mutate(q.id)
                                    }}
                                    className="text-dark-400 hover:text-red-600"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            {q.options && (
                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    {q.options.map(opt => (
                                        <div
                                            key={opt.id}
                                            className={`px-3 py-2 rounded-lg text-sm ${opt.id === q.correct_answer
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'bg-dark-50 text-dark-700'
                                                }`}
                                        >
                                            <span className="font-medium">{opt.id.toUpperCase()}.</span> {opt.text}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content p-6 max-w-2xl" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-dark-900 mb-6">Add Question</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-dark-700 mb-2">Class</label>
                                    <select name="class_id" className="input">
                                        <option value="">No specific class</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark-700 mb-2">Difficulty</label>
                                    <select name="difficulty" className="input" defaultValue="medium">
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-dark-700 mb-2">Question *</label>
                                <textarea name="question_text" required className="input min-h-[80px]" placeholder="Enter your question..." />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {['a', 'b', 'c', 'd'].map(id => (
                                    <div key={id}>
                                        <label className="block text-sm font-medium text-dark-700 mb-2">Option {id.toUpperCase()}</label>
                                        <input name={`option_${id}`} type="text" className="input" placeholder={`Option ${id.toUpperCase()}`} />
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-dark-700 mb-2">Correct Answer *</label>
                                    <select name="correct_answer" required className="input">
                                        <option value="">Select answer</option>
                                        <option value="a">A</option>
                                        <option value="b">B</option>
                                        <option value="c">C</option>
                                        <option value="d">D</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark-700 mb-2">Points</label>
                                    <input name="points" type="number" defaultValue={1} min={1} max={100} className="input" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-dark-700 mb-2">Explanation</label>
                                <textarea name="explanation" className="input min-h-[60px]" placeholder="Explain the correct answer..." />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary flex-1">Cancel</button>
                                <button type="submit" disabled={createMutation.isPending} className="btn btn-primary flex-1">
                                    {createMutation.isPending ? 'Saving...' : 'Save Question'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
