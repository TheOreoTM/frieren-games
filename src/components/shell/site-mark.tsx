export function SiteMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="16" cy="16" r="13" className="fill-sage/15 stroke-sage" strokeWidth="1.5" />
      <path d="M16 6.5 18.2 13.8 25.5 16l-7.3 2.2L16 25.5l-2.2-7.3L6.5 16l7.3-2.2L16 6.5Z" className="fill-gold stroke-gold" strokeLinejoin="round" />
      <circle cx="16" cy="16" r="2.2" className="fill-surface" />
    </svg>
  );
}
