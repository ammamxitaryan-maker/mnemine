"use client";

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useResponsiveDesign } from '@/hooks/useResponsiveDesign';

interface ResponsiveFormProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full'
};

const spacingClasses = {
  none: '',
  sm: 'space-y-2',
  md: 'space-y-3 sm:space-y-4',
  lg: 'space-y-4 sm:space-y-6',
  xl: 'space-y-6 sm:space-y-8'
};

export const ResponsiveForm = ({
  children,
  className,
  maxWidth = 'md',
  spacing = 'md'
}: ResponsiveFormProps) => {
  return (
    <form
      className={cn(
        'w-full',
        maxWidthClasses[maxWidth],
        spacingClasses[spacing],
        className
      )}
    >
      {children}
    </form>
  );
};

interface ResponsiveFormFieldProps {
  children: ReactNode;
  className?: string;
  spacing?: 'none' | 'sm' | 'md' | 'lg';
}

const fieldSpacingClasses = {
  none: '',
  sm: 'space-y-1',
  md: 'space-y-2',
  lg: 'space-y-3'
};

export const ResponsiveFormField = ({
  children,
  className,
  spacing = 'md'
}: ResponsiveFormFieldProps) => {
  return (
    <div className={cn(fieldSpacingClasses[spacing], className)}>
      {children}
    </div>
  );
};

interface ResponsiveFormGroupProps {
  children: ReactNode;
  className?: string;
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  gap?: 'sm' | 'md' | 'lg';
}

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-3 sm:gap-4',
  lg: 'gap-4 sm:gap-6'
};

export const ResponsiveFormGroup = ({
  children,
  className,
  columns = { mobile: 1, tablet: 1, desktop: 1 },
  gap = 'md'
}: ResponsiveFormGroupProps) => {
  const { isMobile, isTablet } = useResponsiveDesign();
  
  const gridCols = isMobile ? columns.mobile : isTablet ? columns.tablet : columns.desktop;
  
  return (
    <div
      className={cn(
        'grid',
        `grid-cols-${gridCols}`,
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
};

interface ResponsiveFormActionsProps {
  children: ReactNode;
  className?: string;
  layout?: 'stack' | 'inline';
  spacing?: 'sm' | 'md' | 'lg';
}

const layoutClasses = {
  stack: 'flex flex-col space-y-2 sm:space-y-3',
  inline: 'flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 sm:justify-end'
};

const actionSpacingClasses = {
  sm: 'space-y-2 sm:space-y-0 sm:space-x-2',
  md: 'space-y-2 sm:space-y-0 sm:space-x-3',
  lg: 'space-y-3 sm:space-y-0 sm:space-x-4'
};

export const ResponsiveFormActions = ({
  children,
  className,
  layout = 'stack',
  spacing = 'md'
}: ResponsiveFormActionsProps) => {
  return (
    <div
      className={cn(
        layout === 'stack' ? layoutClasses.stack : actionSpacingClasses[spacing],
        className
      )}
    >
      {children}
    </div>
  );
};

interface ResponsiveFormLabelProps {
  children: ReactNode;
  htmlFor?: string;
  className?: string;
  required?: boolean;
}

export const ResponsiveFormLabel = ({
  children,
  htmlFor,
  className,
  required = false
}: ResponsiveFormLabelProps) => {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        'block text-sm font-medium text-gray-300 mb-1 sm:mb-2',
        className
      )}
    >
      {children}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
  );
};

interface ResponsiveFormInputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
}

export const ResponsiveFormInput = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  className,
  id,
  required = false,
  disabled = false
}: ResponsiveFormInputProps) => {
  return (
    <input
      type={type}
      id={id}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className={cn(
        'w-full rounded-md border border-gray-600 bg-gray-800 text-white placeholder-gray-400',
        'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        // Mobile optimizations
        'h-12 px-4 py-3 text-base sm:h-10 sm:px-3 sm:py-2 sm:text-sm',
        // Prevent zoom on iOS
        'text-base sm:text-sm',
        className
      )}
    />
  );
};

interface ResponsiveFormTextareaProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
}

export const ResponsiveFormTextarea = ({
  placeholder,
  value,
  onChange,
  className,
  id,
  required = false,
  disabled = false,
  rows = 3
}: ResponsiveFormTextareaProps) => {
  return (
    <textarea
      id={id}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      rows={rows}
      className={cn(
        'w-full rounded-md border border-gray-600 bg-gray-800 text-white placeholder-gray-400',
        'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent',
        'disabled:opacity-50 disabled:cursor-not-allowed resize-vertical',
        // Mobile optimizations
        'px-4 py-3 text-base sm:px-3 sm:py-2 sm:text-sm',
        // Prevent zoom on iOS
        'text-base sm:text-sm',
        className
      )}
    />
  );
};

interface ResponsiveFormSelectProps {
  children: ReactNode;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
}

export const ResponsiveFormSelect = ({
  children,
  value,
  onChange,
  className,
  id,
  required = false,
  disabled = false
}: ResponsiveFormSelectProps) => {
  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className={cn(
        'w-full rounded-md border border-gray-600 bg-gray-800 text-white',
        'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        // Mobile optimizations
        'h-12 px-4 py-3 text-base sm:h-10 sm:px-3 sm:py-2 sm:text-sm',
        // Prevent zoom on iOS
        'text-base sm:text-sm',
        className
      )}
    >
      {children}
    </select>
  );
};

interface ResponsiveFormButtonProps {
  children: ReactNode;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

const buttonVariantClasses = {
  primary: 'bg-purple-600 hover:bg-purple-700 text-white',
  secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
  outline: 'border border-gray-600 hover:bg-gray-800 text-gray-300',
  ghost: 'hover:bg-gray-800 text-gray-300',
  destructive: 'bg-red-600 hover:bg-red-700 text-white'
};

const buttonSizeClasses = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm sm:h-10 sm:px-4 sm:text-sm',
  lg: 'h-12 px-6 text-base sm:h-11 sm:px-6 sm:text-sm'
};

export const ResponsiveFormButton = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className,
  disabled = false,
  loading = false,
  onClick
}: ResponsiveFormButtonProps) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        buttonVariantClasses[variant],
        buttonSizeClasses[size],
        className
      )}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
};
