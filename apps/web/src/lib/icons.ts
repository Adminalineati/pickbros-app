import {
  Bell,
  CalendarDays,
  CircleHelp,
  Home,
  LineChart,
  Plus,
  Store,
  Swords,
  Target,
  Trophy,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';

const iconos: Record<string, LucideIcon> = {
  home: Home,
  target: Target,
  'line-chart': LineChart,
  swords: Swords,
  trophy: Trophy,
  users: Users,
  store: Store,
  user: User,
  bell: Bell,
  'circle-help': CircleHelp,
  plus: Plus,
  'calendar-days': CalendarDays,
};

export function iconoDe(nombre: string): LucideIcon {
  return iconos[nombre] ?? Home;
}
