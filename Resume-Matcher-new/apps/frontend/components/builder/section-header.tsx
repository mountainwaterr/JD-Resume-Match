'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ChevronUp, ChevronDown, Trash2, Eye, EyeOff, Pencil, Check, X } from 'lucide-react';
import type { SectionMeta } from '@/components/dashboard/resume-component';
import { t } from '@/lib/i18n/t-shim';

interface SectionHeaderProps {
  section: SectionMeta;
  onRename: (newName: string) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleVisibility: () => void;
  isFirst: boolean;
  isLast: boolean;
  canDelete: boolean;
  children?: React.ReactNode;
}

/**
 * SectionHeader Component
 *
 * Provides controls for section management:
 * - Editable display name
 * - Move up/down buttons for reordering
 * - Delete button with confirmation
 * - Visibility toggle
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  section,
  onRename,
  onDelete,
  onMoveUp,
  onMoveDown,
  onToggleVisibility,
  isFirst,
  isLast,
  canDelete,
  children,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(section.displayName);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleStartEdit = () => {
    setEditedName(section.displayName);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editedName.trim()) {
      onRename(editedName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedName(section.displayName);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleDeleteClick = () => {
    if (section.isDefault) {
      // For default sections, just toggle visibility
      onToggleVisibility();
    } else {
      // For custom sections, show confirmation
      setShowDeleteConfirm(true);
    }
  };

  const isPersonalInfo = section.id === 'personalInfo';
  const isHidden = !section.isVisible;

  return (
    <div
      className={`space-y-0 border p-6 bg-white shadow-md ${
        isHidden ? 'border-dashed border-border opacity-60' : 'border-border'
      }`}
    >
      {/* Section Header */}
      <div className="flex justify-between items-center border-b border-border pb-2 mb-4">
        {/* Section Name (editable) */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-8 w-48  border-border font-serif text-lg font-bold"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-700 hover:text-green-800 hover:bg-green-50"
                onClick={handleSaveEdit}
                aria-label={'保存'}
                title={'保存'}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-muted-foreground hover:bg-muted"
                onClick={handleCancelEdit}
                aria-label={'取消'}
                title={'取消'}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <>
              <h3 className="font-serif text-xl font-bold">{section.displayName}</h3>
              {!isPersonalInfo && (
                <Button
                  variant="ghost"
                  size="icon"
                  // Visible 24×24 (matches the small inline pencil aesthetic
                  // next to the section title), but the touch area is
                  // extended to 44×44 via -inset-[10px] to meet WCAG 2.5.8.
                  // The default Button overlay (-inset-1.5) only gives 36×36
                  // for h-6 buttons; this override adds 4 more px per side.
                  className="h-6 w-6 text-muted-foreground hover:text-muted-foreground before:-inset-[10px]"
                  onClick={handleStartEdit}
                  aria-label={'重命名板块'}
                  title={'重命名板块'}
                >
                  <Pencil className="w-3 h-3" />
                </Button>
              )}
              {!section.isDefault && (
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 border border-paper-tint">
                  {'自定义'}
                </span>
              )}
              {isHidden && (
                <span className="font-mono text-[10px] uppercase tracking-wider text-orange-600 bg-white px-1.5 py-0.5 border border-orange-500">
                  {'PDF 中隐藏'}
                </span>
              )}
            </>
          )}
        </div>

        {/* Section Controls */}
        <div className="flex items-center gap-1">
          {/* Visibility Toggle. The parent container already applies
              opacity-60 when hidden (line 91), which carries the visual
              "faded" cue for the hidden state. A conditional text color
              here would be redundant — just use steel-grey. */}
          {!isPersonalInfo && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={onToggleVisibility}
              aria-label={section.isVisible ? '隐藏板块' : '显示板块'}
              aria-pressed={!section.isVisible}
              title={section.isVisible ? '隐藏板块' : '显示板块'}
            >
              {section.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
          )}

          {/* Move Up */}
          {!isPersonalInfo && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-muted-foreground disabled:opacity-30"
              onClick={onMoveUp}
              disabled={isFirst}
              aria-label={'上移'}
              title={'上移'}
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          )}

          {/* Move Down */}
          {!isPersonalInfo && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-muted-foreground disabled:opacity-30"
              onClick={onMoveDown}
              disabled={isLast}
              aria-label={'下移'}
              title={'下移'}
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          )}

          {/* Delete / Hide */}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDeleteClick}
              aria-label={
                section.isDefault ? (section.isVisible ? '隐藏板块' : '显示板块') : '删除板块'
              }
              title={section.isDefault ? (section.isVisible ? '隐藏板块' : '显示板块') : '删除板块'}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Section Content */}
      {children}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={'删除板块'}
        description={t('builder.sectionHeader.deleteDescription', { name: section.displayName })}
        confirmLabel={'删除'}
        cancelLabel={'取消'}
        variant="danger"
        onConfirm={onDelete}
      />
    </div>
  );
};
