import { useState } from 'react';
import { Music, Headphones, Mail, Lock, User, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/authstore';
import { Navigate } from "react-router-dom";

export default function WavifySignup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { register, loading, error } = useAuthStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  
    if (isAuthenticated) {
      return <Navigate to="/" replace />;
    }

  const handleSubmit = async () => {
    // Reset states
    setSuccess(false);

    // Validation
    if (!name.trim() || !email.trim() || !password.trim()) {
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return;
    }

    // Password validation
    if (password.length < 6) {
      return;
    }

    // Call register function from authStore
    const result = await register({
      full_name: name.trim(),
      email: email.trim(),
      password: password,
    });

    if (result) {
      setSuccess(true);
      
      // Clear form
      setName('');
      setEmail('');
      setPassword('');

      // Redirect to home after 2 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden relative">
      {/* Clean Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-red-50" />

      {/* Main Container */}
      <div className="relative min-h-screen flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Left Panel - Ferrari Inspired Graphic */}
          <div className="relative order-2 lg:order-1">
            <div className="relative p-8 lg:p-12">
              {/* Glowing Orb */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 lg:w-96 lg:h-96 bg-red-500 rounded-full blur-3xl opacity-10 animate-pulse" />
              
              {/* Content */}
              <div className="relative z-10 space-y-8">
                {/* Logo Area */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-600/30">
                      <Music className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
                    </div>
                    <div className="absolute -inset-1 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl blur opacity-40 animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-4xl lg:text-6xl font-black bg-gradient-to-r from-gray-900 via-red-600 to-red-700 bg-clip-text text-transparent">
                      Wavify
                    </h1>
                    <p className="text-red-600 text-sm lg:text-base font-semibold tracking-wider">PREMIUM AUDIO</p>
                  </div>
                </div>

                {/* Headline */}
                <div className="space-y-4">
                  <h2 className="text-3xl lg:text-5xl font-black leading-tight text-gray-900">
                    Experience Music
                    <br />
                    <span className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 bg-clip-text text-transparent">
                      Beyond Limits
                    </span>
                  </h2>
                  <p className="text-gray-600 text-base lg:text-lg max-w-md">
                    Premium sound quality meets Ferrari-inspired design. Join millions experiencing the future of music streaming.
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-4">
                  {[
                    { icon: Headphones, text: 'Hi-Res Lossless Audio' },
                    { icon: Music, text: '100M+ Premium Tracks' },
                    { icon: ChevronRight, text: 'Spatial Audio & Dolby Atmos' },
                  ].map((feature, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 group cursor-pointer"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-red-50 to-red-100 backdrop-blur-sm rounded-xl flex items-center justify-center border border-red-200 group-hover:border-red-400 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-red-600/20">
                        <feature.icon className="w-5 h-5 text-red-600 group-hover:text-red-700 transition-colors" />
                      </div>
                      <span className="text-gray-700 group-hover:text-gray-900 transition-colors font-medium">
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Decorative Lines */}
                <div className="space-y-2 pt-8">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-1 bg-gradient-to-r from-red-600 via-red-500 to-transparent rounded-full"
                      style={{ width: `${100 - i * 15}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Waveform Decoration */}
              <div className="absolute bottom-0 right-0 opacity-10 pointer-events-none">
                <svg width="300" height="150" viewBox="0 0 300 150">
                  {[...Array(50)].map((_, i) => (
                    <rect
                      key={i}
                      x={i * 6}
                      y={75 - Math.random() * 60}
                      width="3"
                      height={Math.random() * 60 + 30}
                      fill="currentColor"
                      className="text-red-600"
                      opacity={0.3 + Math.random() * 0.4}
                    />
                  ))}
                </svg>
              </div>
            </div>
          </div>

          {/* Right Panel - Signup Form */}
          <div className="relative order-1 lg:order-2">
            <div className="relative bg-white/80 backdrop-blur-2xl rounded-3xl p-8 lg:p-12 border border-gray-200 shadow-2xl shadow-gray-900/10">
              {/* Glow Effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-br from-red-200/40 via-transparent to-red-300/40 rounded-3xl blur opacity-60" />
              
              <div className="relative space-y-8">
                {/* Form Header */}
                <div className="text-center space-y-2">
                  <h3 className="text-2xl lg:text-3xl font-bold text-gray-900">Create Account</h3>
                  <p className="text-gray-600">Start your premium journey today</p>
                </div>

                {/* Success Message */}
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                    Account created successfully! Redirecting to home...
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                {/* Form Fields */}
                <div className="space-y-6">
                  {/* Name Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-red-600" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      disabled={loading}
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Email Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-red-600" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      disabled={loading}
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-red-600" />
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={loading || success}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-red-600/30 hover:shadow-red-600/50 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group mt-8 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating Account...
                      </>
                    ) : success ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Account Created!
                      </>
                    ) : (
                      <>
                        Start Free Trial
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-gray-600">
                  Already have an account?{" "}
                  <button
                    onClick={() => {
                      // In your actual app: navigate("/signin")
                      alert('Navigate to sign in page');
                    }}
                    className="text-red-600 hover:text-red-700 font-semibold transition-colors"
                    disabled={loading}
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(50%);
          }
        }
      `}</style>
    </div>
  );
}