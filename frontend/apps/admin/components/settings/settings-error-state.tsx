interface SettingsErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function SettingsErrorState({ message, onRetry }: SettingsErrorStateProps) {
  return (
    <div className="mx-auto max-w-5xl pb-10">
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-800">
        <p className="font-medium">Configuration indisponible</p>
        <p className="mt-1">{message}</p>
        <button type="button" onClick={onRetry} className="mt-3 font-medium underline">
          Réessayer
        </button>
      </div>
    </div>
  );
}
