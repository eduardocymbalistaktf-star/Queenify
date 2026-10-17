import queenifyBee from "@/assets/queenify-bee-blue.png";

type BrandLogoProps = {
  size?: "small" | "medium" | "large" | "hero";
  className?: string;
  alt?: string;
};

const sizeClasses: Record<NonNullable<BrandLogoProps["size"]>, string> = {
  small: "h-9 w-9 rounded-xl p-1",
  medium: "h-11 w-11 rounded-2xl p-1",
  large: "h-14 w-14 rounded-2xl p-1.5",
  hero: "h-28 w-28 rounded-[1.75rem] p-2",
};

/** Queenify's full blue bee mark, kept legible on both light and dark surfaces. */
const BrandLogo = ({ size = "medium", className = "", alt = "Queenify" }: BrandLogoProps) => (
  <span
    className={`inline-flex shrink-0 items-center justify-center border border-white/70 bg-gradient-to-br from-white via-slate-100 to-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_4px_14px_rgba(14,165,233,0.22)] ${sizeClasses[size]} ${className}`}
  >
    <img
      src={queenifyBee}
      alt={alt}
      aria-hidden={alt.length === 0}
      draggable={false}
      className="h-full w-full object-contain drop-shadow-[0_2px_3px_rgba(2,132,199,0.18)]"
    />
  </span>
);

export default BrandLogo;
