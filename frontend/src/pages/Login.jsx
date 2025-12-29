import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

const Login = () => {
    const [isRegistering, setIsRegistering] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        enrollmentNumber: '',
        contactNumber: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (isRegistering) {
            if (formData.password !== formData.confirmPassword) {
                return setError('Passwords do not match');
            }
            try {
                const res = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: formData.username,
                        password: formData.password,
                        enrollmentNumber: formData.enrollmentNumber,
                        contactNumber: formData.contactNumber
                    })
                });
                const data = await res.json();
                if (res.ok) {
                    setSuccessMsg('Registration successful! Please login.');
                    setIsRegistering(false);
                    setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
                } else {
                    setError(data.error || 'Registration failed');
                }
            } catch (err) {
                setError('Registration failed. Please try again.');
            }
        } else {
            // Standard Login (Username/Enrollment/Mobile + Password)
            try {
                await login(formData.username, formData.password);
                navigate('/');
            } catch (err) {
                setError(err.response?.data?.error || 'Login failed');
            }
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 overflow-y-auto">
            {/* App Header */}
            <div className="flex flex-row items-center justify-center gap-4 mb-6 md:mb-8 text-base-content w-full max-w-2xl">
                <div className="avatar">
                    <div className="w-16 md:w-24 rounded-xl bg-base-content/5 p-2 backdrop-blur-sm">
                        <img
                            src="/logo.png"
                            alt="College Logo"
                            onError={(e) => e.target.src = '/logo.svg'}
                        />
                    </div>
                </div>
                <div className="text-left">
                    <h1 className="text-lg md:text-2xl font-bold text-primary leading-tight">
                        Government Pench Valley PG College, Parasia
                    </h1>
                    <h2 className="text-sm md:text-lg font-semibold opacity-80">
                        Department of Botany
                    </h2>
                    <div className="badge badge-sm md:badge-md badge-primary gap-1 mt-1">
                        📸 E-Attendance System
                    </div>
                </div>
            </div>

            <div className="card w-full max-w-sm bg-base-100 shadow-xl">
                <div className="card-body">
                    <div className="text-center mb-4">
                        <div className="avatar placeholder mb-2">
                            <div className="bg-primary text-primary-content rounded-full w-12">
                                <LogIn size={24} />
                            </div>
                        </div>
                        <h2 className="card-title justify-center text-2xl font-bold text-base-content">
                            {isRegistering ? 'Create Account' : 'Welcome Back'}
                        </h2>
                        <p className="text-base-content/60 text-sm">
                            {isRegistering ? 'Register to get started' : 'Sign in with your credentials'}
                        </p>
                    </div>

                    {error && (
                        <div className="alert alert-error text-sm py-2 mb-4">
                            <span>{error}</span>
                        </div>
                    )}
                    {successMsg && (
                        <div className="alert alert-success text-sm py-2 mb-4">
                            <span>{successMsg}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isRegistering && (
                            <div className="form-control">
                                <label className="label py-1">
                                    <span className="label-text font-semibold">Enrollment or Mobile Number</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        name="username"
                                        className="input input-bordered w-full pl-10"
                                        value={formData.username}
                                        onChange={handleChange}
                                        placeholder="Enter Enrollment or Mobile No."
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {isRegistering && (
                            <>
                                <div className="form-control">
                                    <label className="label py-1">
                                        <span className="label-text font-semibold">Username</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
                                            <User size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            name="username"
                                            className="input input-bordered w-full pl-10"
                                            value={formData.username}
                                            onChange={handleChange}
                                            placeholder="Choose a username"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-control">
                                    <label className="label py-1">
                                        <span className="label-text font-semibold">Enrollment Number</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="enrollmentNumber"
                                        className="input input-bordered w-full"
                                        value={formData.enrollmentNumber}
                                        onChange={handleChange}
                                        placeholder="Enter enrollment no."
                                        required
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label py-1">
                                        <span className="label-text font-semibold">Mobile Number</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="contactNumber"
                                        className="input input-bordered w-full"
                                        value={formData.contactNumber}
                                        onChange={handleChange}
                                        placeholder="Enter mobile no."
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <div className="form-control">
                            <label className="label py-1">
                                <span className="label-text font-semibold">Password</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    className="input input-bordered w-full pl-10 pr-10"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter password"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/50 hover:text-primary transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {isRegistering && (
                            <div className="form-control">
                                <label className="label py-1">
                                    <span className="label-text font-semibold">Confirm Password</span>
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    className="input input-bordered w-full"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm password"
                                    required
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary w-full mt-4"
                        >
                            <span>{isRegistering ? 'Register' : 'Sign In'}</span>
                            <LogIn size={18} />
                        </button>
                    </form>

                    <div className="divider my-2">OR</div>

                    <div className="text-center flex flex-col gap-1">
                        <button
                            onClick={() => {
                                setIsRegistering(!isRegistering);
                                setError('');
                                setSuccessMsg('');
                            }}
                            className="btn btn-link no-underline text-sm"
                        >
                            {isRegistering
                                ? 'Already have an account? Login'
                                : 'New here? Create an Account'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-8 text-base-content/60 text-xs">
                &copy; {new Date().getFullYear()} Government Pench Valley PG College
            </div>
        </div>
    );
};

export default Login;
