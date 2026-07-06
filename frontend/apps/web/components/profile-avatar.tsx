export function ProfileAvatar({
  name,
  size = "lg",
}: {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  const dimension =
    size === "lg"
      ? "h-20 w-20 text-2xl"
      : size === "sm"
        ? "h-10 w-10 text-sm"
        : size === "xs"
          ? "h-8 w-8 text-xs"
          : "h-14 w-14 text-lg";
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-yunicity-primary font-bold text-white ${dimension}`}
      aria-hidden
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
