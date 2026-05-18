export function ProfileAvatar({
  name,
  size = "lg",
}: {
  name: string;
  size?: "md" | "lg";
}) {
  const dimension = size === "lg" ? "h-20 w-20 text-2xl" : "h-14 w-14 text-lg";
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-600 font-bold text-white ${dimension}`}
      aria-hidden
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
