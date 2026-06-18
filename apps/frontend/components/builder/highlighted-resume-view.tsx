'use client';

import { useMemo } from 'react';
import { type ResumeData } from '@/components/dashboard/resume-component';
import { segmentTextByKeywords } from '@/lib/utils/keyword-matcher';
import { FileUser, Briefcase, GraduationCap, FolderKanban, Wrench } from 'lucide-react';
import { t } from '@/lib/i18n/t-shim';

interface HighlightedResumeViewProps {
  resumeData: ResumeData;
  keywords: Set<string>;
}

/**
 * Display resume content with matching keywords highlighted.
 * Shows all resume sections with visual highlighting of JD matches.
 */
export function HighlightedResumeView({ resumeData, keywords }: HighlightedResumeViewProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-paper-tint bg-muted">
        <FileUser className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-mono text-sm font-bold uppercase text-muted-foreground">
          {'你的简历'}
        </h3>
        <span className="text-xs text-muted-foreground ml-2">{'（已高亮匹配关键词）'}</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Summary */}
        {resumeData.summary && (
          <Section title={'个人简介'} icon={<FileUser className="w-4 h-4" />}>
            <HighlightedText text={resumeData.summary} keywords={keywords} />
          </Section>
        )}

        {/* Work Experience */}
        {resumeData.workExperience && resumeData.workExperience.length > 0 && (
          <Section title={'工作经历'} icon={<Briefcase className="w-4 h-4" />}>
            {resumeData.workExperience.map((exp) => (
              <div key={exp.id} className="mb-4 last:mb-0">
                <div className="font-semibold text-muted-foreground">
                  <HighlightedText text={exp.title || ''} keywords={keywords} />
                  {exp.company && (
                    <span className="text-muted-foreground">
                      {' 在 '}
                      <HighlightedText text={exp.company} keywords={keywords} />
                    </span>
                  )}
                </div>
                {exp.years && <div className="text-xs text-muted-foreground mb-1">{exp.years}</div>}
                {exp.description && (
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {exp.description.map((bullet, i) => (
                      <li key={i} className="text-muted-foreground">
                        <HighlightedText text={bullet} keywords={keywords} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Education */}
        {resumeData.education && resumeData.education.length > 0 && (
          <Section title={'教育背景'} icon={<GraduationCap className="w-4 h-4" />}>
            {resumeData.education.map((edu) => (
              <div key={edu.id} className="mb-3 last:mb-0">
                <div className="font-semibold text-muted-foreground">
                  <HighlightedText text={edu.degree || ''} keywords={keywords} />
                </div>
                {edu.institution && (
                  <div className="text-sm text-muted-foreground">
                    <HighlightedText text={edu.institution} keywords={keywords} />
                  </div>
                )}
                {edu.years && <div className="text-xs text-muted-foreground">{edu.years}</div>}
              </div>
            ))}
          </Section>
        )}

        {/* Projects */}
        {resumeData.personalProjects && resumeData.personalProjects.length > 0 && (
          <Section title={'项目经历'} icon={<FolderKanban className="w-4 h-4" />}>
            {resumeData.personalProjects.map((proj) => (
              <div key={proj.id} className="mb-4 last:mb-0">
                <div className="font-semibold text-muted-foreground">
                  <HighlightedText text={proj.name || ''} keywords={keywords} />
                  {proj.role && (
                    <span className="text-muted-foreground font-normal">
                      {' '}
                      {'—'} <HighlightedText text={proj.role} keywords={keywords} />
                    </span>
                  )}
                </div>
                {proj.years && (
                  <div className="text-xs text-muted-foreground mb-1">{proj.years}</div>
                )}
                {proj.description && (
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {proj.description.map((bullet, i) => (
                      <li key={i} className="text-muted-foreground">
                        <HighlightedText text={bullet} keywords={keywords} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Skills */}
        {resumeData.additional && (
          <Section title={'技能与荣誉'} icon={<Wrench className="w-4 h-4" />}>
            {resumeData.additional.technicalSkills &&
              resumeData.additional.technicalSkills.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-mono uppercase text-muted-foreground mb-1">
                    {'技术技能'}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {resumeData.additional.technicalSkills.map((skill, i) => (
                      <SkillTag key={i} text={skill} keywords={keywords} />
                    ))}
                  </div>
                </div>
              )}

            {resumeData.additional.languages && resumeData.additional.languages.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-mono uppercase text-muted-foreground mb-1">
                  {'语言能力'}
                </div>
                <div className="flex flex-wrap gap-1">
                  {resumeData.additional.languages.map((lang, i) => (
                    <SkillTag key={i} text={lang} keywords={keywords} />
                  ))}
                </div>
              </div>
            )}

            {resumeData.additional.certificationsTraining &&
              resumeData.additional.certificationsTraining.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-mono uppercase text-muted-foreground mb-1">
                    {'培训与证书'}
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {resumeData.additional.certificationsTraining.map((cert, i) => (
                      <li key={i} className="text-muted-foreground">
                        <HighlightedText text={cert} keywords={keywords} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </Section>
        )}
      </div>
    </div>
  );
}

/**
 * Section wrapper component
 */
function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-paper-tint bg-white ">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-paper-tint bg-muted">
        {icon}
        <span className="text-sm font-semibold text-muted-foreground">{title}</span>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

/**
 * Component to render text with highlighted keywords.
 */
function HighlightedText({ text, keywords }: { text: string; keywords: Set<string> }) {
  const segments = useMemo(() => segmentTextByKeywords(text, keywords), [text, keywords]);

  return (
    <span>
      {segments.map((segment, i) =>
        segment.isMatch ? (
          <mark key={i} className="bg-yellow-200 text-black px-0.5">
            {segment.text}
          </mark>
        ) : (
          <span key={i}>{segment.text}</span>
        )
      )}
    </span>
  );
}

/**
 * Skill tag with optional highlighting
 */
function SkillTag({ text, keywords }: { text: string; keywords: Set<string> }) {
  const isMatch = keywords.has(text.toLowerCase());

  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs ${
        isMatch ? 'bg-yellow-200 text-black font-medium' : 'bg-background text-muted-foreground'
      }`}
    >
      {text}
    </span>
  );
}
