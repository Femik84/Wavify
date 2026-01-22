import React, { forwardRef, useImperativeHandle, useRef } from "react";
import {
  XMarkIcon,
  Squares2X2Icon,
  FolderIcon,
} from "@heroicons/react/24/solid";
import { Home as LucideHome } from "lucide-react";
import { navItems } from "../Data";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authstore";

type Props = {
  isDark: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
};

// Forward the aside element as ref so parent can inspect (contains/blur) it
const MobileSidebar = forwardRef<HTMLElement | null, Props>(function MobileSidebar(
  { isDark, sidebarOpen, setSidebarOpen },
  ref
) {
  const navigate = useNavigate();
  const location = useLocation();
  const asideRef = useRef<HTMLElement | null>(null);
  const { user } = useAuthStore();

  // Non-null assertion to satisfy TypeScript
  useImperativeHandle(ref, () => asideRef.current!, []);

  const cardBg = isDark ? "bg-zinc-900" : "bg-white";
  const hoverBg = isDark ? "hover:bg-zinc-800" : "hover:bg-gray-100";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const borderColor = isDark ? "border-zinc-800" : "border-gray-200";

  const iconsMap: Record<string, React.ComponentType<any>> = {
    home: LucideHome,
    browse: Squares2X2Icon,
    library: FolderIcon,
  };

  // Only include nav items we want to display in the main menu
  const filteredNavItems = navItems.filter((item) =>
    ["Home", "Browse", "Library"].includes(item.name)
  );

  // Get user initials
  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const displayName = user?.full_name || "Guest User";
  const displayEmail = user?.email || "guest@example.com";
  const userInitials = getInitials(displayName);

  // Local close handler: blur active element inside before hiding
  const handleLocalClose = () => {
    try {
      const active = document.activeElement as HTMLElement | null;
      if (active && asideRef.current && asideRef.current.contains(active)) {
        active.blur();
      }
    } catch {
      // ignore
    }
    setSidebarOpen(false);
  };

  return (
    <aside
      ref={asideRef}
      className={`fixed inset-y-0 left-0 w-72 ${cardBg} z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } shadow-2xl`}
      // aria-hidden should reflect actual visibility: avoid hiding while a descendant still has focus
      aria-hidden={!sidebarOpen}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b ${borderColor} sticky top-0 ${cardBg} z-10`}
        >
          <div className="flex items-center mt-1 gap-3">
            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-red-600 to-red-800 flex items-center justify-center shadow">
              <span className="text-white font-extrabold">W</span>
            </div>
            <div>
              <h2 className="text-[20px] font-bold leading-none">
                Wavi<span className="text-red-600">fy</span>
              </h2>
              <p className="text-[14px] relative top-1 text-gray-400">Your music, on the go</p>
            </div>
          </div>

          <button
            onClick={handleLocalClose}
            aria-label="Close sidebar"
            className={`p-2 rounded-full ${hoverBg} transition`}
          >
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto" aria-hidden={!sidebarOpen}>
          <ul className="space-y-2">
            {filteredNavItems.map((item, idx) => {
              const isActive = location.pathname === item.href;
              const keyName = item.name.toLowerCase();
              const Icon: React.ComponentType<any> = iconsMap[keyName] || Squares2X2Icon;

              return (
                <li key={idx}>
                  <button
                    onClick={() => {
                      navigate(item.href);
                      // blur any focused element inside before hiding
                      try {
                        const active = document.activeElement as HTMLElement | null;
                        if (active && asideRef.current && asideRef.current.contains(active)) {
                          active.blur();
                        }
                      } catch {}
                      setSidebarOpen(false);
                    }}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition group focus:outline-none ${
                      isActive
                        ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                        : `${hoverBg} ${textPrimary}`
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span
                      className={`flex items-center justify-center w-9 h-9 rounded-lg ${
                        isActive ? "bg-white/10" : "bg-transparent"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${isActive ? "text-white" : "text-red-600"}`}
                        {...(Icon === LucideHome ? { strokeWidth: 0, fill: "currentColor" } : {})}
                      />
                    </span>

                    <span className="flex-1 font-semibold text-lg">{item.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer / Profile */}
        <div className={`p-4 border-t ${borderColor}`}>
          <div
            className={`flex items-center gap-3 rounded-lg p-3 ${isDark ? "bg-zinc-800" : "bg-gray-100"}`}
          >
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-red-600 to-red-800 flex items-center justify-center shadow">
              <span className="text-white font-bold text-sm">{userInitials}</span>
            </div>

            <div className="flex-1 min-w-0">
              <p className={`font-semibold truncate ${textPrimary}`}>{displayName}</p>
              <p className="text-xs text-gray-400 truncate">{displayEmail}</p>
            </div>

            <div className="shrink-0">
              <button
                onClick={() => {
                  navigate("/profile");
                  try {
                    const active = document.activeElement as HTMLElement | null;
                    if (active && asideRef.current && asideRef.current.contains(active)) {
                      active.blur();
                    }
                  } catch {}
                  setSidebarOpen(false);
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold text-sm transition ${isDark ? "bg-zinc-700" : "bg-white"} ${hoverBg}`}
              >
                Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
});

export default MobileSidebar;