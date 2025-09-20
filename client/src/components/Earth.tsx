import './Earth.css';

const Earth = () => {
  // Adjusted size to be responsive, scaling with viewport width but with a max size.
  // Also adjusted position to be less intrusive on smaller screens.
  return (
    <div className="earth fixed -right-8 -bottom-8 w-[min(40vw,160px)] h-[min(40vw,160px)] opacity-60 z-0"></div>
  );
};

export default Earth;