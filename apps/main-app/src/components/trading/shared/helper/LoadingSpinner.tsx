export function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    </div>
  );
}
