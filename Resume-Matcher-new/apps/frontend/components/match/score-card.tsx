'use client';

import React from 'react';
import type { MatchAnalysisResult, DimensionScore } from '@/lib/api/analysis';

function gradeColor(grade: string): string {
  switch (grade) {
    case 'A':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'B':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'C':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'D':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

function scoreColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

function ScoreGauge({ score, grade }: { score: number; grade: string }) {
  return (
    <div className="flex flex-col items-center p-6">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="#E5E1DC" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke={
              score >= 80
                ? '#15803D'
                : score >= 60
                  ? '#2563EB'
                  : score >= 40
                    ? '#D97706'
                    : '#DC2626'
            }
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 327} 327`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{score}</span>
          <span className="text-xs text-gray-500">总分</span>
        </div>
      </div>
      <span
        className={`inline-block mt-3 px-4 py-1 text-lg font-bold rounded-full border ${gradeColor(grade)}`}
      >
        {grade}
      </span>
    </div>
  );
}

function DimensionBar({ dim }: { dim: DimensionScore }) {
  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-gray-800">{dim.dimension}</span>
        <span
          className={`text-sm font-bold px-2 py-0.5 rounded text-white ${scoreColor(dim.score)}`}
        >
          {dim.score}
        </span>
      </div>

      {/* Score bar */}
      <div className="w-full h-2 bg-gray-100 rounded-full mb-3">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${scoreColor(dim.score)}`}
          style={{ width: `${dim.score}%` }}
        />
      </div>

      {/* Matched */}
      {dim.matched.length > 0 && (
        <div className="mb-2">
          <span className="text-xs font-medium text-emerald-700">匹配项：</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {dim.matched.map((m, i) => (
              <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Gaps */}
      {dim.gaps.length > 0 && (
        <div className="mb-2">
          <span className="text-xs font-medium text-red-600">差距：</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {dim.gaps.map((g, i) => (
              <span key={i} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">
                {g}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {dim.suggestions.length > 0 && (
        <div>
          <span className="text-xs font-medium text-amber-700">修改建议：</span>
          <ul className="mt-1 space-y-1">
            {dim.suggestions.map((s, i) => (
              <li key={i} className="text-xs text-gray-600 flex gap-1">
                <span className="text-amber-500 shrink-0">💡</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function MatchScoreCard({ result }: { result: MatchAnalysisResult }) {
  return (
    <div className="space-y-6">
      {/* Header: total score + summary */}
      <div className="bg-white border rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <ScoreGauge score={result.total_score} grade={result.grade} />
          <div className="flex-1">
            {result.jd_title && (
              <h2 className="text-lg font-serif font-bold text-gray-900 mb-2">
                岗位：{result.jd_title}
              </h2>
            )}
            <p className="text-sm text-gray-600 leading-relaxed">{result.summary}</p>
          </div>
        </div>
      </div>

      {/* 6 dimensions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {result.dimensions.map((dim, i) => (
          <DimensionBar key={i} dim={dim} />
        ))}
      </div>

      {/* Top suggestions */}
      {result.top_suggestions.length > 0 && (
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-5">
          <h3 className="font-serif font-bold text-gray-900 mb-3">优先改进建议</h3>
          <ol className="space-y-2">
            {result.top_suggestions.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="font-bold text-primary shrink-0">{i + 1}.</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
