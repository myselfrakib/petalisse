import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { login, signup, resetPassword } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        onClose();
      } else if (mode === 'signup') {
        if (!email || !password) {
          throw new Error('Please fill in all required fields');
        }
        await signup(email, password, name, phone);
        onClose();
      } else if (mode === 'forgot') {
        if (!email) {
          throw new Error('Please enter your email address');
        }
        await resetPassword(email);
        setSuccessMsg(
          'Password reset instructions have been dispatched to your email. Please check your inbox and spam folders.'
        );
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let message = err.message || 'An error occurred during authentication';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Invalid email or password. Please verify your credentials.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'An account with this email address already exists. Please log in.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please provide a valid email address.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C2724]/60 backdrop-blur-xs animate-fadeIn">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] shadow-2xl p-6 sm:p-8 overflow-hidden z-10">
        {/* Decorative corner flourish */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#EEDFD5]/60 to-transparent pointer-events-none rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#EEDFD5]/60 to-transparent pointer-events-none rounded-bl-2xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8C827A] hover:text-[#2C2724] p-1.5 rounded-full hover:bg-[#F3EDE2] transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <span className="font-['Parisienne'] text-2xl text-[#8E5B59] block mb-1">
            Petalisse Boutique
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif text-[#2C2724] tracking-tight font-medium">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'signup' && 'Create Your Account'}
            {mode === 'forgot' && 'Reset Password'}
          </h2>
          <p className="text-xs text-[#786F66] mt-1">
            {mode === 'login' && 'Sign in to access your saved charms, orders & addresses'}
            {mode === 'signup' && 'Join Petalisse to save favorites and track orders'}
            {mode === 'forgot' && "Enter your email and we'll send you a recovery link"}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[#FAF0ED] border border-[#E8C5B8] text-[#9E3E2B] text-xs leading-relaxed flex items-start gap-2">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-[#F0F7F2] border border-[#C2DEC8] text-[#2C6B3F] text-xs leading-relaxed flex items-start gap-2">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-[#4A423B] mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Eleanor Vance"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] placeholder-[#A89E94] focus:outline-hidden focus:border-[#8E5B59] focus:ring-1 focus:ring-[#8E5B59] transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#4A423B] mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="eleanor@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] placeholder-[#A89E94] focus:outline-hidden focus:border-[#8E5B59] focus:ring-1 focus:ring-[#8E5B59] transition"
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-[#4A423B] mb-1">Phone Number (optional)</label>
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
                <label className="block text-xs font-medium text-[#4A423B]">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] text-[#8E5B59] hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] placeholder-[#A89E94] focus:outline-hidden focus:border-[#8E5B59] focus:ring-1 focus:ring-[#8E5B59] transition"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#8E5B59] text-white text-sm font-medium tracking-wide shadow-sm hover:bg-[#784A48] focus:outline-hidden focus:ring-2 focus:ring-[#8E5B59]/40 active:scale-[0.99] transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            <span>
              {mode === 'login' && 'Sign In'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'forgot' && 'Send Reset Link'}
            </span>
          </button>
        </form>

        {/* Mode Switchers */}
        <div className="mt-6 pt-4 border-t border-[#EAE3D8] text-center space-y-2">
          {mode === 'login' ? (
            <p className="text-xs text-[#786F66]">
              Don&apos;t have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="font-medium text-[#8E5B59] hover:underline cursor-pointer"
              >
                Sign up here
              </button>
            </p>
          ) : (
            <p className="text-xs text-[#786F66]">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="font-medium text-[#8E5B59] hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </p>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/admin');
              }}
              className="text-[11px] text-[#A89E94] hover:text-[#6D635B] underline transition cursor-pointer"
            >
              Administrator? Access Admin Portal &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
