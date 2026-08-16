type Props = {
  message?: string;
};

export function LoadingScreen({ message = "Ładowanie..." }: Props) {
  return (
    <div className="safe-top flex min-h-[60vh] flex-col items-center justify-center px-5">
      {/* Spinner */}
      <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brass" />
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}
