import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppWithLoading } from "./components/AppWithLoading"; // Import the app with loading wrapper
import { LoadingProvider } from "./contexts/LoadingContext"; // Import loading context

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LoadingProvider>
          <Sonner />
          <AppWithLoading />
        </LoadingProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;