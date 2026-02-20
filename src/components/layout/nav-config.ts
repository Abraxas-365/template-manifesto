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
    label: "Policies",
    items: [
      {
        label: "Policies",
        to: "/projects",
        icon: FileText,
        children: [
          { label: "All Policies", to: "/projects" },
          { label: "My Policies", to: "/projects/mine" },
        ],
      },
      {
        label: "Policy Templates",
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
