import { LucideIcon } from 'lucide-react';

export type ViewState = 'HOME' | 'SERVICE_CHARGE' | 'DESCO' | 'EMERGENCY' | 'MENU' | 'TO_LET' | 'AI_ASSISTANT' | 'WATER_BILL' | 'LIFT_INSTRUCTIONS' | 'DESCO_INFO' | 'DESCO_RULES' | 'ACCOUNTS' | 'MAP_ROUTES' | 'MAINTENANCE' | 'SETTINGS' | 'PRAYER_TIME' | 'RECHARGE_RULES' | 'POLICY' | 'DOWNLOAD_APP' | 'CONTACT' | 'EMERGENCY_NOTICE_DETAIL';

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