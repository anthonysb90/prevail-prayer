import { Category } from "@/types";

export const DEFAULT_CATEGORIES: Omit<Category, "id" | "user_id" | "created_at">[] = [
  { name: "Family",    color_bg: "#E8F5E9", color_border: "#4CAF50", icon: "home",       sort_order: 0, is_default: true },
  { name: "Church",   color_bg: "#E3F2FD", color_border: "#2196F3", icon: "people",      sort_order: 1, is_default: true },
  { name: "Healing",  color_bg: "#FCE4EC", color_border: "#E91E63", icon: "heart",       sort_order: 2, is_default: true },
  { name: "Finances", color_bg: "#FFF8E1", color_border: "#FFC107", icon: "cash",        sort_order: 3, is_default: true },
  { name: "Missions", color_bg: "#E0F7FA", color_border: "#00BCD4", icon: "earth",       sort_order: 4, is_default: true },
  { name: "Nation",   color_bg: "#EDE7F6", color_border: "#673AB7", icon: "flag",        sort_order: 5, is_default: true },
  { name: "Salvation",color_bg: "#FBE9E7", color_border: "#FF5722", icon: "star",        sort_order: 6, is_default: true },
  { name: "Work",     color_bg: "#F3E5F5", color_border: "#9C27B0", icon: "briefcase",   sort_order: 7, is_default: true },
  { name: "Personal", color_bg: "#E8EAF6", color_border: "#3F51B5", icon: "person",      sort_order: 8, is_default: true },
  { name: "Friends",  color_bg: "#F1F8E9", color_border: "#8BC34A", icon: "people-circle", sort_order: 9, is_default: true },
];
