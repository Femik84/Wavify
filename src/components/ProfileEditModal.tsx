import React, { useState, useRef, useEffect } from "react";
import { X, Upload, User, FileText } from "lucide-react";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  currentName: string;
  currentBio: string;
  currentImage: string;
  onUpdate: (data: { full_name: string; bio: string; image: File | null }) => void;
  isUpdating: boolean;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  isDark,
  currentName,
  currentBio,
  currentImage,
  onUpdate,
  isUpdating,
}) => {
  const [fullName, setFullName] = useState(currentName);
  const [bio, setBio] = useState(currentBio);
  const [imagePreview, setImagePreview] = useState(currentImage);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFullName(currentName);
      setBio(currentBio);
      setImagePreview(currentImage);
      setImageFile(null);
    }
  }, [isOpen, currentName, currentBio, currentImage]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      full_name: fullName,
      bio: bio,
      image: imageFile,
    });
  };

  if (!isOpen) return null;

  const bgColor = isDark ? "bg-gray-900" : "bg-white";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";
  const inputBg = isDark ? "bg-gray-800/50" : "bg-gray-50";
  const inputBorder = isDark ? "border-gray-700/50" : "border-gray-200";
  const borderColor = isDark ? "border-gray-800" : "border-gray-100";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 transition-all duration-300 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-50 lg:inset-0 lg:flex lg:items-center lg:justify-center animate-slideUp lg:animate-scaleIn">
        <div
          className={`${bgColor} rounded-t-3xl lg:rounded-3xl shadow-2xl w-full lg:w-[480px] h-[70vh] lg:h-auto lg:max-h-[60vh] overflow-hidden flex flex-col border ${borderColor}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b ${borderColor}">
            <h2 className={`text-xl font-bold ${textPrimary}`}>Edit Profile</h2>
            <button
              onClick={onClose}
              className={`${isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"} rounded-full p-2 transition-all duration-200 hover:rotate-90`}
              aria-label="Close modal"
            >
              <X size={20} className={textPrimary} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5 scrollbar-thin">
            {/* Profile Image */}
            <div className="flex flex-col items-center space-y-3">
              <div className="relative group">
                <img
                  src={imagePreview}
                  alt="Profile preview"
                  className="w-28 h-28 rounded-full object-cover border-4 border-red-600 shadow-xl transition-transform duration-300 group-hover:scale-105"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-full p-2.5 shadow-lg transition-all duration-300 hover:scale-110 border-2 border-white dark:border-gray-900"
                  aria-label="Upload image"
                >
                  <Upload size={14} className="text-white" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <p className={`text-xs ${textSecondary} font-medium`}>Click to change photo</p>
            </div>

            {/* Full Name */}
            <div>
              <label className={`flex items-center text-sm font-semibold ${textPrimary} mb-2`}>
                <User size={15} className="mr-2 text-red-600" />
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl ${inputBg} border ${inputBorder} ${textPrimary} placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all`}
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Bio */}
            <div>
              <label className={`flex items-center text-sm font-semibold ${textPrimary} mb-2`}>
                <FileText size={15} className="mr-2 text-red-600" />
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={150}
                className={`w-full px-4 py-2.5 rounded-xl ${inputBg} border ${inputBorder} ${textPrimary} placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all resize-none`}
                placeholder="Tell us about yourself..."
                required
              />
              <p className={`text-xs ${textSecondary} mt-1.5 text-right font-medium`}>{bio.length}/150</p>
            </div>
          </form>

          {/* Footer */}
          <div className={`px-6 py-4 border-t ${borderColor} flex gap-3`}>
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdating}
              className={`flex-1 px-5 py-2.5 rounded-xl ${isDark ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-100 hover:bg-gray-200"} ${textPrimary} font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${
                isUpdating ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isUpdating}
              className={`flex-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] ${
                isUpdating ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isUpdating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Updating...
                </span>
              ) : (
                "Update"
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(239, 68, 68, 0.5);
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(239, 68, 68, 0.7);
        }
      `}</style>
    </>
  );
};

export default ProfileEditModal;