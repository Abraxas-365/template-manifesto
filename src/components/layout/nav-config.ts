import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FileText,
  FileStack,
  ShieldCheck,
  Users,
  Settings,
} from "lucide-react";

export interface NavSubItem {
  label: string;
  to: string;
}

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: string;
  children?: NavSubItem[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navConfig: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", to: "/", icon: LayoutDashboard }],
  },
  {
    label: "Projects",
    items: [
      {
        label: "Projects",
        to: "/projects",
        icon: FileText,
        children: [
          { label: "All Projects", to: "/projects" },
          { label: "My Projects", to: "/projects/mine" },
        ],
      },
      {
        label: "Templates",
        to: "/kbs",
        icon: FileStack,
      },
      {
        label: "Controls",
        to: "/reports",
        icon: ShieldCheck,
      },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Team", to: "/team", icon: Users },
      { label: "Settings", to: "/settings", icon: Settings },
    ],
  },
];
