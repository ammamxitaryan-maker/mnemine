// Enhanced toast notification system
let toastId = 0;

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastOptions {
  duration?: number;
  persistent?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const defaultOptions: Required<ToastOptions> = {
  duration: 3000,
  persistent: false,
  position: 'top-right'
};

const getPositionClasses = (position: ToastOptions['position']) => {
  switch (position) {
    case 'top-left': return 'top-4 left-4';
    case 'top-center': return 'top-4 left-1/2 transform -translate-x-1/2';
    case 'top-right': return 'top-4 right-4';
    case 'bottom-left': return 'bottom-4 left-4';
    case 'bottom-center': return 'bottom-4 left-1/2 transform -translate-x-1/2';
    case 'bottom-right': return 'bottom-4 right-4';
    default: return 'top-4 right-4';
  }
};

const getToastClasses = (type: ToastType) => {
  const baseClasses = 'fixed px-4 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-top duration-300 text-white font-medium';

  switch (type) {
    case 'success': return `${baseClasses} bg-green-600 border border-green-500`;
    case 'error': return `${baseClasses} bg-red-600 border border-red-500`;
    case 'warning': return `${baseClasses} bg-yellow-600 border border-yellow-500`;
    case 'info': return `${baseClasses} bg-blue-600 border border-blue-500`;
    case 'loading': return `${baseClasses} bg-gray-600 border border-gray-500`;
    default: return `${baseClasses} bg-gray-600 border border-gray-500`;
  }
};

const createToast = (message: string, type: ToastType, options: ToastOptions = {}) => {
  const opts = { ...defaultOptions, ...options };
  const id = `toast-${toastId++}`;

  const toast = document.createElement('div');
  toast.id = id;
  toast.className = `${getToastClasses(type)} ${getPositionClasses(opts.position)}`;

  // Add icon based on type
  const icon = getIcon(type);
  toast.innerHTML = `
    <div class="flex items-center space-x-2">
      ${icon}
      <span>${message}</span>
      ${!opts.persistent ? '<button class="ml-2 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">×</button>' : ''}
    </div>
  `;

  document.body.appendChild(toast);

  // Auto remove if not persistent
  if (!opts.persistent && opts.duration > 0) {
    setTimeout(() => {
      dismissToast(id);
    }, opts.duration);
  }

  return id;
};

const getIcon = (type: ToastType): string => {
  switch (type) {
    case 'success': return '<span class="text-green-200">✓</span>';
    case 'error': return '<span class="text-red-200">✕</span>';
    case 'warning': return '<span class="text-yellow-200">⚠</span>';
    case 'info': return '<span class="text-blue-200">ℹ</span>';
    case 'loading': return '<span class="text-gray-200 animate-spin">⟳</span>';
    default: return '<span class="text-gray-200">ℹ</span>';
  }
};

export const showSuccess = (message: string, options?: ToastOptions) => {
  console.log('✅ Success:', message);
  return createToast(message, 'success', options);
};

export const showError = (message: string, options?: ToastOptions) => {
  console.error('❌ Error:', message);
  return createToast(message, 'error', options);
};

export const showWarning = (message: string, options?: ToastOptions) => {
  console.warn('⚠️ Warning:', message);
  return createToast(message, 'warning', options);
};

export const showInfo = (message: string, options?: ToastOptions) => {
  console.log('ℹ️ Info:', message);
  return createToast(message, 'info', options);
};

export const showLoading = (message: string, options?: ToastOptions) => {
  console.log('⏳ Loading:', message);
  return createToast(message, 'loading', { ...options, persistent: true });
};

export const dismissToast = (toastId: string | number) => {
  console.log('🚫 Dismissed toast:', toastId);
  const toast = document.getElementById(String(toastId));
  if (toast) {
    toast.classList.add('animate-out', 'slide-out-to-top');
    setTimeout(() => toast.remove(), 300);
  }
};

export const dismissAllToasts = () => {
  const toasts = document.querySelectorAll('[id^="toast-"]');
  toasts.forEach(toast => {
    toast.classList.add('animate-out', 'slide-out-to-top');
    setTimeout(() => toast.remove(), 300);
  });
};

// Convenience function for API errors
export const showApiError = (error: unknown, fallback = 'An error occurred') => {
  let message = fallback;

  if (error && typeof error === 'object' && 'response' in error) {
    const apiError = error as any;
    message = apiError.response?.data?.error || apiError.message || fallback;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return showError(message);
};
