import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { classesApi, quizzesApi, questionsApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import {
    Users,
    FileQuestion,
    HelpCircle,
    TrendingUp,
    Plus,
    ArrowRight,
    BookOpen
} from 'lucide-react'

export default function DashboardPage() {
    const { user } = useAuthStore()

    // Fetch data
    const { data: classesData } = useQuery({
        queryKey: ['classes'],
        queryFn: () => classesApi.getAll({ limit: 5 }),
    })

    const { data: quizzesData } = useQuery({
        queryKey: ['quizzes'],
        queryFn: () => quizzesApi.getAll({ limit: 5 }),
    })

    const { data: questionsData } = useQuery({
        queryKey: ['questions'],
        queryFn: () => questionsApi.getAll({ limit: 1 }),
    })

    const stats = [
        {
            label: 'Total Classes',
            value: classesData?.data?.total || 0,
            icon: Users,
            color: 'bg-blue-500',
            href: '/classes'
        },
        {
            label: 'Active Quizzes',
            value: quizzesData?.data?.total || 0,
            icon: FileQuestion,
            color: 'bg-emerald-500',
            href: '/quizzes'
        },
        {
            label: 'Questions in Bank',
            value: questionsData?.data?.total || 0,
            icon: HelpCircle,
            color: 'bg-amber-500',
            href: '/questions'
        },
        {
            label: 'Total Students',
            value: classesData?.data?.classes?.reduce((acc, c) => acc + (c.student_count || 0), 0) || 0,
            icon: TrendingUp,
            color: 'bg-purple-500',
            href: '/classes'
        },
    ]

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZ2LTRoLTJ2NGgyem0tNiA2aC00djJoNHYtMnptMC02di00aC00djRoNHptLTYgNmgtNHYyaDR2LTJ6bTAtNnYtNGgtNHY0aDR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
                <div className="relative">
                    <p className="text-primary-100 mb-1">Welcome back,</p>
                    <h1 className="text-3xl font-bold mb-2">{user?.full_name || 'Professor'}</h1>
                    <p className="text-primary-100">
                        Ready to create engaging quizzes for your students?
                    </p>
                </div>
                <BookOpen className="absolute right-8 bottom-0 w-32 h-32 text-white/10" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <Link
                        key={stat.label}
                        to={stat.href}
                        className="bg-white rounded-xl p-6 border border-dark-100 card-hover"
                    >
                        <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                            <stat.icon className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-3xl font-bold text-dark-900">{stat.value}</p>
                        <p className="text-dark-500">{stat.label}</p>
                    </Link>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Classes */}
                <div className="bg-white rounded-xl border border-dark-100 overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-dark-100">
                        <h2 className="text-lg font-semibold text-dark-900">Recent Classes</h2>
                        <Link to="/classes" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
                            View all <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="divide-y divide-dark-100">
                        {classesData?.data?.classes?.length > 0 ? (
                            classesData.data.classes.slice(0, 4).map((cls) => (
                                <Link
                                    key={cls.id}
                                    to={`/classes/${cls.id}`}
                                    className="flex items-center justify-between p-4 hover:bg-dark-50 transition-colors"
                                >
                                    <div>
                                        <p className="font-medium text-dark-900">{cls.name}</p>
                                        <p className="text-sm text-dark-500">{cls.student_count} students</p>
                                    </div>
                                    <span className={`badge ${cls.is_active ? 'badge-success' : 'badge-gray'}`}>
                                        {cls.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </Link>
                            ))
                        ) : (
                            <div className="p-8 text-center text-dark-500">
                                <Users className="w-12 h-12 mx-auto mb-3 text-dark-300" />
                                <p>No classes yet</p>
                                <Link to="/classes" className="btn btn-primary mt-4">
                                    <Plus className="w-4 h-4" /> Create Class
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Quizzes */}
                <div className="bg-white rounded-xl border border-dark-100 overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-dark-100">
                        <h2 className="text-lg font-semibold text-dark-900">Recent Quizzes</h2>
                        <Link to="/quizzes" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
                            View all <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="divide-y divide-dark-100">
                        {quizzesData?.data?.quizzes?.length > 0 ? (
                            quizzesData.data.quizzes.slice(0, 4).map((quiz) => (
                                <Link
                                    key={quiz.id}
                                    to={`/quizzes/${quiz.id}`}
                                    className="flex items-center justify-between p-4 hover:bg-dark-50 transition-colors"
                                >
                                    <div>
                                        <p className="font-medium text-dark-900">{quiz.title}</p>
                                        <p className="text-sm text-dark-500">{quiz.question_count} questions</p>
                                    </div>
                                    <span className={`badge ${quiz.is_published ? 'badge-success' : 'badge-warning'}`}>
                                        {quiz.is_published ? 'Published' : 'Draft'}
                                    </span>
                                </Link>
                            ))
                        ) : (
                            <div className="p-8 text-center text-dark-500">
                                <FileQuestion className="w-12 h-12 mx-auto mb-3 text-dark-300" />
                                <p>No quizzes yet</p>
                                <Link to="/quizzes" className="btn btn-primary mt-4">
                                    <Plus className="w-4 h-4" /> Create Quiz
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
