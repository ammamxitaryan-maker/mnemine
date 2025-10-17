/**
 * Улучшенные формы для админ панели
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Save
} from 'lucide-react';
import { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  description?: string;
  className?: string;
}

export const FormField = ({
  label,
  name,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  value,
  onChange,
  error,
  description,
  className,
}: FormFieldProps) => {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name} className="text-sm font-medium text-gray-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500',
          error && 'border-red-500 focus:border-red-500'
        )}
      />
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
      {error && (
        <p className="text-xs text-red-400 flex items-center">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
};

interface FormSelectProps {
  label: string;
  name: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  description?: string;
  className?: string;
}

export const FormSelect = ({
  label,
  name,
  options,
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  value,
  onChange,
  error,
  description,
  className,
}: FormSelectProps) => {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name} className="text-sm font-medium text-gray-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </Label>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger
          className={cn(
            'bg-gray-800 border-gray-600 text-white focus:border-purple-500',
            error && 'border-red-500 focus:border-red-500'
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-600">
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className="text-white hover:bg-gray-700 focus:bg-gray-700"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
      {error && (
        <p className="text-xs text-red-400 flex items-center">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
};

interface FormTextareaProps {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  description?: string;
  rows?: number;
  className?: string;
}

export const FormTextarea = ({
  label,
  name,
  placeholder,
  required = false,
  disabled = false,
  value,
  onChange,
  error,
  description,
  rows = 4,
  className,
}: FormTextareaProps) => {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name} className="text-sm font-medium text-gray-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </Label>
      <Textarea
        id={name}
        name={name}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        rows={rows}
        className={cn(
          'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 resize-none',
          error && 'border-red-500 focus:border-red-500'
        )}
      />
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
      {error && (
        <p className="text-xs text-red-400 flex items-center">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
};

interface FormSwitchProps {
  label: string;
  name: string;
  description?: string;
  disabled?: boolean;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  error?: string;
  className?: string;
}

export const FormSwitch = ({
  label,
  name,
  description,
  disabled = false,
  checked = false,
  onChange,
  error,
  className,
}: FormSwitchProps) => {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center space-x-2">
        <Switch
          id={name}
          name={name}
          disabled={disabled}
          checked={checked}
          onCheckedChange={onChange}
        />
        <Label htmlFor={name} className="text-sm font-medium text-gray-300">
          {label}
        </Label>
      </div>
      {description && (
        <p className="text-xs text-gray-500 ml-6">{description}</p>
      )}
      {error && (
        <p className="text-xs text-red-400 flex items-center ml-6">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
};

interface FormCheckboxProps {
  label: string;
  name: string;
  description?: string;
  disabled?: boolean;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  error?: string;
  className?: string;
}

export const FormCheckbox = ({
  label,
  name,
  description,
  disabled = false,
  checked = false,
  onChange,
  error,
  className,
}: FormCheckboxProps) => {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center space-x-2">
        <Checkbox
          id={name}
          name={name}
          disabled={disabled}
          checked={checked}
          onCheckedChange={onChange}
        />
        <Label htmlFor={name} className="text-sm font-medium text-gray-300">
          {label}
        </Label>
      </div>
      {description && (
        <p className="text-xs text-gray-500 ml-6">{description}</p>
      )}
      {error && (
        <p className="text-xs text-red-400 flex items-center ml-6">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
};

interface AdminFormProps {
  title?: string;
  description?: string;
  children: ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  onReset?: () => void;
  loading?: boolean;
  error?: string;
  success?: string;
  className?: string;
  actions?: ReactNode;
}

export const AdminForm = ({
  title,
  description,
  children,
  onSubmit,
  onReset,
  loading = false,
  error,
  success,
  className,
  actions,
}: AdminFormProps) => {
  return (
    <Card className={cn('bg-gray-900 border-gray-700', className)}>
      {(title || description) && (
        <CardHeader>
          <CardTitle className="text-xl text-white">{title}</CardTitle>
          {description && (
            <CardDescription className="text-gray-400">
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          {error && (
            <Alert className="border-red-500 bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-400">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {children}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-700">
            <div className="flex items-center gap-2">
              {actions}
            </div>
            <div className="flex items-center gap-2">
              {onReset && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onReset}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
