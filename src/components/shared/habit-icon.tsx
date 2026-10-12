import {
  Apple,
  BedDouble,
  Bike,
  BookOpen,
  Brain,
  Clock,
  Code,
  Coffee,
  Droplets,
  Dumbbell,
  Footprints,
  Heart,
  Languages,
  Leaf,
  Moon,
  Music,
  Pencil,
  PiggyBank,
  Salad,
  Smile,
  Sparkles,
  Sun,
  Target,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { HabitIconKey } from "@/shared/habits";
import { cn } from "@/lib/utils";

export const HABIT_ICONS: Record<HabitIconKey, LucideIcon> = {
  target: Target,
  "book-open": BookOpen,
  dumbbell: Dumbbell,
  droplets: Droplets,
  brain: Brain,
  code: Code,
  moon: Moon,
  heart: Heart,
  apple: Apple,
  coffee: Coffee,
  wallet: Wallet,
  pencil: Pencil,
  music: Music,
  sun: Sun,
  footprints: Footprints,
  bike: Bike,
  leaf: Leaf,
  smile: Smile,
  sparkles: Sparkles,
  clock: Clock,
  languages: Languages,
  "piggy-bank": PiggyBank,
  bed: BedDouble,
  salad: Salad,
};

interface HabitIconProps {
  icon: string;
  color: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = { sm: "size-8 [&_svg]:size-4", md: "size-10 [&_svg]:size-5", lg: "size-14 [&_svg]:size-7" } as const;

/** A habit's icon on a tinted tile in the habit's own colour. */
export function HabitIcon({ icon, color, size = "md", className }: HabitIconProps) {
  const Icon = HABIT_ICONS[icon as HabitIconKey] ?? Target;
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex shrink-0 items-center justify-center rounded-xl", SIZES[size], className)}
      style={{ backgroundColor: `${color}22`, color }}
    >
      <Icon />
    </span>
  );
}
