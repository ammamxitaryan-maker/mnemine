"use client";

import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface TemplateInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TemplateInput = forwardRef<HTMLInputElement, TemplateInputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "input-field",
            error && "border-destructive",
            className
          )}
          {...props}
        />
        {error && (
          <span className="text-sm text-destructive">
            {error}
          </span>
        )}
        {helperText && !error && (
          <span className="text-sm text-muted-foreground">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

TemplateInput.displayName = "TemplateInput";
