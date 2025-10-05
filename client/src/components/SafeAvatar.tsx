import { useState } from 'react';

interface SafeAvatarProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fallback?: string;
}

export const SafeAvatar = ({ src, alt = 'Avatar', className = '', fallback = '👤' }: SafeAvatarProps) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (!src || hasError) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 rounded-full ${className}`}>
        <span className="text-2xl">{fallback}</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-full">
          <span className="text-2xl">{fallback}</span>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`rounded-full ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onError={handleError}
        onLoad={handleLoad}
        crossOrigin="anonymous"
      />
    </div>
  );
};
