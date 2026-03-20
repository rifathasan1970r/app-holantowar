import { LucideIcon } from 'lucide-react';

export type ViewState = 'HOME' | 'SERVICE_CHARGE' | 'DESCO' | 'EMERGENCY' | 'MENU' | 'TO_LET' | 'AI_ASSISTANT' | 'LIFT_INSTRUCTIONS' | 'DESCO_INFO' | 'DESCO_RULES' | 'ACCOUNTS' | 'MAP_ROUTES' | 'MAINTENANCE' | 'SETTINGS' | 'PRAYER_TIME' | 'RECHARGE_RULES' | 'POLICY' | 'DOWNLOAD_APP' | 'CONTACT' | 'EMERGENCY_NOTICE_DETAIL' | 'GALLERY' | 'GALLERY_COMING_SOON' | 'GALLERY_CONTROL_ROOM' | 'GALLERY_DETAIL' | 'UNIT_A' | 'UNIT_B' | 'UNIT_C';

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  view: ViewState;
  color?: string;
  description?: string;
  gradient?: string;
}

export interface Notice {
  id: number;
  text: string;
  date: string;
  icon?: LucideIcon;
}