"use client";

type YunicityBrandLoaderProps = {
  message?: string;
  className?: string;
};

export function YunicityBrandLoader({
  message = "Chargement…",
  className = "",
}: YunicityBrandLoaderProps) {
  return (
    <div
      className={`flex min-h-[40vh] flex-col items-center justify-center gap-4 px-6 py-16 ${className}`}
      role="status"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/yunicity-mascot.png"
        alt="Yunicity"
        width={72}
        height={72}
        className="animate-pulse object-contain"
      />
      <p className="text-sm text-neutral-600">{message}</p>
    </div>
  );
}
