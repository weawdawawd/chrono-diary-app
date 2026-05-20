import logo from "@/assets/ledion-logo.png";
import { cn } from "@/lib/utils";

interface Props {
  size?: number;
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export default function BrandLogo({ size = 40, className, showText = false, textClassName }: Props) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <img
        src={logo}
        alt="Ledion Security"
        width={size}
        height={size}
        className="object-contain drop-shadow-sm"
        style={{ width: size, height: size }}
      />
      {showText && (
        <div className={cn("leading-none", textClassName)}>
          <div className="font-display font-bold tracking-tight text-foreground">LEDION</div>
          <div className="font-display text-[10px] tracking-[0.25em] text-brand-red font-semibold -mt-0.5">SECURITY</div>
        </div>
      )}
    </div>
  );
}
