import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../store/authStore'
import { Eye, EyeOff, UserPlus, GraduationCap } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { register: registerUser } = useAuthStore()
    const navigate = useNavigate()

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm()

    const onSubmit = async (data) => {
        setIsLoading(true)

        const result = await registerUser({
            email: data.email,
            password: data.password,
            full_name: data.fullName,
            department: data.department || null
        })

        if (result.success) {
            toast.success('Registration successful! Please login.')
            navigate('/login')
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
                <h1 className="text-2xl font-bold text-dark-900">Create Account</h1>
                <p className="text-dark-500 mt-1">Register as an instructor</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Full Name */}
                <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                        Full Name
                    </label>
                    <input
                        type="text"
                        {...register('fullName', {
                            required: 'Full name is required',
                            minLength: { value: 2, message: 'Name must be at least 2 characters' }
                        })}
                        className={`input ${errors.fullName ? 'input-error' : ''}`}
                        placeholder="Dr. John Smith"
                    />
                    {errors.fullName && (
                        <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
                    )}
                </div>

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

                {/* Department */}
                <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                        Department <span className="text-dark-400">(optional)</span>
                    </label>
                    <input
                        type="text"
                        {...register('department')}
                        className="input"
                        placeholder="Computer Science"
                    />
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
                                required: 'Password is required',
                                minLength: { value: 8, message: 'Password must be at least 8 characters' }
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
                            <UserPlus className="w-5 h-5" />
                            Create Account
                        </>
                    )}
                </button>
            </form>

            {/* Footer */}
            <p className="text-center text-dark-500 mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">
                    Sign in
                </Link>
            </p>
        </div>
    )
}
