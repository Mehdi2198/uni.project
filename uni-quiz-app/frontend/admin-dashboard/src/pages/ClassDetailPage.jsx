import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { classesApi } from '../services/api'
import { ArrowLeft, Users, Copy, ExternalLink, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ClassDetailPage() {
    const { id } = useParams()

    const { data: classData, isLoading } = useQuery({
        queryKey: ['class', id],
        queryFn: () => classesApi.getById(id),
    })

    const { data: studentsData } = useQuery({
        queryKey: ['class-students', id],
        queryFn: () => classesApi.getStudents(id),
    })

    const handleCopyLink = async () => {
        const link = classData?.data?.invite_link
        if (link) {
            await navigator.clipboard.writeText(link)
            toast.success('Invite link copied!')
        }
    }

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-6">
                <div className="h-8 bg-dark-100 rounded w-48" />
                <div className="h-32 bg-dark-100 rounded-xl" />
            </div>
        )
    }

    const cls = classData?.data
    const students = studentsData?.data || []

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Back Button */}
            <Link to="/classes" className="inline-flex items-center gap-2 text-dark-500 hover:text-dark-900">
                <ArrowLeft className="w-5 h-5" /> Back to Classes
            </Link>

            {/* Class Info */}
            <div className="bg-white rounded-xl border border-dark-100 p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-dark-900">{cls?.name}</h1>
                        {cls?.description && (
                            <p className="text-dark-500 mt-1">{cls.description}</p>
                        )}
                    </div>
                    <span className={`badge ${cls?.is_active ? 'badge-success' : 'badge-gray'}`}>
                        {cls?.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>

                {/* Invite Link */}
                <div className="bg-dark-50 rounded-lg p-4 mt-6">
                    <p className="text-sm font-medium text-dark-700 mb-2">Invite Link</p>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            readOnly
                            value={cls?.invite_link || ''}
                            className="input bg-white flex-1"
                        />
                        <button onClick={handleCopyLink} className="btn btn-primary">
                            <Copy className="w-4 h-4" /> Copy
                        </button>
                    </div>
                    <p className="text-xs text-dark-500 mt-2">
                        Share this link with students to enroll them in your class
                    </p>
                </div>
            </div>

            {/* Students List */}
            <div className="bg-white rounded-xl border border-dark-100 overflow-hidden">
                <div className="p-6 border-b border-dark-100">
                    <h2 className="text-lg font-semibold text-dark-900 flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Enrolled Students ({students.length})
                    </h2>
                </div>

                {students.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users className="w-12 h-12 mx-auto text-dark-300 mb-4" />
                        <p className="text-dark-500">No students enrolled yet</p>
                        <p className="text-sm text-dark-400 mt-1">
                            Share your invite link to get students enrolled
                        </p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Telegram</th>
                                    <th>Student ID</th>
                                    <th>Enrolled</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => (
                                    <tr key={student.id}>
                                        <td className="font-medium text-dark-900">
                                            {student.first_name} {student.last_name || ''}
                                        </td>
                                        <td>
                                            {student.telegram_username ? (
                                                <a
                                                    href={`https://t.me/${student.telegram_username}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary-600 hover:text-primary-700 flex items-center gap-1"
                                                >
                                                    @{student.telegram_username}
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            ) : (
                                                <span className="text-dark-400">-</span>
                                            )}
                                        </td>
                                        <td>{student.student_id || '-'}</td>
                                        <td className="text-dark-500">
                                            {new Date(student.enrolled_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
