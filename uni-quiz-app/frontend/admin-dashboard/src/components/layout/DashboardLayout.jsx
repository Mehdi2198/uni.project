import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
    LayoutDashboard,
    Users,
    HelpCircle,
    FileQuestion,
    BarChart3,
    LogOut,
    Menu,
    X,
    GraduationCap
} from 'lucide-react'

const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/classes', icon: Users, label: 'Classes' },
    { path: '/questions', icon: HelpCircle, label: 'Question Bank' },
    { path: '/quizzes', icon: FileQuestion, label: 'Quizzes' },
    { path: '/results', icon: BarChart3, label: 'Results' },
]

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { user, logout } = useAuthStore()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-dark-50">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-dark-200
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-6 py-5 border-b border-dark-100">
                        <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-dark-900">Quiz Admin</h1>
                            <p className="text-xs text-dark-500">Instructor Panel</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive
                                        ? 'bg-primary-50 text-primary-700 font-medium'
                                        : 'text-dark-600 hover:bg-dark-50 hover:text-dark-900'
                                    }
                `}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>

                    {/* User section */}
                    <div className="p-4 border-t border-dark-100">
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-50">
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-primary-700 font-semibold">
                                    {user?.full_name?.charAt(0) || 'U'}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-dark-900 truncate">
                                    {user?.full_name || 'User'}
                                </p>
                                <p className="text-xs text-dark-500 truncate">
                                    {user?.email || 'user@email.com'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 mt-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-dark-100">
                    <div className="flex items-center justify-between px-4 py-4 lg:px-8">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-dark-600 hover:text-dark-900"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <div className="flex-1 lg:flex-none">
                            {/* Search could go here */}
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="hidden sm:block text-sm text-dark-600">
                                Welcome, <span className="font-medium text-dark-900">{user?.full_name?.split(' ')[0]}</span>
                            </span>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
