export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F0EB]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">加载中...</span>
      </div>
    </div>
  );
}
