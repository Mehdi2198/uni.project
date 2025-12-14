import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { classesApi } from '../services/api'
import { Link } from 'react-router-dom'
import { Plus, Users, Link as LinkIcon, Copy, Check, MoreVertical, Trash2, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ClassesPage() {
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [copiedId, setCopiedId] = useState(null)
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['classes'],
        queryFn: () => classesApi.getAll({}),
    })

    const createMutation = useMutation({
        mutationFn: classesApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries(['classes'])
            setShowCreateModal(false)
            toast.success('Class created successfully!')
        },
        onError: (error) => {
            toast.error(error.response?.data?.detail || 'Failed to create class')
        },
    })

    const deleteMutation = useMutation({
        mutationFn: classesApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries(['classes'])
            toast.success('Class deleted')
        },
    })

    const handleCopyLink = async (inviteLink, id) => {
        await navigator.clipboard.writeText(inviteLink)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
        toast.success('Invite link copied!')
    }

    const handleCreate = (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        createMutation.mutate({
            name: formData.get('name'),
            description: formData.get('description'),
        })
    }

    const classes = data?.data?.classes || []

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900">Classes</h1>
                    <p className="text-dark-500">Manage your classes and students</p>
                </div>
                <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                    <Plus className="w-5 h-5" /> Create Class
                </button>
            </div>

            {/* Classes Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-xl border border-dark-100 p-6 animate-pulse">
                            <div className="h-6 bg-dark-100 rounded w-3/4 mb-4" />
                            <div className="h-4 bg-dark-100 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : classes.length === 0 ? (
                <div className="bg-white rounded-xl border border-dark-100 p-12 text-center">
                    <Users className="w-16 h-16 mx-auto text-dark-300 mb-4" />
                    <h3 className="text-lg font-semibold text-dark-900 mb-2">No classes yet</h3>
                    <p className="text-dark-500 mb-6">Create your first class to get started</p>
                    <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                        <Plus className="w-5 h-5" /> Create Class
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes.map((cls) => (
                        <div key={cls.id} className="bg-white rounded-xl border border-dark-100 p-6 card-hover">
                            <div className="flex items-start justify-between mb-4">
                                <Link to={`/classes/${cls.id}`}>
                                    <h3 className="font-semibold text-dark-900 hover:text-primary-600">
                                        {cls.name}
                                    </h3>
                                </Link>
                                <span className={`badge ${cls.is_active ? 'badge-success' : 'badge-gray'}`}>
                                    {cls.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            {cls.description && (
                                <p className="text-sm text-dark-500 mb-4 line-clamp-2">{cls.description}</p>
                            )}

                            <div className="flex items-center gap-4 text-sm text-dark-500 mb-4">
                                <span className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    {cls.student_count} students
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleCopyLink(cls.invite_link, cls.id)}
                                    className="btn btn-outline flex-1"
                                >
                                    {copiedId === cls.id ? (
                                        <><Check className="w-4 h-4" /> Copied</>
                                    ) : (
                                        <><Copy className="w-4 h-4" /> Copy Link</>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm('Delete this class?')) {
                                            deleteMutation.mutate(cls.id)
                                        }
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
                    <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-dark-900 mb-6">Create New Class</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-dark-700 mb-2">
                                    Class Name *
                                </label>
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    className="input"
                                    placeholder="Introduction to Programming"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    className="input min-h-[100px]"
                                    placeholder="Brief description of the class..."
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary flex-1">
                                    Cancel
                                </button>
                                <button type="submit" disabled={createMutation.isPending} className="btn btn-primary flex-1">
                                    {createMutation.isPending ? 'Creating...' : 'Create Class'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
