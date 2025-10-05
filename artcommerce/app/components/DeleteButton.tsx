import React from 'react';

interface DeleteButtonProps {
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  ariaLabel?: string;
}

const DeleteButton = ({ 
  onClick, 
  disabled = false, 
  size = 'medium',
  ariaLabel = "Delete item"
}: DeleteButtonProps) => {
  const getSize = () => {
    switch (size) {
      case 'small': return { width: '40px', height: '40px' };
      case 'medium': return { width: '50px', height: '50px' };
      case 'large': return { width: '60px', height: '60px' };
      default: return { width: '50px', height: '50px' };
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small': return '10px';
      case 'medium': return '12px';
      case 'large': return '14px';
      default: return '12px';
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small': return '11px';
      case 'medium': return '13px';
      case 'large': return '15px';
      default: return '13px';
    }
  };

  return (
    <button 
      className="delete-button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      style={getSize()}
    >
      <svg viewBox="0 0 448 512" className="svgIcon" style={{ width: getIconSize() }}>
        <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" />
      </svg>
      
      <style jsx>{`
        .delete-button {
          border-radius: 50%;
          background-color: rgb(20, 20, 20);
          border: none;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.164);
          cursor: pointer;
          transition-duration: .3s;
          overflow: hidden;
          position: relative;
        }

        .delete-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          pointer-events: none;
        }

        .svgIcon {
          transition-duration: .3s;
        }

        .svgIcon path {
          fill: white;
        }

        .delete-button:hover {
          width: 140px;
          border-radius: 50px;
          transition-duration: .3s;
          background-color: rgb(255, 69, 69);
          align-items: center;
        }

        .delete-button:hover .svgIcon {
          width: 50px;
          transition-duration: .3s;
          transform: translateY(60%);
        }

        .delete-button::before {
          position: absolute;
          top: -20px;
          content: "Delete";
          color: white;
          transition-duration: .3s;
          font-size: 2px;
        }

        .delete-button:hover::before {
          font-size: ${getFontSize()};
          opacity: 1;
          transform: translateY(30px);
          transition-duration: .3s;
        }

        /* Mobile touch optimizations */
        @media (max-width: 768px) {
          .delete-button:hover {
            width: 120px;
          }
          
          .delete-button:hover .svgIcon {
            width: 40px;
          }
          
          .delete-button:hover::before {
            font-size: 11px;
          }
        }

        /* Small screens */
        @media (max-width: 480px) {
          .delete-button:hover {
            width: 100px;
          }
          
          .delete-button:hover .svgIcon {
            width: 35px;
          }
          
          .delete-button:hover::before {
            font-size: 10px;
          }
        }
      `}</style>
    </button>
  );
};

export default DeleteButton;
