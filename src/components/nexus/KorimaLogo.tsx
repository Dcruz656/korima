import { cn } from "@/lib/utils";
import korimaLogo from "@/assets/korima-logo.png";

type KorimaLogoProps = {
  className?: string;
  showText?: boolean;
  title?: string;
};

/**
 * Logo Kórima usando imagen PNG.
 * Aplica dark:invert para adaptarse al tema.
 */
export function KorimaLogo({ 
  className, 
  showText = false,
  title = "Kórima" 
}: KorimaLogoProps) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <img 
        src={korimaLogo} 
        alt={title}
        className="h-full w-auto dark:invert"
      />
      {showText && (
        <span className="mt-2 text-sm tracking-[0.18em] font-medium text-foreground">
          KÓRIMA
        </span>
      )}
    </div>
  );
}
