import { GradientSpinner } from './GradientSpinner';

export const SplashScreen = () => {
  return (
    <div className="splash-screen">
      <div className="splash-content">
        <GradientSpinner />
        <h1 className="splash-title">NONMINE</h1>
      </div>
    </div>
  );
};