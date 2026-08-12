export default function Home() {
  return (
    <div className="flex flex-1 flex-col gap-2 p-6">
      <h1 className="font-heading font-semibold text-2xl">Toolkit</h1>
      <p className="text-muted-foreground text-sm">
        Pick a tool from the sidebar, or press Ctrl K to search.
      </p>
    </div>
  );
}
