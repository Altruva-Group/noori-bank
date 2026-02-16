import { useEffect, useState } from 'react';
import './Toast.css';

const ANIMATION_DURATION = 300;
const DEFAULT_DURATION = 3000;

export const Toast = ({ message, type = 'info', duration = DEFAULT_DURATION, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, ANIMATION_DURATION);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`toast ${type} ${isExiting ? 'exit' : ''}`}>
      <div className="toast-content">
        {type === 'success' && <span className="icon">✓</span>}
        {type === 'error' && <span className="icon">✕</span>}
        {type === 'warning' && <span className="icon">⚠</span>}
        {type === 'info' && <span className="icon">ℹ</span>}
        <span className="message">{message}</span>
      </div>
      <button className="close-button" onClick={() => setIsExiting(true)}>
        ✕
      </button>
    </div>
  );
};

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
