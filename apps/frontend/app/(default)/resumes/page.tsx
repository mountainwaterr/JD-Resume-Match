'use client';
import { t } from '@/lib/i18n/t-shim';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { NextSteps } from '@/components/common/next-steps';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, FileText, MoreHorizontal, Pencil, Download, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { fetchResumeList, deleteResume, type ResumeListItem } from '@/lib/api/resume';
import { useStatusCache } from '@/lib/context/status-cache';

export default function ResumesPage() {
  const router = useRouter();
  const { decrementResumes } = useStatusCache();

  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const loadResumes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchResumeList(true);
      setResumes(data);
    } catch (err) {
      console.error('Failed to load resumes:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  const formatDate = (value: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const filteredResumes = resumes.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.title || '').toLowerCase().includes(q) || (r.filename || '').toLowerCase().includes(q)
    );
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteResume(deleteTarget);
      decrementResumes();
      setResumes((prev) => prev.filter((r) => r.resume_id !== deleteTarget));
    } catch (err) {
      console.error('Failed to delete resume:', err);
    } finally {
      setDeleteTarget(null);
      setShowDeleteDialog(false);
    }
  };

  const getMonogram = (title: string): string => {
    return (title || 'R').slice(0, 2).toUpperCase();
  };

  return (
    <AppLayout>
      <div className="space-y-6 p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">我的简历</h1>
            <p className="mt-1 text-muted-foreground">管理你的所有简历，共 {resumes.length} 份</p>
          </div>
          <Button className="gap-2" onClick={() => router.push('/builder')}>
            <Plus className="size-4" />
            新建简历
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="搜索简历名称..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Resume List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredResumes.length === 0 ? (
          <Card className="border-dashed border-border/50">
            <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
              <FileText className="size-10 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {searchQuery ? '没有匹配的简历' : '还没有简历'}
              </p>
              <p className="text-sm text-muted-foreground/70">
                {searchQuery ? '尝试其他搜索关键词' : '上传简历文件或手动创建，开始你的求职之旅'}
              </p>
              {!searchQuery && (
                <Button
                  variant="outline"
                  className="mt-2 gap-2"
                  onClick={() => router.push('/builder')}
                >
                  <Plus className="size-4" />
                  新建简历
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredResumes.map((resume) => {
              const title = resume.title || resume.filename || 'Untitled Resume';
              return (
                <Card
                  key={resume.resume_id}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => router.push(`/resumes/${resume.resume_id}`)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      {getMonogram(title)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {resume.is_master ? '主简历' : resume.processing_status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(resume.updated_at || resume.created_at)}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/builder?id=${resume.resume_id}`);
                          }}
                        >
                          <Pencil className="size-4 mr-2" />
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/resumes/${resume.resume_id}`);
                          }}
                        >
                          <Download className="size-4 mr-2" />
                          下载 PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(resume.resume_id);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="size-4 mr-2" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="删除简历"
          description="确定要删除这份简历吗？此操作不可撤销。"
          confirmLabel="删除"
          cancelLabel="取消"
          onConfirm={handleDelete}
          variant="danger"
        />

        <NextSteps links={[{ label: '回到首页', href: '/dashboard', variant: 'outline' }]} />
      </div>
    </AppLayout>
  );
}
