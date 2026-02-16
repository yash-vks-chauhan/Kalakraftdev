import React from 'react';
import Link from 'next/link';

const PearlButton = ({ href = "/products", children = "Discover All Pieces" }: { href?: string, children?: React.ReactNode }) => {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <button className="pearl-button">
        <div className="wrap">
          <p>
            <span>✧</span>
            <span>✦</span>
            {children}
          </p>
        </div>
        
        <style jsx>{`
          .pearl-button {
            --white: #ffe7ff;
            --bg: #080808;
            --radius: 100px;
            outline: none;
            cursor: pointer;
            border: 0;
            position: relative;
            border-radius: var(--radius);
            background-color: var(--bg);
            transition: all 0.2s ease;
            box-shadow:
              inset 0 0.3rem 0.9rem rgba(255, 255, 255, 0.3),
              inset 0 -0.1rem 0.3rem rgba(0, 0, 0, 0.7),
              inset 0 -0.4rem 0.9rem rgba(255, 255, 255, 0.5),
              0 3rem 3rem rgba(0, 0, 0, 0.3),
              0 1rem 1rem -0.6rem rgba(0, 0, 0, 0.8);
          }
          
          .pearl-button .wrap {
            font-size: 20px;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.7);
            padding: 24px 36px;
            border-radius: inherit;
            position: relative;
            overflow: hidden;
          }
          
          .pearl-button .wrap p span:nth-child(2) {
            display: none;
          }
          
          .pearl-button:hover .wrap p span:nth-child(1) {
            display: none;
          }
          
          .pearl-button:hover .wrap p span:nth-child(2) {
            display: inline-block;
          }
          
          .pearl-button .wrap p {
            display: flex;
            align-items: center;
            gap: 12px;
            margin: 0;
            transition: all 0.2s ease;
            transform: translateY(2%);
            mask-image: linear-gradient(to bottom, white 40%, transparent);
          }
          
          .pearl-button .wrap::before,
          .pearl-button .wrap::after {
            content: "";
            position: absolute;
            transition: all 0.3s ease;
          }
          
          .pearl-button .wrap::before {
            left: -15%;
            right: -15%;
            bottom: 25%;
            top: -100%;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.12);
          }
          
          .pearl-button .wrap::after {
            left: 6%;
            right: 6%;
            top: 12%;
            bottom: 40%;
            border-radius: 22px 22px 0 0;
            box-shadow: inset 0 10px 8px -10px rgba(255, 255, 255, 0.8);
            background: linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.3) 0%,
              rgba(0, 0, 0, 0) 50%,
              rgba(0, 0, 0, 0) 100%
            );
          }
          
          .pearl-button:hover {
            box-shadow:
              inset 0 0.3rem 0.5rem rgba(255, 255, 255, 0.4),
              inset 0 -0.1rem 0.3rem rgba(0, 0, 0, 0.7),
              inset 0 -0.4rem 0.9rem rgba(255, 255, 255, 0.7),
              0 3rem 3rem rgba(0, 0, 0, 0.3),
              0 1rem 1rem -0.6rem rgba(0, 0, 0, 0.8);
          }
          
          .pearl-button:hover .wrap::before {
            transform: translateY(-5%);
          }
          
          .pearl-button:hover .wrap::after {
            opacity: 0.4;
            transform: translateY(5%);
          }
          
          .pearl-button:hover .wrap p {
            transform: translateY(-4%);
          }
          
          .pearl-button:active {
            transform: translateY(4px);
            box-shadow:
              inset 0 0.3rem 0.5rem rgba(255, 255, 255, 0.5),
              inset 0 -0.1rem 0.3rem rgba(0, 0, 0, 0.8),
              inset 0 -0.4rem 0.9rem rgba(255, 255, 255, 0.4),
              0 3rem 3rem rgba(0, 0, 0, 0.3),
              0 1rem 1rem -0.6rem rgba(0, 0, 0, 0.8);
          }

          /* Mobile responsive adjustments */
          @media (max-width: 768px) {
            .pearl-button {
              /* Ensure button is always visible on mobile */
              position: relative;
              z-index: 10;
              min-width: 200px;
            }
            
            .pearl-button .wrap {
              font-size: 18px;
              padding: 20px 30px;
            }
          }

          @media (max-width: 480px) {
            .pearl-button {
              /* Ensure button is always visible on small screens */
              position: relative;
              z-index: 10;
              min-width: 180px;
            }
            
            .pearl-button .wrap {
              font-size: 16px;
              padding: 18px 24px;
            }
          }
          
          /* Ensure button works with touch devices */
          @media (hover: none) and (pointer: coarse) {
            .pearl-button:hover {
              /* Reset hover effects for touch devices */
              box-shadow:
                inset 0 0.3rem 0.9rem rgba(255, 255, 255, 0.3),
                inset 0 -0.1rem 0.3rem rgba(0, 0, 0, 0.7),
                inset 0 -0.4rem 0.9rem rgba(255, 255, 255, 0.5),
                0 3rem 3rem rgba(0, 0, 0, 0.3),
                0 1rem 1rem -0.6rem rgba(0, 0, 0, 0.8);
            }
            
            .pearl-button:active {
              /* Enhanced active state for touch */
              transform: translateY(2px);
              box-shadow:
                inset 0 0.3rem 0.5rem rgba(255, 255, 255, 0.6),
                inset 0 -0.1rem 0.3rem rgba(0, 0, 0, 0.9),
                inset 0 -0.4rem 0.9rem rgba(255, 255, 255, 0.4),
                0 2rem 2rem rgba(0, 0, 0, 0.4),
                0 0.5rem 0.5rem -0.3rem rgba(0, 0, 0, 0.9);
            }
          }
        `}</style>
      </button>
    </Link>
  );
};

export default PearlButton;
