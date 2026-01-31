import { cn } from "@/lib/utils";
import {
  Stethoscope,
  Cog,
  Users,
  BookOpen,
  FlaskConical,
  Scale,
  Briefcase,
  Palette,
  Globe,
} from "lucide-react";

const categories = [
  { id: "all", label: "Todos", icon: Globe },
  { id: "medicina", label: "Medicina", icon: Stethoscope },
  { id: "ingenieria", label: "Ingeniería", icon: Cog },
  { id: "ciencias-sociales", label: "Ciencias Sociales", icon: Users },
  { id: "humanidades", label: "Humanidades", icon: BookOpen },
  { id: "ciencias-naturales", label: "Ciencias Naturales", icon: FlaskConical },
  { id: "derecho", label: "Derecho", icon: Scale },
  { id: "economia", label: "Economía", icon: Briefcase },
  { id: "artes", label: "Artes", icon: Palette },
];

interface CategoryFilterProps {
  selected: string;
  onSelect: (category: string) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => {
        const isActive = selected === category.id;
        const Icon = category.icon;
        return (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all duration-200 font-medium",
              isActive
                ? "bg-primary text-primary-foreground shadow-nexus"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{category.label}</span>
          </button>
        );
      })}
    </div>
  );
}
