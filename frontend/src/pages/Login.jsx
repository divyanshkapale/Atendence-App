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

    const [isAdminLogin, setIsAdminLogin] = useState(false);

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
            // Standard Login (works for both Admin and Member due to backend logic, but UI differs)
            try {
                await login(formData.username, formData.password);
                navigate('/');
            } catch (err) {
                setError(err.response?.data?.error || 'Login failed');
            }
        }
    };

    return (

        <div className="hero min-h-screen bg-base-200">
            <div className="hero-content flex-col gap-8 w-full max-w-md">

                {/* Header Section */}
                <div className="text-center">
                    <div className="avatar mb-4">
                        <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 p-2 bg-white">
                            <img
                                src="/logo.png"
                                alt="College Logo"
                                onError={(e) => e.target.src = '/logo.svg'}
                                className="object-contain"
                            />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-base-content">Govt Pench Valley PG College</h1>
                    <p className="py-2 text-base-content/70">Department of Botany • E-Attendance System</p>
                </div>

                {/* Login Card */}
                <div className="card w-full shadow-2xl bg-base-100">
                    <div className="card-body">

                        {/* Title & Toggle */}
                        <div className="flex flex-col items-center mb-6">
                            <h2 className="card-title text-2xl mb-2">
                                {isRegistering ? 'Create Account' : isAdminLogin ? 'Admin Portal' : 'Student Login'}
                            </h2>

                            {!isRegistering && (
                                <div className="tabs tabs-boxed bg-base-200 mt-2">
                                    <a
                                        className={`tab ${!isAdminLogin ? 'tab-active bg-primary text-primary-content' : ''}`}
                                        onClick={() => { setIsAdminLogin(false); setError(''); }}
                                    >Student</a>
                                    <a
                                        className={`tab ${isAdminLogin ? 'tab-active bg-primary text-primary-content' : ''}`}
                                        onClick={() => { setIsAdminLogin(true); setError(''); }}
                                    >Admin</a>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="alert alert-error shadow-lg text-sm mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>{error}</span>
                            </div>
                        )}
                        {successMsg && (
                            <div className="alert alert-success shadow-lg text-sm mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>{successMsg}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!isRegistering && (
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-semibold">
                                            {isAdminLogin ? 'Admin Username' : 'Enrollment / Mobile'}
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-base-content/50">
                                            <User size={18} />
                                        </span>
                                        <input
                                            type="text"
                                            name="username"
                                            className="input input-bordered w-full pl-10 focus:input-primary"
                                            value={formData.username}
                                            onChange={handleChange}
                                            placeholder={isAdminLogin ? "admin_user" : "Enter ID or Mobile"}
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            {isRegistering && (
                                <>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text">Username</span></label>
                                        <input type="text" name="username" className="input input-bordered w-full" value={formData.username} onChange={handleChange} required />
                                    </div>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text">Enrollment No.</span></label>
                                        <input type="text" name="enrollmentNumber" className="input input-bordered w-full" value={formData.enrollmentNumber} onChange={handleChange} required />
                                    </div>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text">Mobile No.</span></label>
                                        <input type="tel" name="contactNumber" className="input input-bordered w-full" value={formData.contactNumber} onChange={handleChange} required />
                                    </div>
                                </>
                            )}

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold">Password</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-base-content/50">
                                        <Lock size={18} />
                                    </span>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        className="input input-bordered w-full pl-10 pr-10 focus:input-primary"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
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
                                    <label className="label"><span className="label-text">Confirm Password</span></label>
                                    <input type="password" name="confirmPassword" className="input input-bordered w-full" value={formData.confirmPassword} onChange={handleChange} required />
                                </div>
                            )}

                            <div className="form-control mt-6">
                                <button type="submit" className="btn btn-primary w-full text-lg shadow-md">
                                    {isRegistering ? 'Register Account' : isAdminLogin ? 'Access Dashboard' : 'Sign In'}
                                </button>
                            </div>
                        </form>

                        <div className="divider">OR</div>

                        <div className="flex justify-center">
                            <button
                                onClick={() => {
                                    setIsRegistering(!isRegistering);
                                    setIsAdminLogin(false);
                                    setError('');
                                    setSuccessMsg('');
                                }}
                                className="btn btn-ghost btn-sm normal-case font-normal text-base-content/70 hover:text-primary"
                            >
                                {isRegistering
                                    ? 'Already have an account? Login'
                                    : 'New Student? Create Account'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="text-center text-xs opacity-50">
                    &copy; {new Date().getFullYear()} Government Pench Valley PG College
                </div>
            </div>
        </div>
    );
};

export default Login;
