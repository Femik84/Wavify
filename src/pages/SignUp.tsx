import { useState } from 'react';
import { Music, Headphones, Mail, Lock, User, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/authstore';

export default function WavifySignup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);

  const { register, loading, error } = useAuthStore();

  const handleSubmit = async () => {
    // Reset success state
    setSuccess(false);

    // Validation
    if (!name.trim() || !email.trim() || !password.trim()) {
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return;
    }

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
      
      // Navigate to signin after 1.5 seconds
      setTimeout(() => {
        window.location.href = '/signin';
      }, 1500);
    }
  };

  const handleSignInClick = () => {
    window.location.href = '/signin';
  };

  return (
    <div className="min-h-screen lg:h-screen w-full bg-gray-950 text-white overflow-y-auto lg:overflow-hidden relative">
      {/* Dark Background with Music Theme */}
      <div className="absolute inset-0">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-gray-950 to-black z-10" />
        
        {/* Abstract Music Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="music-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="25" cy="25" r="2" fill="#ef4444" opacity="0.3" />
                <circle cx="75" cy="75" r="2" fill="#ef4444" opacity="0.3" />
                <path d="M 20 40 Q 40 20 60 40 T 100 40" stroke="#ef4444" strokeWidth="0.5" fill="none" opacity="0.2" />
                <path d="M 30 70 Q 50 50 70 70 T 110 70" stroke="#ef4444" strokeWidth="0.5" fill="none" opacity="0.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#music-pattern)" />
          </svg>
        </div>

        {/* Glowing Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Animated Soundwave Background */}
        <div className="absolute bottom-0 left-0 right-0 h-32 opacity-10 flex items-end justify-center">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-linear-to-t from-red-600 to-transparent mx-1 animate-pulse"
              style={{
                height: `${Math.random() * 80 + 20}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${1 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Container */}
      <div className="relative min-h-screen lg:h-full w-full flex items-center justify-center px-4 py-8 lg:py-0 lg:px-8 z-20">
        <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Left Panel - Brand & Features */}
          <div className="relative order-2 lg:order-1">
            <div className="relative p-6 lg:p-8">
              {/* Glowing Accent */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 lg:w-80 lg:h-80 bg-red-600/20 rounded-full blur-3xl animate-pulse" />
              
              {/* Content */}
              <div className="relative z-10 space-y-6">
                {/* Logo Area */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-14 h-14 lg:w-16 lg:h-16 bg-linear-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-600/50">
                      <Music className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
                    </div>
                    <div className="absolute -inset-1 bg-linear-to-br from-red-600 to-red-700 rounded-2xl blur opacity-50 animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-5xl font-black bg-linear-to-r from-white via-red-400 to-red-600 bg-clip-text text-transparent">
                      Wavify
                    </h1>
                    <p className="text-red-500 text-xs lg:text-sm font-semibold tracking-wider">PREMIUM AUDIO</p>
                  </div>
                </div>

                {/* Headline */}
                <div className="space-y-3">
                  <h2 className="text-2xl lg:text-4xl font-black leading-tight text-white">
                    Start Your Journey
                    <br />
                    <span className="bg-linear-to-r from-red-500 via-red-600 to-red-700 bg-clip-text text-transparent">
                      To Premium Sound
                    </span>
                  </h2>
                  <p className="text-gray-400 text-sm lg:text-base max-w-md">
                    Join millions experiencing the future of music streaming with hi-res audio quality.
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  {[
                    { icon: Headphones, text: 'Hi-Res Lossless Audio' },
                    { icon: Music, text: '100M+ Premium Tracks' },
                    { icon: ChevronRight, text: 'Spatial Audio & Dolby Atmos' },
                  ].map((feature, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 group cursor-pointer"
                    >
                      <div className="w-10 h-10 bg-linear-to-br from-red-950/50 to-red-900/30 backdrop-blur-sm rounded-xl flex items-center justify-center border border-red-800/30 group-hover:border-red-600/50 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-red-600/30">
                        <feature.icon className="w-4 h-4 text-red-500 group-hover:text-red-400 transition-colors" />
                      </div>
                      <span className="text-gray-300 group-hover:text-white transition-colors font-medium text-sm lg:text-base">
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Decorative Lines */}
                <div className="space-y-2 pt-4">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-1 bg-linear-to-r from-red-600 via-red-500 to-transparent rounded-full"
                      style={{ width: `${100 - i * 15}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Waveform Decoration */}
              <div className="absolute bottom-0 right-0 opacity-20 pointer-events-none">
                <svg width="250" height="120" viewBox="0 0 250 120">
                  {[...Array(40)].map((_, i) => (
                    <rect
                      key={i}
                      x={i * 6}
                      y={60 - Math.random() * 50}
                      width="3"
                      height={Math.random() * 50 + 25}
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
            <div className="relative bg-gray-900/80 backdrop-blur-2xl rounded-3xl p-6 lg:p-10 lg:py-4 border border-gray-800 shadow-2xl shadow-black/50">
              {/* Glow Effect */}
              <div className="absolute -inset-0.5 bg-linear-to-br from-red-600/20 via-transparent to-red-700/20 rounded-3xl blur opacity-60" />
              
              <div className="relative space-y-6">
                {/* Form Header */}
                <div className="text-center space-y-1">
                  <h3 className="text-xl lg:text-2xl font-bold text-white">Create Account</h3>
                  <p className="text-gray-400 text-sm">Start your premium journey today</p>
                </div>

                {/* Success Message */}
                {success && (
                  <div className="bg-green-950/50 border border-green-800/50 text-green-400 px-4 py-2.5 rounded-xl text-sm">
                    Account created successfully! Redirecting to sign in...
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-950/50 border border-red-800/50 text-red-400 px-4 py-2.5 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                {/* Form Fields */}
                <div className="space-y-4">
                  {/* Name Input */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                      <User className="w-4 h-4 text-red-500" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      disabled={loading}
                      className="w-full bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-red-500" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      disabled={loading}
                      className="w-full bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-red-500" />
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                      className="w-full bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500">Minimum 6 characters</p>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="flex items-start gap-2 text-sm pt-2">
                    <input
                      type="checkbox"
                      disabled={loading}
                      className="w-4 h-4 rounded border-gray-700 bg-gray-950/50 text-red-600 focus:ring-red-600 focus:ring-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-0.5"
                    />
                    <label className="text-gray-400 cursor-pointer">
                      I agree to the{" "}
                      <span className="text-red-500 hover:text-red-400 transition-colors">Terms & Conditions</span>
                      {" "}and{" "}
                      <span className="text-red-500 hover:text-red-400 transition-colors">Privacy Policy</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={loading || success}
                    className="w-full bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-red-600/40 hover:shadow-red-600/60 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group mt-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
                <p className="text-center text-sm text-gray-400">
                  Already have an account?{" "}
                  <button
                    onClick={handleSignInClick}
                    className="text-red-500 hover:text-red-400 font-semibold transition-colors"
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
    </div>
  );
}