import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../store/authStore'
import { Eye, EyeOff, LogIn, GraduationCap } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { login } = useAuthStore()
    const navigate = useNavigate()

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm()

    const onSubmit = async (data) => {
        setIsLoading(true)

        const result = await login(data.email, data.password)

        if (result.success) {
            toast.success('Welcome back!')
            navigate('/dashboard')
        } else {
            toast.error(result.error)
        }

        setIsLoading(false)
    }

    return (
        <div className="glass rounded-2xl p-8 shadow-2xl animate-fade-in">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
                    <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-dark-900">Welcome Back</h1>
                <p className="text-dark-500 mt-1">Sign in to your instructor account</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                        Email Address
                    </label>
                    <input
                        type="email"
                        {...register('email', {
                            required: 'Email is required',
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: 'Invalid email address'
                            }
                        })}
                        className={`input ${errors.email ? 'input-error' : ''}`}
                        placeholder="you@university.edu"
                    />
                    {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                    )}
                </div>

                {/* Password */}
                <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            {...register('password', {
                                required: 'Password is required'
                            })}
                            className={`input pr-12 ${errors.password ? 'input-error' : ''}`}
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                    )}
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <LogIn className="w-5 h-5" />
                            Sign In
                        </>
                    )}
                </button>
            </form>

            {/* Footer */}
            <p className="text-center text-dark-500 mt-6">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary-600 font-medium hover:text-primary-700">
                    Register here
                </Link>
            </p>
        </div>
    )
}
