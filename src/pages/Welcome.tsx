import React, { useState, useEffect } from 'react';
import { Volume2, Disc3, Headphones, Music, Radio, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Note {
  id: number;
  x: number;
  delay: number;
  size: number;
}

interface Vinyl {
  rotation: number;
}

export default function WavifyWelcome() {
  const [bars, setBars] = useState<number[]>(Array(24).fill(0).map(() => Math.random()));
  const [notes, setNotes] = useState<Note[]>([]);
  const [vinyl, setVinyl] = useState<Vinyl>({ rotation: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setBars(Array(24).fill(0).map(() => Math.random() * 0.8 + 0.2));
    }, 150);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const noteInterval = setInterval(() => {
      const newNote: Note = {
        id: Date.now() + Math.random(),
        x: Math.random() * 100,
        delay: Math.random() * 2,
        size: Math.random() * 0.5 + 0.8
      };
      setNotes(prev => [...prev.slice(-8), newNote]);
    }, 800);
    return () => clearInterval(noteInterval);
  }, []);

  useEffect(() => {
    const vinylInterval = setInterval(() => {
      setVinyl(prev => ({ rotation: (prev.rotation + 1) % 360 }));
    }, 50);
    return () => clearInterval(vinylInterval);
  }, []);

  return (
    <div className="w-full bg-linear-to-br from-white via-red-50 to-red-100 text-gray-900">
      {/* Subtle grain texture overlay */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none" 
           style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' /%3E%3C/svg%3E")'}} />
      
      {/* Floating music notes */}
      {notes.map(note => (
        <div
          key={note.id}
          className="fixed text-red-600 opacity-20 pointer-events-none will-change-transform"
          style={{
            left: `${note.x}%`,
            bottom: '-20px',
            fontSize: `${note.size}rem`,
            animation: `float 8s linear forwards`,
            animationDelay: `${note.delay}s`
          }}
        >
          ♪
        </div>
      ))}

      {/* Glowing orbs background - Ferrari Red */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-red-600 rounded-full blur-[150px] opacity-10 animate-pulse pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-red-500 rounded-full blur-[150px] opacity-10 animate-pulse pointer-events-none" style={{animationDelay: '1s'}} />

      <div className="relative">
        {/* Hero Section - Two Column Layout on Large Screens */}
        <section className="min-h-screen flex items-center justify-center px-6 py-12">
          <div className="max-w-7xl w-full lg:grid lg:grid-cols-2 lg:gap-12 xl:gap-16 lg:items-center flex flex-col items-center">
            
            {/* Left Column - Brand & CTA */}
            <div className="flex flex-col justify-center text-center lg:text-left mb-12 lg:mb-0">
              {/* Logo and Title - Hidden on large screens */}
              <div className="mb-8 animate-fadeIn lg:hidden">
                <div className="inline-block relative mb-6">
                  <div className="absolute inset-0 bg-red-600 blur-2xl opacity-30 animate-pulse" />
                  <div className="relative w-20 h-20 sm:w-28 sm:h-28 bg-linear-to-br from-red-600 via-red-700 to-red-900 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-600/30 rotate-3 hover:rotate-0 transition-transform duration-500">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-12 bg-white rounded-full animate-pulse" style={{animationDelay: '0s'}} />
                      <div className="w-2 h-16 bg-white rounded-full animate-pulse" style={{animationDelay: '0.1s'}} />
                      <div className="w-2 h-10 bg-white rounded-full animate-pulse" style={{animationDelay: '0.2s'}} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Title Section */}
              <div className="animate-fadeIn">
                <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black mb-4 tracking-tight">
                  <span className="bg-linear-to-r from-red-600 via-red-700 to-red-800 bg-clip-text text-transparent animate-gradient">
                    Wavify
                  </span>
                </h1>
                <p className="text-xl sm:text-2xl text-gray-700 font-light tracking-wide mb-8">
                  Feel the music. <span className="text-red-600 font-medium">Live the moment.</span>
                </p>
                <p className="text-base text-gray-600 max-w-md mx-auto lg:mx-0 mb-8">
                  Join millions of music lovers streaming 100M+ songs in crystal-clear HD quality. Your perfect soundtrack awaits.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto lg:mx-0">
                 <button
      onClick={() => navigate("/signup")}
      className="flex-1 px-8 py-4 bg-linear-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-500 hover:to-red-600 transition-all duration-300 shadow-lg shadow-red-600/30 hover:shadow-red-600/50 hover:scale-105 active:scale-95"
    >
      Start Free Trial
    </button>
                <button className="flex-1 px-8 py-4 bg-white border-2 border-red-600 text-red-600 rounded-xl font-semibold hover:bg-red-600 hover:text-white transition-all duration-300 shadow-lg hover:shadow-red-600/30 hover:scale-105 active:scale-95">
                  Learn More
                </button>
              </div>

              {/* Mini Features */}
              <div className="mt-12 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0">
                {[
                  { icon: <Music className="w-5 h-5" />, text: '100M+ Songs' },
                  { icon: <Radio className="w-5 h-5" />, text: 'HD Quality' },
                  { icon: <Zap className="w-5 h-5" />, text: 'Ad-Free' }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 text-center">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
                      {item.icon}
                    </div>
                    <span className="text-xs text-gray-600 font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Animated Equalizer */}
            <div className="w-full flex items-center justify-center">
              <div className="w-full max-w-lg">
                <div className="relative bg-white/70 backdrop-blur-sm rounded-3xl p-8 lg:p-10 border border-red-200 shadow-2xl shadow-red-600/10">
                  {/* Rotating Vinyl */}
                  <div className="absolute -top-10 -right-10 hidden xl:block">
                    <div 
                      className="w-28 h-28 rounded-full bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 border-4 border-red-600 shadow-lg shadow-red-600/40 will-change-transform"
                      style={{transform: `rotate(${vinyl.rotation}deg)`}}
                    >
                      <div className="w-full h-full rounded-full border-8 border-gray-700 flex items-center justify-center">
                        <div className="w-7 h-7 rounded-full bg-red-600" />
                      </div>
                    </div>
                  </div>

                  {/* Equalizer Bars - Ferrari Red */}
                  <div className="flex items-end justify-center gap-2 h-48 lg:h-56">
                    {bars.map((height, i) => (
                      <div
                        key={i}
                        className="w-3 rounded-t-full transition-all duration-150 ease-out will-change-transform"
                        style={{
                          height: `${height * 100}%`,
                          background: `linear-gradient(to top, #DC0000, ${height > 0.6 ? '#FF2800' : '#DC0000'})`,
                          boxShadow: height > 0.6 ? '0 0 20px rgba(220, 0, 0, 0.6)' : 'none'
                        }}
                      />
                    ))}
                  </div>

                  {/* Audio Wave */}
                  <div className="mt-8 h-1.5 bg-linear-to-r from-transparent via-red-600 to-transparent rounded-full animate-pulse" />
                  
                  {/* Headphones Icon */}
                  <div className="mt-6 flex justify-center">
                    <Headphones className="w-8 h-8 text-red-600 animate-bounce" style={{animationDuration: '2s'}} />
                  </div>

                  {/* Now Playing Badge */}
                  <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                    <span className="font-medium">Live Preview</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Scroll indicator - Only on mobile/tablet */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce lg:hidden">
            <div className="w-6 h-10 border-2 border-red-600 rounded-full flex justify-center pt-2">
              <div className="w-1 h-2 bg-red-600 rounded-full animate-pulse" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="min-h-screen flex items-center justify-center px-6 py-16">
          <div className="max-w-6xl w-full">
            <h2 className="text-4xl sm:text-5xl font-bold text-center mb-12 bg-linear-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
              Why Choose Wavify?
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8">
              {[
                { icon: <Volume2 />, title: '100M+ Songs', desc: 'Stream unlimited music from every genre imaginable' },
                { icon: <Disc3 />, title: 'HD Quality', desc: 'Crystal clear audio quality for the best listening experience' },
                { icon: <Headphones />, title: 'Offline Mode', desc: 'Download and listen anywhere, anytime without internet' }
              ].map((feature, i) => (
                <div 
                  key={i} 
                  className="bg-white/80 backdrop-blur-sm border border-red-200 rounded-2xl p-8 hover:border-red-400 hover:shadow-xl hover:shadow-red-600/10 transition-all duration-300 hover:scale-105 group"
                >
                  <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-red-200 transition-colors">
                    {React.cloneElement(feature.icon, { className: 'w-8 h-8 text-red-600' })}
                  </div>
                  <h3 className="font-bold text-xl mb-3 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Additional features */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-linear-to-br from-red-50 to-white backdrop-blur-sm border border-red-200 rounded-2xl p-8 hover:shadow-xl hover:shadow-red-600/10 transition-all duration-300">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Personalized Playlists</h3>
                <p className="text-gray-600">AI-powered recommendations that understand your taste and discover new favorites</p>
              </div>
              <div className="bg-linear-to-br from-red-50 to-white backdrop-blur-sm border border-red-200 rounded-2xl p-8 hover:shadow-xl hover:shadow-red-600/10 transition-all duration-300">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Share with Friends</h3>
                <p className="text-gray-600">Create collaborative playlists and share your music journey with the world</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="p-8 text-center text-sm text-gray-500 border-t border-red-200 bg-white/50">
          <div className="flex flex-wrap justify-center gap-6 mb-4">
            <a href="#" className="hover:text-red-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-red-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-red-600 transition-colors">Support</a>
            <a href="#" className="hover:text-red-600 transition-colors">Contact</a>
          </div>
          <p>© 2024 Wavify. All rights reserved.</p>
        </footer>
      </div>

      <style>{`
        @keyframes float {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.2; }
          90% { opacity: 0.2; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 1s ease-out;
        }
        
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }
        
        .will-change-transform {
          will-change: transform;
        }
      `}</style>
    </div>
  );
}