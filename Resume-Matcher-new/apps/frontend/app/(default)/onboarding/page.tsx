'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Upload, CheckCircle2, SkipForward, Loader2 } from 'lucide-react';
import { useFileUpload, formatBytes } from '@/hooks/use-file-upload';
import { getUploadUrl } from '@/lib/api/client';

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];
const MAX_FILE_SIZE = 4 * 1024 * 1024;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<'upload' | 'done'>('upload');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const UPLOAD_URL = getUploadUrl();

  const [
    { files, isDragging, isUploadingGlobal },
    { getInputProps, openFileDialog, handleDragEnter, handleDragLeave, handleDragOver, handleDrop },
  ] = useFileUpload({
    maxSize: MAX_FILE_SIZE,
    accept: ACCEPTED_FILE_TYPES.join(','),
    multiple: false,
    uploadUrl: UPLOAD_URL,
    onUploadSuccess: (_uploadedFile, response) => {
      const data = response as {
        resume_id?: string;
        is_master?: boolean;
      };
      if (data.resume_id) {
        localStorage.setItem('master_resume_id', data.resume_id);
        setUploadError(null);
        setTimeout(() => setStep('done'), 500);
      } else {
        setUploadError('上传失败，请重试');
      }
    },
    onUploadError: (_file, _response) => {
      setUploadError('上传失败，请检查文件格式和大小');
    },
  });

  const hasFile = files.length > 0;

  const handleSkip = () => {
    router.push('/dashboard');
  };

  const handleFinish = () => {
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Card className="border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              {step === 'upload' ? '欢迎使用 Resume Matcher' : '准备就绪'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {step === 'upload' ? '上传你的简历，开始智能匹配之旅' : '你的简历已就绪，开始探索吧'}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 'upload' ? (
              <>
                {hasFile ? (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <Loader2 className="size-10 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">正在上传并解析简历...</p>
                  </div>
                ) : (
                  <>
                    <div
                      className={`flex cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
                        isDragging
                          ? 'border-primary bg-primary/5'
                          : 'border-border/50 bg-muted/50 hover:border-primary/30 hover:bg-muted'
                      }`}
                      onClick={openFileDialog}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <Upload className="size-10 text-muted-foreground" />
                      <div>
                        <p className="font-medium">点击或拖拽上传简历</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          支持 PDF、DOCX、DOC 格式，最大 {formatBytes(MAX_FILE_SIZE)}
                        </p>
                      </div>
                      <input {...getInputProps()} />
                    </div>
                    {uploadError && (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive text-center">
                        {uploadError}
                      </div>
                    )}
                    <Button variant="ghost" className="w-full gap-2" onClick={handleSkip}>
                      <SkipForward className="size-4" />
                      跳过，稍后上传
                    </Button>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="inline-flex rounded-full bg-primary/10 p-3">
                    <CheckCircle2 className="size-10 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">简历上传成功，随时可以开始使用</p>
                </div>
                <Button className="w-full gap-2" onClick={handleFinish}>
                  开始使用
                  <ArrowRight className="size-4" />
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
