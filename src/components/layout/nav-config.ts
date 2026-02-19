import type { LucideIcon } from "lucide-react";
import {
  Home,
  FolderKanban,
  FileText,
  BarChart3,
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
    items: [{ label: "Home", to: "/", icon: Home }],
  },
  {
    label: "Harvesting",
    items: [
      {
        label: "Projects",
        to: "/projects",
        icon: FolderKanban,
        children: [
          { label: "All Projects", to: "/projects" },
          { label: "My Projects", to: "/projects/mine" },
        ],
      },
      {
        label: "Outcomes",
        to: "/outcomes",
        icon: FileText,
        children: [{ label: "All Outcomes", to: "/outcomes" }],
      },
    ],
  },
  {
    label: "Analytics",
    items: [{ label: "Reports", to: "/reports", icon: BarChart3 }],
  },
  {
    label: "Administration",
    items: [
      { label: "Team", to: "/team", icon: Users },
      { label: "Settings", to: "/settings", icon: Settings },
    ],
  },
];
