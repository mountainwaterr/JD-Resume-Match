'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Layout, Columns2, Palette, Eye } from 'lucide-react';

type TemplateType = 'swiss-single' | 'swiss-two-column' | 'modern' | 'modern-two-column';

interface Template {
  id: TemplateType;
  name: string;
  description: string;
  layout: 'single' | 'two-column';
  style: 'classic' | 'modern';
}

const templates: Template[] = [
  {
    id: 'swiss-single',
    name: '经典单栏',
    description: '传统单栏布局，适合大多数场景',
    layout: 'single',
    style: 'classic',
  },
  {
    id: 'swiss-two-column',
    name: '经典双栏',
    description: '左侧技能栏，右侧经历展示',
    layout: 'two-column',
    style: 'classic',
  },
  {
    id: 'modern',
    name: '现代单栏',
    description: '带强调色的现代单栏设计',
    layout: 'single',
    style: 'modern',
  },
  {
    id: 'modern-two-column',
    name: '现代双栏',
    description: '双栏布局配合现代配色',
    layout: 'two-column',
    style: 'modern',
  },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<TemplateType>('swiss-single');

  return (
    <AppLayout>
      <div className="space-y-6 p-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">模板样式</h1>
          <p className="mt-1 text-muted-foreground">选择你喜欢的简历模板和格式</p>
        </div>

        {/* Template Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selected === template.id ? 'ring-2 ring-primary border-primary' : 'border-border/50'
              }`}
              onClick={() => setSelected(template.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                      {template.layout === 'single' ? (
                        <Layout className="size-6 text-primary" />
                      ) : (
                        <Columns2 className="size-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                  </div>
                  {selected === template.id && (
                    <div className="flex size-6 items-center justify-center rounded-full bg-primary">
                      <Check className="size-4 text-primary-foreground" />
                    </div>
                  )}
                </div>

                {/* Mini preview */}
                <div className="mt-4 rounded-lg border border-border/50 bg-muted/50 p-4">
                  <div className="space-y-2">
                    <div className="h-2 w-3/4 rounded-full bg-muted-foreground/20" />
                    <div className="h-2 w-1/2 rounded-full bg-muted-foreground/20" />
                    <div className="mt-3 space-y-1.5">
                      <div className="h-1.5 w-full rounded-full bg-muted-foreground/10" />
                      <div className="h-1.5 w-full rounded-full bg-muted-foreground/10" />
                      <div className="h-1.5 w-2/3 rounded-full bg-muted-foreground/10" />
                    </div>
                    {template.layout === 'two-column' && (
                      <div className="mt-2 flex gap-2">
                        <div className="h-12 w-1/3 rounded bg-muted-foreground/10" />
                        <div className="h-12 w-2/3 rounded bg-muted-foreground/10" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {template.layout === 'single' ? '单栏' : '双栏'}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {template.style === 'classic' ? '经典' : '现代'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button className="gap-2" onClick={() => router.push(`/builder?template=${selected}`)}>
            <Palette className="size-4" />
            使用此模板
          </Button>
          <Button variant="outline" className="gap-2">
            <Eye className="size-4" />
            预览示例
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
