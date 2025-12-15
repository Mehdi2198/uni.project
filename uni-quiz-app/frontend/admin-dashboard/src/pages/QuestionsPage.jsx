import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { questionsApi, classesApi, filesApi } from '../services/api'
import { Plus, Search, Filter, Trash2, Edit2, Image, HelpCircle, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import AIQuestionModal from '../components/AIQuestionModal'

export default function QuestionsPage() {
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showAIModal, setShowAIModal] = useState(false)
    const [filters, setFilters] = useState({ class_id: '', difficulty: '' })
    const [imageUrl, setImageUrl] = useState('')
    const [uploading, setUploading] = useState(false)
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
            setImageUrl('')
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

    const handleUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        setUploading(true)
        try {
            const res = await filesApi.uploadImage(file)
            setImageUrl(res.data.url)
            toast.success('Image uploaded')
        } catch (error) {
            toast.error('Failed to upload image')
        } finally {
            setUploading(false)
        }
    }

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
            image_url: imageUrl || null
        })
    }

    const handleAIResults = async (generatedQuestions) => {
        // Transform AI response to API format
        const formattedQuestions = generatedQuestions.map(q => {
            // Map options to {id, text}
            const options = q.options.map((opt, idx) => ({
                id: String.fromCharCode(97 + idx), // a, b, c, d
                text: opt
            }))

            // Find correct answer id
            let correctId = 'a'
            const correctIndex = q.options.findIndex(opt =>
                opt.trim().toLowerCase() === (q.correct_answer || '').trim().toLowerCase()
            )
            if (correctIndex !== -1) {
                correctId = String.fromCharCode(97 + correctIndex)
            }

            return {
                question_text: q.question_text,
                question_type: 'multiple_choice',
                options: options,
                correct_answer: correctId,
                explanation: q.explanation,
                points: 1,
                difficulty: 'medium',
                class_id: filters.class_id || null
            }
        })

        try {
            await questionsApi.bulkImport({
                class_id: filters.class_id || null,
                questions: formattedQuestions
            })
            queryClient.invalidateQueries(['questions'])
            toast.success(`Successfully added ${formattedQuestions.length} questions!`)
        } catch (error) {
            console.error(error)
            toast.error('Failed to save generated questions')
        }
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
                <div className="flex gap-2">
                    <button onClick={() => setShowAIModal(true)} className="btn bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 hover:opacity-90 flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition shadow-sm">
                        <Sparkles className="w-5 h-5" /> AI Assistant
                    </button>
                    <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                        <Plus className="w-5 h-5" /> Add Question
                    </button>
                </div>
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
                    <div className="flex justify-center gap-2">
                        <button onClick={() => setShowAIModal(true)} className="btn bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 hover:opacity-90 flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition shadow-sm">
                            <Sparkles className="w-5 h-5" /> Use AI
                        </button>
                        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                            <Plus className="w-5 h-5" /> Add Question
                        </button>
                    </div>
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

                            <div>
                                <label className="block text-sm font-medium text-dark-700 mb-2">Image (Optional)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleUpload}
                                        className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                    />
                                    {uploading && <span className="text-sm text-dark-500">Uploading...</span>}
                                </div>
                                {imageUrl && (
                                    <div className="mt-2 relative inline-block">
                                        <img src={imageUrl} alt="Preview" className="h-20 rounded border border-dark-200" />
                                        <button
                                            type="button"
                                            onClick={() => setImageUrl('')}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center text-xs"
                                        >
                                            ×
                                        </button>
                                    </div>
                                )}
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

            <AIQuestionModal
                isOpen={showAIModal}
                onClose={() => setShowAIModal(false)}
                onQuestionsGenerated={handleAIResults}
                showToast={toast}
            />
        </div>
    )
}
