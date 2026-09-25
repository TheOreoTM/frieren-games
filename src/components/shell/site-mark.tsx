import Image from "next/image";

export function SiteMark({ className = "size-9" }: { className?: string }) {
  return (
    <Image
      src="/brand/magic-in-passing-mark.png"
      alt=""
      width={64}
      height={64}
      className={className}
      aria-hidden="true"
      unoptimized
    />
  );
}
