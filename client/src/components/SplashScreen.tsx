import { LoadingAnimation } from './LoadingAnimation';

export const SplashScreen = () => {
  return (
    <div className="splash-screen">
      <LoadingAnimation
        duration={5000}
        onComplete={() => {
          console.log('Loading animation completed - app is ready');
        }}
      />
    </div>
  );
};