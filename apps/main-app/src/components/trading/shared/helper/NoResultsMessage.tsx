export function NoResultsMessage() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <div className="text-muted-foreground text-sm font-medium">No results found</div>
        <div className="text-muted-foreground text-xs mt-1">
          Try searching with different keywords
        </div>
      </div>
    </div>
  );
}
