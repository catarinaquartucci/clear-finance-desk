import { cn } from "@/lib/utils";
import vantariLogo from "@/assets/vantari-logo.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const Logo = ({ className, size = "md" }: LogoProps) => {
  const sizeClasses = {
    sm: "h-6",
    md: "h-10",
    lg: "h-14",
  };

  return (
    <img 
      src={vantariLogo} 
      alt="Vantari" 
      className={cn(sizeClasses[size], "w-auto", className)}
    />
  );
};
