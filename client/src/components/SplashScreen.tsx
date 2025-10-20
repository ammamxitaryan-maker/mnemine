import { LoadingAnimation } from './LoadingAnimation';

export const SplashScreen = () => {
  return (
    <div className="splash-screen">
      <LoadingAnimation
        duration={4000}
        onComplete={() => {
          // Animation completed, app is ready
          console.log('Loading animation completed - app is ready');
        }}
      />
    </div>
  );
};