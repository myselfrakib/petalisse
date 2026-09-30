import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isAdmin, login, signup, adminSignup, resetPassword } = useAuth();

  const redirectParam = searchParams.get('redirect');
  const isAdminIntent =
    location.pathname.startsWith('/admin') ||
    redirectParam?.startsWith('/admin') ||
    searchParams.get('role') === 'admin';

  // Mode: signin, signup, forgot
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // If already logged in, redirect to destination
  useEffect(() => {
    if (currentUser) {
      if (redirectParam) {
        navigate(redirectParam, { replace: true });
      } else if (isAdmin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/profile', { replace: true });
      }
    }
  }, [currentUser, isAdmin, redirectParam, navigate]);

  // Reset errors and messages when portal mode changes
  useEffect(() => {
    setError(null);
    setSuccessMsg(null);
  }, [isAdminIntent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      if (mode === 'signin') {
        if (!email || !password) {
          throw new Error('Please enter both email and password.');
        }
        await login(email, password);
        // Successful login: navigate to redirect or appropriate page
        if (redirectParam) {
          navigate(redirectParam, { replace: true });
        } else if (isAdminIntent) {
          navigate('/admin', { replace: true });
        } else {
          navigate('/profile', { replace: true });
        }
      } else if (mode === 'signup') {
        if (!email || !password || !name) {
          throw new Error('Please provide your name, email, and password.');
        }

        if (isAdminIntent) {
          // Admin signup only available through the admin login page
          await adminSignup(email, password, name);
          navigate('/admin', { replace: true });
        } else {
          // Standard customer signup only through patron login page
          await signup(email, password, name, phone);
          if (redirectParam) {
            navigate(redirectParam, { replace: true });
          } else {
            navigate('/profile', { replace: true });
          }
        }
      } else if (mode === 'forgot') {
        if (!email) {
          throw new Error('Please enter your registered email address.');
        }
        await resetPassword(email);
        setSuccessMsg(
          'Password reset instructions have been sent to your email. Please check your inbox and spam folders.'
        );
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      let msg = err.message || 'An error occurred during authentication.';
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        msg = 'Invalid email or password. Please verify your credentials.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email address already exists. Please Sign In.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-220px)] py-10 sm:py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center animate-fadeIn">
      <div className="max-w-md w-full mx-auto">
        {/* Boutique Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block hover:opacity-85 transition group mb-2">
            <span className="font-['Parisienne'] text-4xl sm:text-5xl text-[#8E5B59] block tracking-wide group-hover:scale-[1.02] transition-transform">
              Petalisse
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#2C2724] font-medium tracking-tight">
            {isAdminIntent ? 'Administration Portal' : 'Patron & Boutique Portal'}
          </h1>
          <p className="text-xs text-[#786F66] mt-1.5 max-w-xs mx-auto">
            {isAdminIntent
              ? 'Secure console authentication for live catalog, inventory & customer orders'
              : 'Sign in to access your saved charms, customer orders, and boutique profile'}
          </p>
        </div>

        {/* Intent Info Badge if accessing admin portal */}
        {isAdminIntent && (
          <div className="mb-5 p-3.5 rounded-xl bg-[#FAF0ED] border border-[#E8C5B8] flex items-start gap-2.5 text-xs text-[#8E5B59] shadow-xs">
            <span className="text-base leading-none mt-0.5">🔒</span>
            <div>
              <span className="font-semibold block text-[#6B1A2A]">Admin Access Verification</span>
              <span className="text-[11px] text-[#6B5F55] leading-relaxed">
                Sign in with your administrator account or register for console access. Administrator authorization (<span className="font-mono font-medium text-[#8E5B59]">isAdmin: true</span>) is strictly verified against the database.
              </span>
            </div>
          </div>
        )}

        {/* Main Card Container */}
        <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] p-6 sm:p-8 shadow-xl relative overflow-hidden">
          {/* Subtle Decorative flourishes */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#EEDFD5]/50 to-transparent pointer-events-none rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#EEDFD5]/50 to-transparent pointer-events-none rounded-bl-2xl" />

          {/* Primary Navigation Tabs */}
          {mode !== 'forgot' ? (
            <div className="flex border-b border-[#EAE3D8] mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 pb-3 text-center text-xs font-semibold tracking-wider uppercase border-b-2 cursor-pointer transition ${
                  mode === 'signin'
                    ? 'border-[#8E5B59] text-[#8E5B59]'
                    : 'border-transparent text-[#8C827A] hover:text-[#2C2724]'
                }`}
              >
                {isAdminIntent ? 'Admin Sign In' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 pb-3 text-center text-xs font-semibold tracking-wider uppercase border-b-2 cursor-pointer transition ${
                  mode === 'signup'
                    ? 'border-[#8E5B59] text-[#8E5B59]'
                    : 'border-transparent text-[#8C827A] hover:text-[#2C2724]'
                }`}
              >
                {isAdminIntent ? 'Register Admin' : 'Create Account'}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between border-b border-[#EAE3D8] pb-3 mb-6">
              <span className="text-xs font-semibold tracking-wider uppercase text-[#8E5B59]">
                Password Recovery
              </span>
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-xs text-[#8C827A] hover:text-[#2C2724] underline cursor-pointer"
              >
                &larr; Back to Sign In
              </button>
            </div>
          )}

          {/* Alerts */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-[#FAF0ED] border border-[#E8C5B8] text-[#9E3E2B] text-xs flex items-start gap-2.5 leading-relaxed">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-[#F0F7F2] border border-[#C2DEC8] text-[#2C6B3F] text-xs flex items-start gap-2.5 leading-relaxed">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Admin Registration Notice - only visible on Admin Sign Up */}
          {isAdminIntent && mode === 'signup' && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#FAF0ED] border border-[#E8C5B8] text-[11px] text-[#6B5F55] leading-relaxed">
              <span className="font-semibold text-[#8E5B59] block mb-1">ℹ️ Database Authorization Required</span>
              <span>
                Administrator accounts are submitted with pending status. Live admin rights (<span className="font-mono text-[#8E5B59] font-medium">isAdmin: true</span>) must be approved directly in the Firestore database under the <span className="font-mono text-[#2C2724]">admins</span> collection before console access is granted.
              </span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-[#4A423B] mb-1">
                  {isAdminIntent ? 'Administrator Full Name' : 'Full Name'}{' '}
                  <span className="text-[#9E3E2B]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isAdminIntent ? 'Master Artisan / Admin' : 'Eleanor Vance'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] placeholder-[#A89E94] focus:outline-hidden focus:border-[#8E5B59] focus:ring-1 focus:ring-[#8E5B59] transition"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#4A423B] mb-1">
                {isAdminIntent ? 'Admin Work Email' : 'Email Address'}{' '}
                <span className="text-[#9E3E2B]">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isAdminIntent ? 'admin@petalisse.com' : 'patron@example.com'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] placeholder-[#A89E94] focus:outline-hidden focus:border-[#8E5B59] focus:ring-1 focus:ring-[#8E5B59] transition"
              />
            </div>

            {/* Phone Number only for Customer Signup */}
            {!isAdminIntent && mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-[#4A423B] mb-1">
                  Phone Number <span className="text-[11px] text-[#8C827A]">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] placeholder-[#A89E94] focus:outline-hidden focus:border-[#8E5B59] focus:ring-1 focus:ring-[#8E5B59] transition"
                />
              </div>
            )}

            {mode !== 'forgot' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-[#4A423B]">
                    Password <span className="text-[#9E3E2B]">*</span>
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] text-[#8E5B59] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] placeholder-[#A89E94] focus:outline-hidden focus:border-[#8E5B59] focus:ring-1 focus:ring-[#8E5B59] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C827A] hover:text-[#2C2724] text-xs p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-3 py-3 px-4 rounded-xl bg-[#8E5B59] hover:bg-[#784A48] text-white text-sm font-medium tracking-wide shadow-sm focus:outline-hidden focus:ring-2 focus:ring-[#8E5B59]/40 active:scale-[0.99] transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting && (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>
                {mode === 'signin' && (isAdminIntent ? 'Sign In to Admin Console' : 'Sign In to Boutique')}
                {mode === 'signup' && (isAdminIntent ? 'Register Admin Account' : 'Create Customer Account')}
                {mode === 'forgot' && (isAdminIntent ? 'Send Admin Password Recovery Link' : 'Send Password Recovery Link')}
              </span>
            </button>
          </form>

          {/* Quick Footer Links */}
          <div className="mt-6 pt-5 border-t border-[#EAE3D8] text-center space-y-3">
            {mode === 'signin' && (
              <p className="text-xs text-[#786F66]">
                {isAdminIntent ? 'Need to register an admin account? ' : 'New to Petalisse? '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="font-medium text-[#8E5B59] hover:underline cursor-pointer"
                >
                  {isAdminIntent ? 'Register admin account' : 'Create an account'}
                </button>
              </p>
            )}

            {mode === 'signup' && (
              <p className="text-xs text-[#786F66]">
                {isAdminIntent ? 'Already have an administrator account? ' : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="font-medium text-[#8E5B59] hover:underline cursor-pointer"
                >
                  {isAdminIntent ? 'Sign in to console' : 'Sign in here'}
                </button>
              </p>
            )}

            {/* Portal Switcher Shortcut */}
            {!isAdminIntent ? (
              <div>
                <Link
                  to="/admin/login"
                  className="text-[11px] text-[#A89E94] hover:text-[#6D635B] underline transition"
                >
                  Store administrator? Access Admin Portal &rarr;
                </Link>
              </div>
            ) : (
              <div>
                <Link
                  to="/login"
                  className="text-[11px] text-[#A89E94] hover:text-[#6D635B] underline transition"
                >
                  Looking for patron login? Customer Sign In &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Return to Storefront link */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-xs text-[#786F66] hover:text-[#2C2724] transition inline-flex items-center gap-1.5"
          >
            <span>&larr;</span>
            <span>Return to Petalisse Storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

