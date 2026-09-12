"use client";

import {
  LayoutDashboard,
  Building2,
  Home,
  Users,
  FileText,
  Wrench,
  FolderOpen,
  Bot,
} from "lucide-react";

const navigation = [
  
  {
    name: "Properties",
    icon: Building2,
  },
  
  {
    name: "Tenants",
    icon: Users,
  },
  {
    name: "Contracts",
    icon: FileText,
  },
  {
    name: "Maintenance",
    icon: Wrench,
  },
  {
    name: "Documents",
    icon: FolderOpen,
  },
  {
    name: "AI Assistant",
    icon: Bot,
  },
];

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-white">
      {/* Logo */}

      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white">
            <Building2 size={18} />
          </div>

          <span className="text-lg font-semibold">
            PropertyAI
          </span>
        </div>
      </div>

      {/* Navigation */}

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                item.name === "AI Assistant"
                  ? "bg-gray-100 font-medium text-black"
                  : "text-gray-600 hover:bg-gray-100 hover:text-black"
              }`}
            >
              <Icon size={18} />

              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* User */}

      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-medium">
            A
          </div>

          <div>
            <p className="text-sm font-medium">
              Admin
            </p>

            <p className="text-xs text-gray-500">
              Property Manager
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}