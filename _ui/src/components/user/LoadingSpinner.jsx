import './LoadingSpinner.css';

export const LoadingSpinner = ({ size = 'medium', fullscreen = false }) => {
  const spinnerClass = `loading-spinner ${size} ${fullscreen ? 'fullscreen' : ''}`;
  
  return (
    <div className={spinnerClass}>
      <div className="spinner"></div>
      {fullscreen && <p>Loading...</p>}
    </div>
  );
};

LoadingSpinner.defaultProps = {
  size: 'medium',
  fullscreen: false,
};
