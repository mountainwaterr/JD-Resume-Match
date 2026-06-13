'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import {
  type TemplateSettings,
  type TemplateType,
  type PageSize,
  type SpacingLevel,
  type HeaderFontFamily,
  type BodyFontFamily,
  type AccentColor,
  DEFAULT_TEMPLATE_SETTINGS,
  SECTION_SPACING_MAP,
  ITEM_SPACING_MAP,
  LINE_HEIGHT_MAP,
  FONT_SIZE_MAP,
  HEADER_SCALE_MAP,
  COMPACT_MULTIPLIER,
  COMPACT_LINE_HEIGHT_MULTIPLIER,
  TEMPLATE_OPTIONS,
  PAGE_SIZE_INFO,
  ACCENT_COLOR_MAP,
} from '@/lib/types/template-settings';
import { TemplateThumbnail } from './template-selector';
import { t } from '@/lib/i18n/t-shim';

interface FormattingControlsProps {
  settings: TemplateSettings;
  onChange: (settings: TemplateSettings) => void;
}

/**
 * Formatting Controls Panel
 *
 * Provides user controls for adjusting resume layout:
 * - Template selection with visual thumbnails
 * - Page size (A4 / US Letter)
 * - Margins (top, bottom, left, right)
 * - Section/item spacing
 * - Line height
 * - Font sizes
 *
 * Swiss design: Square buttons, monospace labels, high contrast
 */
export const FormattingControls: React.FC<FormattingControlsProps> = ({ settings, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const compactMultiplier = settings.compactMode ? COMPACT_MULTIPLIER : 1;
  const sectionGapRem =
    parseFloat(SECTION_SPACING_MAP[settings.spacing.section]) * compactMultiplier;
  const itemGapRem = parseFloat(ITEM_SPACING_MAP[settings.spacing.item]) * compactMultiplier;
  const lineHeightValue = settings.compactMode
    ? LINE_HEIGHT_MAP[settings.spacing.lineHeight] * COMPACT_LINE_HEIGHT_MULTIPLIER
    : LINE_HEIGHT_MAP[settings.spacing.lineHeight];

  const formatRem = (value: number) =>
    `${value.toFixed(2).replace(/\.00$/, '').replace(/0$/, '')}rem`;

  const handleTemplateChange = (template: TemplateType) => {
    onChange({ ...settings, template });
  };

  const handlePageSizeChange = (pageSize: PageSize) => {
    onChange({ ...settings, pageSize });
  };

  const handleMarginChange = (key: keyof TemplateSettings['margins'], value: number) => {
    onChange({
      ...settings,
      margins: { ...settings.margins, [key]: value },
    });
  };

  const handleSpacingChange = (key: keyof TemplateSettings['spacing'], value: SpacingLevel) => {
    onChange({
      ...settings,
      spacing: { ...settings.spacing, [key]: value },
    });
  };

  const handleFontChange = (key: keyof TemplateSettings['fontSize'], value: SpacingLevel) => {
    onChange({
      ...settings,
      fontSize: { ...settings.fontSize, [key]: value },
    });
  };

  const handleHeaderFontChange = (headerFont: HeaderFontFamily) => {
    onChange({
      ...settings,
      fontSize: { ...settings.fontSize, headerFont },
    });
  };

  const handleBodyFontChange = (bodyFont: BodyFontFamily) => {
    onChange({
      ...settings,
      fontSize: { ...settings.fontSize, bodyFont },
    });
  };

  const handleCompactModeToggle = () => {
    onChange({ ...settings, compactMode: !settings.compactMode });
  };

  const handleShowContactIconsToggle = () => {
    onChange({ ...settings, showContactIcons: !settings.showContactIcons });
  };

  const handleAccentColorChange = (accentColor: AccentColor) => {
    onChange({ ...settings, accentColor });
  };

  const handleReset = () => {
    onChange(DEFAULT_TEMPLATE_SETTINGS);
  };

  const templateLabels = React.useMemo(
    () => ({
      'swiss-single': {
        name: '单栏',
        description: '传统全宽布局，内容密度最高',
      },
      'swiss-two-column': {
        name: '双栏',
        description: '以经历为主的主栏布局，侧栏展示技能',
      },
      modern: {
        name: '现代',
        description: '彩色点缀，支持自定义主题色',
      },
      'modern-two-column': {
        name: '现代双栏',
        description: '现代双栏布局，带彩色点缀与主题色',
      },
    }),
    [t]
  );

  const getFontLabel = (font: HeaderFontFamily | BodyFontFamily) => {
    if (font === 'sans-serif') return '无衬线';
    if (font === 'serif') return '衬线';
    return '等宽';
  };

  return (
    <div className="border border-border bg-white shadow-md">
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-700"></div>
          <span className="text-sm font-semibold">{'模板与排版'}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="border-t border-border p-4 space-y-6">
          {/* Template Selection */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground">{'模板'}</h4>
            <div className="flex gap-3">
              {TEMPLATE_OPTIONS.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateChange(template.id)}
                  className={`group flex flex-col items-center p-2 border transition-all ${
                    settings.template === template.id
                      ? 'border-blue-700 bg-white shadow-[2px_2px_0px_0px_#1D4ED8]'
                      : 'border-border bg-white hover:bg-muted hover:shadow-sm'
                  }`}
                  title={templateLabels[template.id].description}
                >
                  <div className="w-12 h-16 mb-1.5 flex items-center justify-center">
                    <TemplateThumbnail
                      type={template.id}
                      isActive={settings.template === template.id}
                    />
                  </div>
                  <span
                    className={`font-mono text-[9px] uppercase tracking-wider font-bold ${
                      settings.template === template.id ? 'text-blue-700' : 'text-muted-foreground'
                    }`}
                  >
                    {templateLabels[template.id].name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color Selection - Visible for Modern templates */}
          {(settings.template === 'modern' || settings.template === 'modern-two-column') && (
            <div>
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground">{'强调色'}</h4>
              <div className="flex gap-2">
                {(Object.keys(ACCENT_COLOR_MAP) as AccentColor[]).map((color) => (
                  <button
                    key={color}
                    onClick={() => handleAccentColorChange(color)}
                    className={`flex items-center gap-2 px-3 py-2 border font-mono text-xs transition-all ${
                      settings.accentColor === color
                        ? 'border-blue-700 bg-white shadow-[2px_2px_0px_0px_#1D4ED8]'
                        : 'border-border bg-white hover:bg-muted'
                    }`}
                    title={t(`builder.formatting.accentColors.${color}`)}
                  >
                    <span
                      className="w-4 h-4 border border-border"
                      style={{ backgroundColor: ACCENT_COLOR_MAP[color].primary }}
                    />
                    <span>{t(`builder.formatting.accentColors.${color}`)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Page Size Selection */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground">{'纸张尺寸'}</h4>
            <div className="flex gap-2">
              {(Object.keys(PAGE_SIZE_INFO) as PageSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => handlePageSizeChange(size)}
                  className={`flex-1 px-3 py-2 border font-mono text-xs transition-all ${
                    settings.pageSize === size
                      ? 'border-blue-700 bg-white text-blue-700 shadow-[2px_2px_0px_0px_#1D4ED8]'
                      : 'border-border bg-white text-muted-foreground hover:bg-muted'
                  }`}
                  title={PAGE_SIZE_INFO[size].dimensions}
                >
                  <div className="font-bold">{size === 'A4' ? 'A4' : '美式信纸'}</div>
                  <div className="text-[9px] opacity-70">{PAGE_SIZE_INFO[size].dimensions}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Margins Section */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground">{'页边距（mm）'}</h4>
            <div className="grid grid-cols-2 gap-4">
              <MarginSlider
                label={'上'}
                value={settings.margins.top}
                onChange={(v) => handleMarginChange('top', v)}
              />
              <MarginSlider
                label={'下'}
                value={settings.margins.bottom}
                onChange={(v) => handleMarginChange('bottom', v)}
              />
              <MarginSlider
                label={'左'}
                value={settings.margins.left}
                onChange={(v) => handleMarginChange('left', v)}
              />
              <MarginSlider
                label={'右'}
                value={settings.margins.right}
                onChange={(v) => handleMarginChange('right', v)}
              />
            </div>
          </div>

          {/* Spacing Section */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground">{'间距'}</h4>
            <div className="space-y-3">
              <SpacingSelector
                label={'板块'}
                value={settings.spacing.section}
                onChange={(v) => handleSpacingChange('section', v)}
              />
              <SpacingSelector
                label={'条目'}
                value={settings.spacing.item}
                onChange={(v) => handleSpacingChange('item', v)}
              />
              <SpacingSelector
                label={'行距'}
                value={settings.spacing.lineHeight}
                onChange={(v) => handleSpacingChange('lineHeight', v)}
              />
            </div>
          </div>

          {/* Font Size Section */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground">{'字号'}</h4>
            <div className="space-y-3">
              <SpacingSelector
                label={'正文'}
                value={settings.fontSize.base}
                onChange={(v) => handleFontChange('base', v)}
              />
              <SpacingSelector
                label={'标题'}
                value={settings.fontSize.headerScale}
                onChange={(v) => handleFontChange('headerScale', v)}
              />
              {/* Header Font Family */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs w-16 text-muted-foreground">{'标题字体'}:</span>
                <div className="flex gap-1">
                  {(['serif', 'sans-serif', 'mono'] as HeaderFontFamily[]).map((font) => (
                    <button
                      key={font}
                      onClick={() => handleHeaderFontChange(font)}
                      className={`px-2 py-1 font-mono text-xs border transition-all ${
                        settings.fontSize.headerFont === font
                          ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
                          : 'bg-white text-muted-foreground border-border hover:border-border'
                      }`}
                      style={{
                        fontFamily:
                          font === 'serif'
                            ? 'Georgia, serif'
                            : font === 'mono'
                              ? 'monospace'
                              : 'system-ui, sans-serif',
                      }}
                    >
                      {getFontLabel(font)}
                    </button>
                  ))}
                </div>
              </div>
              {/* Body Font Family */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs w-16 text-muted-foreground">{'正文字体'}:</span>
                <div className="flex gap-1">
                  {(['serif', 'sans-serif', 'mono'] as BodyFontFamily[]).map((font) => (
                    <button
                      key={font}
                      onClick={() => handleBodyFontChange(font)}
                      className={`px-2 py-1 font-mono text-xs border transition-all ${
                        settings.fontSize.bodyFont === font
                          ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
                          : 'bg-white text-muted-foreground border-border hover:border-border'
                      }`}
                      style={{
                        fontFamily:
                          font === 'serif'
                            ? 'Georgia, serif'
                            : font === 'mono'
                              ? 'monospace'
                              : 'system-ui, sans-serif',
                      }}
                    >
                      {getFontLabel(font)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Options Section */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground">{'选项'}</h4>
            <div className="space-y-3">
              {/* Compact Mode Toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <button
                  onClick={handleCompactModeToggle}
                  className={`relative w-10 h-5 border-2 transition-all ${
                    settings.compactMode ? 'bg-blue-700 border-blue-700' : 'bg-white border-border'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-3.5 h-3.5 bg-white border transition-all ${
                      settings.compactMode ? 'left-5 border-blue-700' : 'left-0.5 border-border'
                    }`}
                  />
                </button>
                <span className="font-mono text-xs text-muted-foreground">{'紧凑模式'}</span>
              </label>

              {/* Show Contact Icons Toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <button
                  onClick={handleShowContactIconsToggle}
                  className={`relative w-10 h-5 border-2 transition-all ${
                    settings.showContactIcons
                      ? 'bg-blue-700 border-blue-700'
                      : 'bg-white border-border'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-3.5 h-3.5 bg-white border transition-all ${
                      settings.showContactIcons
                        ? 'left-5 border-blue-700'
                        : 'left-0.5 border-border'
                    }`}
                  />
                </button>
                <span className="font-mono text-xs text-muted-foreground">{'联系方式图标'}</span>
              </label>
            </div>
          </div>

          {/* Reset Button */}
          <div className="pt-2 border-t border-paper-tint space-y-3">
            <div>
              <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                {'生效预览'}
              </h4>
              <div className="font-mono text-[10px] text-muted-foreground space-y-1">
                <div title={'页边距（mm）'}>
                  {t('builder.formatting.effectiveMargins', {
                    top: settings.margins.top,
                    bottom: settings.margins.bottom,
                    left: settings.margins.left,
                    right: settings.margins.right,
                  })}
                </div>
                <div>
                  {'板块间距'}: {formatRem(sectionGapRem)}
                </div>
                <div>
                  {'条目间距'}: {formatRem(itemGapRem)}
                </div>
                <div>
                  {'行高'}: {lineHeightValue.toFixed(2)}
                </div>
                <div>
                  {'正文字号'}: {FONT_SIZE_MAP[settings.fontSize.base]}
                </div>
                <div>
                  {'标题缩放'}: {HEADER_SCALE_MAP[settings.fontSize.headerScale]}x
                </div>
                <div>
                  {'标题字体'}: {getFontLabel(settings.fontSize.headerFont)}
                </div>
                <div>
                  {'正文字体'}: {getFontLabel(settings.fontSize.bodyFont)}
                </div>
              </div>
              {settings.compactMode && (
                <div className="font-mono text-[10px] text-muted-foreground mt-2">
                  {'紧凑模式会收紧间距与行高；页边距与正文字号保持不变。'}
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleReset} className="w-full">
              <RotateCcw className="w-3 h-3" />
              {'恢复默认设置'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Margin Slider Component
 *
 * Range input for margin values (5-25mm)
 */
interface MarginSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

const MarginSlider: React.FC<MarginSliderProps> = ({ label, value, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs w-12 text-muted-foreground">{label}:</span>
      <input
        type="range"
        min={5}
        max={25}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="flex-1 h-1 bg-muted  appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-3
                   [&::-webkit-slider-thumb]:h-3
                   [&::-webkit-slider-thumb]:bg-blue-700
                   [&::-webkit-slider-thumb]:border-none
                   [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-moz-range-thumb]:w-3
                   [&::-moz-range-thumb]:h-3
                   [&::-moz-range-thumb]:bg-blue-700
                   [&::-moz-range-thumb]:border-none
                   [&::-moz-range-thumb]:cursor-pointer"
      />
      <span className="font-mono text-xs w-6 text-right text-muted-foreground">{value}</span>
    </div>
  );
};

/**
 * Spacing Selector Component
 *
 * Button group for selecting spacing levels (1-5)
 */
interface SpacingSelectorProps {
  label: string;
  value: SpacingLevel;
  onChange: (value: SpacingLevel) => void;
}

const SpacingSelector: React.FC<SpacingSelectorProps> = ({ label, value, onChange }) => {
  const levels: SpacingLevel[] = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs w-16 text-muted-foreground">{label}:</span>
      <div className="flex gap-1">
        {levels.map((level) => (
          <button
            key={level}
            onClick={() => onChange(level)}
            className={`w-6 h-6 font-mono text-xs border transition-all ${
              value === level
                ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
                : 'bg-white text-muted-foreground border-border hover:border-border'
            }`}
          >
            {level}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FormattingControls;
