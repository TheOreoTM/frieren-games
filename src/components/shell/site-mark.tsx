import Image from "next/image";

import { resolveSiteBrand, type SiteBrand } from "@/lib/site-brand";

export function SiteMark({
  brand = resolveSiteBrand(),
  className = "size-9",
}: {
  brand?: SiteBrand;
  className?: string;
}) {
  return (
    <Image
      src={brand.markPath}
      alt=""
      width={64}
      height={64}
      className={`${className} object-contain`}
      aria-hidden="true"
      unoptimized
    />
  );
}
