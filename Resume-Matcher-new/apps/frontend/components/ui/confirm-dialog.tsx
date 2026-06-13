'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './dialog';
import { Button } from './button';
import { AlertTriangle, CheckCircle2, HelpCircle, AlertCircle } from 'lucide-react';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  errorMessage?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  variant?: 'danger' | 'warning' | 'success' | 'default';
  closeOnConfirm?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  showCancelButton?: boolean;
}

const variantConfig = {
  danger: {
    icon: AlertCircle,
    iconClass: 'text-destructive bg-destructive/10',
    buttonVariant: 'destructive' as const,
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-warning bg-warning/10',
    buttonVariant: 'warning' as const,
  },
  success: {
    icon: CheckCircle2,
    iconClass: 'text-success bg-success/10',
    buttonVariant: 'success' as const,
  },
  default: {
    icon: HelpCircle,
    iconClass: 'text-primary bg-primary/10',
    buttonVariant: 'default' as const,
  },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  errorMessage,
  confirmLabel,
  cancelLabel,
  confirmDisabled = false,
  variant = 'default',
  closeOnConfirm = true,
  onConfirm,
  onCancel,
  showCancelButton = true,
}) => {
  const finalConfirmLabel = confirmLabel ?? '确认';
  const finalCancelLabel = cancelLabel ?? '取消';
  const config = variantConfig[variant];
  const IconComponent = config.icon;

  const handleConfirm = () => {
    if (confirmDisabled) return;
    onConfirm();
    if (closeOnConfirm) {
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${config.iconClass}`}
            >
              <IconComponent className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        {errorMessage && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}
        <DialogFooter className="flex-row justify-end gap-3">
          {showCancelButton && (
            <Button variant="outline" onClick={handleCancel}>
              {finalCancelLabel}
            </Button>
          )}
          <Button variant={config.buttonVariant} onClick={handleConfirm} disabled={confirmDisabled}>
            {finalConfirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
