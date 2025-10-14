export const formatExpirationDate = (isoDateString: string): string => {
  const date = new Date(isoDateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getRemainingTime = (isoDateString: string): { days: number; hours: number; minutes: number; seconds: number; totalSeconds: number } => {
  const now = new Date();
  const expirationDate = new Date(isoDateString);
  const diff = expirationDate.getTime() - now.getTime(); // Difference in milliseconds

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return { days, hours, minutes, seconds, totalSeconds };
};