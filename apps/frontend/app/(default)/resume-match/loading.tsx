export default function ResumeMatchLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">加载匹配分析页面...</span>
      </div>
    </div>
  );
}
