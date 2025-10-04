// Toast implementation using native browser alerts and console
let toastId = 0;

export const showSuccess = (message: string) => {
  console.log('✅ Success:', message);
  
  // Create temporary toast element
  const toast = document.createElement('div');
  toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in slide-in-from-top duration-300';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('animate-out', 'slide-out-to-top');
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
};

export const showError = (message: string) => {
  console.error('❌ Error:', message);
  
  // Create temporary toast element
  const toast = document.createElement('div');
  toast.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in slide-in-from-top duration-300';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('animate-out', 'slide-out-to-top');
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 4000);
};

export const showLoading = (message: string) => {
  console.log('⏳ Loading:', message);
  const id = `loading-toast-${toastId++}`;
  
  const toast = document.createElement('div');
  toast.id = id;
  toast.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in slide-in-from-top duration-300';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  return id;
};

export const dismissToast = (toastId: string | number) => {
  console.log('🚫 Dismissed toast:', toastId);
  const toast = document.getElementById(String(toastId));
  if (toast) {
    toast.classList.add('animate-out', 'slide-out-to-top');
    setTimeout(() => toast.remove(), 300);
  }
};