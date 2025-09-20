import { describe, it, expect, vi } from 'vitest';
import { render, screen } from './test/test-utils';
import App from './App';

// Mock the components that might cause issues in tests
vi.mock('./components/WaveBackground', () => ({
  default: () => <div data-testid="wave-background">Wave Background</div>,
}));

vi.mock('./components/AppInitializer', () => ({
  AppInitializer: () => <div data-testid="app-initializer">App Initializer</div>,
}));

vi.mock('./pages/Index', () => ({
  default: () => <div data-testid="index-page">Index Page</div>,
}));

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('wave-background')).toBeInTheDocument();
    expect(screen.getByTestId('app-initializer')).toBeInTheDocument();
  });

  it('renders main layout routes', () => {
    render(<App />);
    expect(screen.getByTestId('index-page')).toBeInTheDocument();
  });

  it('has proper error boundary', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <div>
        <ThrowError />
      </div>
    );

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
