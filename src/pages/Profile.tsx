import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Edit2, LogOut, Play, Upload, User, FileText, Star } from "lucide-react";
import Header from "../components/Header";
import MobileSidebar from "../components/MobileSidebar";
import Footer from "../components/Footer";
import ProfileEditModal from "../components/ProfileEditModal";
import { useTheme } from "../contexts/ThemeContext";
import { useAuthStore } from "../store/authstore";
import apiInstance from "../utils/axios";

// Backend-backed data helpers
import { fetchArtists, fetchPlaylists } from "../Data";
import LoadingSkeleton from "../components/LoadingSkeleton";

/* ---------------------------
   Helper types / small comps
   --------------------------- */

interface CarouselItem {
  name: string;
  image: string;
  subtitle?: string;
}

interface CarouselCardProps {
  item: CarouselItem;
  type: "artist" | "playlist";
  isDark: boolean;
  onClick: () => void;
}

const CarouselCard: React.FC<CarouselCardProps> = ({ item, type, isDark, onClick }) => {
  const isArtist = type === "artist";
  const isRounded = isArtist ? "rounded-full" : "rounded-lg";
  const cardBg = isDark ? "bg-gray-800" : "bg-gray-200";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";

  return (
    <div
      className="shrink-0 w-32 sm:w-36 transition-transform duration-300 hover:scale-105 cursor-pointer"
      onClick={onClick}
    >
      <div className={`${isRounded} overflow-hidden mb-3 shadow-lg ${cardBg}`}>
        <img src={item.image} alt={item.name} className="w-full h-32 sm:h-36 object-cover" />
      </div>
      <p className={`${textPrimary} font-semibold text-sm truncate px-1 text-center`}>{item.name}</p>
      {item.subtitle && (
        <p className={`${textSecondary} text-xs truncate px-1 text-center`}>{item.subtitle}</p>
      )}
    </div>
  );
};

interface HorizontalCarouselProps {
  title: string;
  items: CarouselItem[];
  type: "artist" | "playlist";
  isDark: boolean;
  onItemClick: (name: string) => void;
}

const HorizontalCarousel: React.FC<HorizontalCarouselProps> = ({ title, items, type, isDark, onItemClick }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const textPrimary = isDark ? "text-white" : "text-gray-900";

  const scroll = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (container) {
      const scrollAmount = 300;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleScroll = () => {
    const container = scrollRef.current;
    if (container) {
      setShowLeft(container.scrollLeft > 0);
      setShowRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
    }
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      handleScroll();
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  return (
    <div className="relative mb-6 animate-fadeIn">
      <h2 className={`text-2xl lg:text-3xl font-bold ${textPrimary} mb-6`}>{title}</h2>
      <div className="relative group">
        {showLeft && (
          <button
            onClick={() => scroll("left")}
            className={`hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 ${isDark ? "bg-black/80" : "bg-white/80"} hover:bg-red-600 ${textPrimary} rounded-full p-2 transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-lg`}
            aria-label="scroll left"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 lg:gap-6 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((item, idx) => (
            <div key={idx} className="snap-start">
              <CarouselCard item={item} type={type} isDark={isDark} onClick={() => onItemClick(item.name)} />
            </div>
          ))}
        </div>
        {showRight && (
          <button
            onClick={() => scroll("right")}
            className={`hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 ${isDark ? "bg-black/80" : "bg-white/80"} hover:bg-red-600 ${textPrimary} rounded-full p-2 transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-lg`}
            aria-label="scroll right"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </div>
  );
};

/* ---------------------------
   List item for left/right lists
   --------------------------- */

interface ListItemProps {
  item: CarouselItem;
  index: number;
  type: "artist" | "playlist";
  isDark: boolean;
  hoveredCard: string | null;
  setHoveredCard: (id: string | null) => void;
  onClick: () => void;
}

const ListItem: React.FC<ListItemProps> = ({ item, index, type, isDark, hoveredCard, setHoveredCard, onClick }) => {
  const isArtist = type === "artist";
  const isRounded = isArtist ? "rounded-full" : "rounded-md";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";
  const cardHoverBg = isDark ? "hover:bg-white/5" : "hover:bg-gray-100";
  const itemId = `${type}-${index}`;

  return (
    <div
      onMouseEnter={() => setHoveredCard(itemId)}
      onMouseLeave={() => setHoveredCard(null)}
      onClick={onClick}
      className={`flex items-center gap-4 p-3 rounded-lg ${cardHoverBg} transition-all duration-300 cursor-pointer group`}
    >
      <div className={`text-lg font-bold w-8 ${textSecondary} hidden lg:block`}>{index + 1}</div>
      <div className={`w-14 h-14 ${isRounded} overflow-hidden shrink-0 shadow-md`}>
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={`font-semibold truncate ${textPrimary}`}>{item.name}</h3>
        {item.subtitle && <p className={`text-sm truncate ${textSecondary}`}>{item.subtitle}</p>}
      </div>
      <button
        aria-label={`Open ${item.name}`}
        className={`bg-red-600 rounded-full p-2 transition-all duration-300 shrink-0 ${
          hoveredCard === itemId ? "opacity-100 scale-100" : "md:opacity-0 md:scale-75 opacity-100 scale-100"
        } hover:bg-red-700`}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <Play className="w-4 h-4 text-white" />
      </button>
    </div>
  );
};

/* ---------------------------
   Main Profile component
   --------------------------- */

export default function Profile() {
  const navigate = useNavigate();
  const { setTheme, isDark } = useTheme();
  const { user, logout, loadUser, updateUser } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Edit form state for large screens
  const [editFullName, setEditFullName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editImagePreview, setEditImagePreview] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data loaded from backend
  const [favoriteArtists, setFavoriteArtists] = useState<CarouselItem[]>([]);
  const [playlists, setPlaylists] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setIsDark = (v: boolean) => setTheme(v ? "dark" : "light");

  // Fallback image
  const fallbackImage = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop";

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Initialize edit form when user data changes or entering edit mode
  useEffect(() => {
    if (user) {
      setEditFullName(user.full_name || "");
      setEditBio(user.bio || "");
      setEditImagePreview(user.image || fallbackImage);
    } else {
      setEditImagePreview(fallbackImage);
    }
  }, [user]);

  // Fetch data: artists & playlists
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [artistsResp, playlistsResp] = await Promise.all([fetchArtists(), fetchPlaylists()]);

        if (cancelled) return;

        const favs = (artistsResp || [])
          .filter((a: any) => !!a.isFavorite)
          .map((a: any) => ({
            name: a.name,
            image: a.image,
            subtitle: a.followers ? `${a.followers} followers` : undefined,
          }));

        setFavoriteArtists(favs);

        const profilePls = (playlistsResp || [])
          .filter((p: any) => p.isProfile)
          .map((p: any) => ({
            name: p.name,
            image: p.image,
            subtitle: p.songCount ? `${p.songCount} songs` : undefined,
          }));
        setPlaylists(profilePls);
      } catch (err) {
        console.error("Error loading profile data:", err);
        setError("Failed to load profile data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpdateProfile = async (data: { full_name: string; bio: string; image: File | null }) => {
    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append("full_name", data.full_name);
      formData.append("bio", data.bio);
      if (data.image) {
        formData.append("image", data.image);
      }

      const response = await apiInstance.patch("auth/profile/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.user) {
        updateUser(response.data.user);
        setIsEditMode(false);
        setIsModalOpen(false);
        setEditImageFile(null);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUpdateProfile({
      full_name: editFullName,
      bio: editBio,
      image: editImageFile,
    });
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditFullName(user?.full_name || "");
    setEditBio(user?.bio || "");
    setEditImagePreview(user?.image || fallbackImage);
    setEditImageFile(null);
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    logout();
    navigate("/login");
  };

  const bgColor = isDark ? "bg-black" : "bg-gray-50";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-300" : "text-gray-600";
  const listContainerBg = isDark ? "bg-white/5" : "bg-white";
  const listContainerBorder = isDark ? "border-white/5" : "border-gray-200";
  const inputBg = isDark ? "bg-gray-800" : "bg-gray-100";
  const inputBorder = isDark ? "border-gray-700" : "border-gray-300";

  const displayName = user?.full_name || "Guest User";
  const displayEmail = user?.email || "guest@example.com";
  const displayBio = user?.bio || "Music enthusiast 🎵 | Always discovering new sounds | Living life one beat at a time";
  const displayImage = user?.image || fallbackImage;

  const navigateToArtist = (name: string) => {
    navigate(`/artist/${encodeURIComponent(name)}`);
  };

  const navigateToPlaylist = (name: string) => {
    navigate(`/playlist/${encodeURIComponent(name)}`);
  };

  if (loading) {
    return <LoadingSkeleton isDark={isDark} />;
  }

  if (error) {
    return (
      <div className={`min-h-screen ${bgColor} ${textPrimary} flex items-center justify-center`}>
        <div className="text-center">
          <p className="mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 rounded-full bg-red-600 text-white">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgColor} ${textPrimary} transition-colors duration-300`}>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <MobileSidebar isDark={isDark} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <Header isDark={isDark} setIsDark={setIsDark} setSidebarOpen={setSidebarOpen} />

      {/* Mobile/Tablet View */}
      <main className="lg:hidden max-w-7xl mx-auto px-6 pb-20 py-6 space-y-2">
        <section className="space-y-6 relative">
          <button
            onClick={handleLogout}
            className="absolute -top-3 -right-3 md:top-0 md:right-0 z-10 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border border-red-500/30"
            aria-label="Logout"
          >
            <LogOut size={18} className="pointer-events-none" />
          </button>

          <div className="flex justify-center animate-fadeIn">
            <div className="relative">
              <img src={displayImage} alt="Profile Picture" className="w-40 h-40 rounded-full object-cover border-4 border-red-600 shadow-2xl transition-transform duration-300 hover:scale-105" />
              <button
                onClick={() => setIsModalOpen(true)}
                className={`absolute bottom-2 right-2 ${isDark ? "bg-gray-800" : "bg-white"} rounded-full p-3 shadow-lg border-2 border-red-600 hover:bg-red-600 ${textPrimary} hover:text-white transition-all duration-300 hover:scale-110`}
                aria-label="Edit profile"
              >
                <Edit2 size={14} />
              </button>
            </div>
          </div>

          <h1 className={`text-2xl font-bold ${textPrimary} text-center relative bottom-4 animate-fadeIn`}>{displayName}</h1>
          {user && <p className={`text-sm ${textSecondary} relative bottom-7 text-center max-w-2xl mx-auto animate-fadeIn`}>{displayEmail}</p>}
          <p className={`text-xs ${textSecondary} relative bottom-10 text-center max-w-2xl mx-auto animate-fadeIn`}>{displayBio}</p>
        </section>

        <HorizontalCarousel title="Favorite Artists" items={favoriteArtists} type="artist" isDark={isDark} onItemClick={navigateToArtist} />
        {favoriteArtists.length === 0 && (
          <div className={`${listContainerBg} relative bottom-8 rounded-xl p-6 md:p-12 mt-2 md:mt-0 border ${listContainerBorder} shadow-lg text-center ${textSecondary} text-sm animate-fadeIn`}>
            <Star className={`w-16 h-16 ${textSecondary} mx-auto mb-4`} />
            <p className={`${textSecondary} text-lg`}>No favorite artists yet</p>
            <p className={`${textSecondary} text-sm mt-2`}>Start exploring and mark artists as favorites!</p>
          </div>
        )}
        
        <HorizontalCarousel title="Playlists" items={playlists} type="playlist" isDark={isDark} onItemClick={navigateToPlaylist} />
        {playlists.length === 0 && (
          <div className={`text-center py-8 ${textSecondary} text-sm animate-fadeIn`}>
            <p>You have no playlists yet.</p>
            <p className="text-xs mt-2">Create your first playlist to get started!</p>
          </div>
        )}
      </main>

      {/* Large Screen View - Three columns */}
      <main className="hidden lg:block max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-3 gap-8 h-[calc(100vh-200px)]">
          {/* Left Column - Favorite Artists */}
          <div className={`${isDark ? "bg-gray-900/50" : "bg-white/50"} rounded-2xl p-6 overflow-hidden shadow-xl flex flex-col`}>
            <h2 className={`text-2xl font-bold ${textPrimary} mb-6 text-center`}>Favorite Artists</h2>
            <div className={`${listContainerBg} rounded-xl p-4 border ${listContainerBorder} flex-1 overflow-y-auto scrollbar-hide`}>
              <div className="space-y-2">
                {favoriteArtists.length === 0 ? (
                  <div className={`${listContainerBg} rounded-xl p-8 border ${listContainerBorder} shadow-lg text-center`}>
                    <Star className={`w-12 h-12 mx-auto mb-4 ${textSecondary}`} />
                    <p className={`${textSecondary} text-lg`}>No favorite artists yet</p>
                    <p className={`${textSecondary} text-sm mt-2`}>Start exploring and mark artists as favorites!</p>
                  </div>
                ) : (
                  favoriteArtists.map((artist, idx) => (
                    <ListItem
                      key={idx}
                      item={artist}
                      index={idx}
                      type="artist"
                      isDark={isDark}
                      hoveredCard={hoveredCard}
                      setHoveredCard={setHoveredCard}
                      onClick={() => navigateToArtist(artist.name)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Middle Column - Profile or Edit Form */}
          <div className={`${isDark ? "bg-gray-900/50" : "bg-white/50"} rounded-2xl p-6 flex flex-col shadow-xl relative overflow-hidden`}>
            {!isEditMode ? (
              // View Mode
              <>
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="flex flex-col items-center space-y-6 animate-fadeIn">
                    <div className="relative">
                      <img src={displayImage} alt="Profile Picture" className="w-42 h-42 rounded-full object-cover border-4 border-red-600 shadow-2xl transition-transform duration-300 hover:scale-105" />
                      <button 
                        onClick={() => setIsEditMode(true)}
                        className={`absolute bottom-2 right-2 ${isDark ? "bg-gray-800" : "bg-white"} rounded-full p-3 shadow-lg border-2 border-red-600 hover:bg-red-600 ${textPrimary} hover:text-white transition-all duration-300 hover:scale-110`} 
                        aria-label="Edit profile"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>

                    <h1 className={`text-4xl font-bold ${textPrimary} text-center`}>{displayName}</h1>
                    {user && <p className={`text-base ${textSecondary} text-center`}>{displayEmail}</p>}
                    <p className={`text-sm ${textSecondary} text-center max-w-md`}>{displayBio}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <button onClick={handleLogout} className={`w-xs flex relative left-6 justify-center gap-2 px-4 py-3 rounded-xl bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border border-red-500/30`}>
                    <LogOut size={18} className="pointer-events-none" />
                    <span className="font-semibold tracking-wide">Logout</span>
                  </button>
                </div>
              </>
            ) : (
              // Edit Mode - Compact layout without scrolling
              <div className="flex flex-col h-full py-2">
                <h2 className={`text-xl font-bold ${textPrimary} mb-3 text-center`}>Edit Profile</h2>
                
                <form onSubmit={handleEditSubmit} className="flex-1 flex flex-col justify-between min-h-0">
                  <div className="space-y-3 shrink-0">
                    {/* Profile Image */}
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <img
                          src={editImagePreview}
                          alt="Profile preview"
                          className="w-24 h-24 rounded-full object-cover border-4 border-red-600 shadow-lg"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute bottom-0 right-0 bg-red-600 hover:bg-red-700 rounded-full p-2 shadow-lg transition-all duration-300 hover:scale-110"
                          aria-label="Upload image"
                        >
                          <Upload size={12} className="text-white" />
                        </button>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleEditImageChange}
                        className="hidden"
                      />
                      <p className={`text-xs ${textSecondary} mt-1.5`}>Click to upload photo</p>
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className={`block text-xs font-semibold ${textPrimary} mb-1.5`}>
                        <User size={13} className="inline mr-1.5" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg ${inputBg} border ${inputBorder} ${textPrimary} focus:outline-none focus:ring-2 focus:ring-red-600 transition-all text-sm`}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    {/* Bio - Further reduced height */}
                    <div>
                      <label className={`block text-xs font-semibold ${textPrimary} mb-1.5`}>
                        <FileText size={13} className="inline mr-1.5" />
                        Bio
                      </label>
                      <textarea
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        rows={2}
                        className={`w-full px-3 py-2 rounded-lg ${inputBg} border ${inputBorder} ${textPrimary} focus:outline-none focus:ring-2 focus:ring-red-600 transition-all resize-none text-sm`}
                        placeholder="Tell us about yourself..."
                        required
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-3 shrink-0">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isUpdating}
                      className={`flex-1 px-4 py-2.5 rounded-lg ${isDark ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-200 hover:bg-gray-300"} ${textPrimary} font-semibold transition-all text-sm ${
                        isUpdating ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className={`flex-1 px-4 py-2.5 rounded-lg bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold transition-all shadow-lg hover:shadow-xl text-sm ${
                        isUpdating ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {isUpdating ? "Updating..." : "Update"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Right Column - Playlists */}
          <div className={`${isDark ? "bg-gray-900/50" : "bg-white/50"} rounded-2xl p-6 overflow-hidden shadow-xl flex flex-col`}>
            <h2 className={`text-2xl font-bold ${textPrimary} mb-6 text-center`}>Playlists</h2>
            <div className={`${listContainerBg} rounded-xl p-4 border ${listContainerBorder} flex-1 overflow-y-auto scrollbar-hide`}>
              <div className="space-y-2">
                {playlists.map((playlist, idx) => (
                  <ListItem key={idx} item={playlist} index={idx} type="playlist" isDark={isDark} hoveredCard={hoveredCard} setHoveredCard={setHoveredCard} onClick={() => navigateToPlaylist(playlist.name)} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Profile Edit Modal for Mobile */}
      <ProfileEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isDark={isDark}
        currentName={displayName}
        currentBio={displayBio}
        currentImage={displayImage}
        onUpdate={handleUpdateProfile}
        isUpdating={isUpdating}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}