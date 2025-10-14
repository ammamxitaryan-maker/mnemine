import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="page-container flex items-center justify-center bg-gray-900 text-white">
      <div className="page-content w-full max-w-md mx-auto">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4 text-destructive">404</h1>
          <p className="text-xl text-gray-400 mb-8">Oops! Page not found</p>
          <Link to="/">
            <Button className="bg-primary hover:bg-primary/90 text-base py-5 px-8">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;