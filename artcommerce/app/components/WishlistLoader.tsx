import React from 'react';
import { motion } from 'framer-motion';

const WishlistLoader = ({ size = 'small' }: { size?: 'small' | 'medium' | 'large' }) => {
  const getScale = () => {
    switch (size) {
      case 'small': return 0.3;
      case 'medium': return 0.5;
      case 'large': return 0.7;
      default: return 0.3;
    }
  };

  return (
    <motion.div
      className="wishlist-loader"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.2 }}
      style={{
        '--fill-color': '#000',
        '--shine-color': '#00000033',
        transform: `scale(${getScale()})`,
        width: '100px',
        height: 'auto',
        position: 'relative',
        filter: 'drop-shadow(0 0 10px var(--shine-color))',
      } as React.CSSProperties}
    >
      <svg 
        id="pegtopone" 
        xmlns="http://www.w3.org/2000/svg" 
        xmlnsXlink="http://www.w3.org/1999/xlink" 
        viewBox="0 0 100 100"
        style={{
          position: 'absolute',
          animation: 'flowe-one 1s linear infinite',
        }}
      >
        <defs>
          <filter id="shine-wishlist">
            <feGaussianBlur stdDeviation={3} />
          </filter>
          <mask id="mask-wishlist">
            <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="white" />
          </mask>
          <radialGradient id="gradient-1-wishlist" cx={50} cy={66} fx={50} fy={66} r={30} gradientTransform="translate(0 35) scale(1 0.5)" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="black" stopOpacity="0.3" />
            <stop offset="50%" stopColor="black" stopOpacity="0.1" />
            <stop offset="100%" stopColor="black" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="gradient-2-wishlist" cx={55} cy={20} fx={55} fy={20} r={30} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="white" stopOpacity="0.3" />
            <stop offset="50%" stopColor="white" stopOpacity="0.1" />
            <stop offset="100%" stopColor="white" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="gradient-3-wishlist" cx={85} cy={50} fx={85} fy={50} xlinkHref="#gradient-2-wishlist" />
          <radialGradient id="gradient-4-wishlist" cx={50} cy={58} fx={50} fy={58} r={60} gradientTransform="translate(0 47) scale(1 0.2)" xlinkHref="#gradient-3-wishlist" />
          <linearGradient id="gradient-5-wishlist" x1={50} y1={90} x2={50} y2={10} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="black" stopOpacity="0.2" />
            <stop offset="40%" stopColor="black" stopOpacity={0} />
          </linearGradient>
        </defs>
        <g>
          <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="var(--fill-color)" />
          <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="url(#gradient-1-wishlist)" />
          <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="none" stroke="white" opacity="0.3" strokeWidth={3} filter="url(#shine-wishlist)" mask="url(#mask-wishlist)" />
          <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="url(#gradient-2-wishlist)" />
          <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="url(#gradient-3-wishlist)" />
          <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="url(#gradient-4-wishlist)" />
          <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="url(#gradient-5-wishlist)" />
        </g>
      </svg>
      
      <svg 
        id="pegtoptwo" 
        xmlns="http://www.w3.org/2000/svg" 
        xmlnsXlink="http://www.w3.org/1999/xlink" 
        viewBox="0 0 100 100"
        style={{
          position: 'absolute',
          opacity: 0,
          transform: 'scale(0) translateY(-200px) translateX(-100px)',
          animation: 'flowe-two 1s linear infinite',
          animationDelay: '0.3s',
        }}
      >
        <defs>
          <filter id="shine-wishlist-2">
            <feGaussianBlur stdDeviation={3} />
          </filter>
          <mask id="mask-wishlist-2">
            <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="white" />
          </mask>
          <radialGradient id="gradient-1-wishlist-2" cx={50} cy={66} fx={50} fy={66} r={30} gradientTransform="translate(0 35) scale(1 0.5)" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="black" stopOpacity="0.3" />
            <stop offset="50%" stopColor="black" stopOpacity="0.1" />
            <stop offset="100%" stopColor="black" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="gradient-2-wishlist-2" cx={55} cy={20} fx={55} fy={20} r={30} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="white" stopOpacity="0.3" />
            <stop offset="50%" stopColor="white" stopOpacity="0.1" />
            <stop offset="100%" stopColor="white" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="gradient-3-wishlist-2" cx={85} cy={50} fx={85} fy={50} xlinkHref="#gradient-2-wishlist-2" />
          <radialGradient id="gradient-4-wishlist-2" cx={50} cy={58} fx={50} fy={58} r={60} gradientTransform="translate(0 47) scale(1 0.2)" xlinkHref="#gradient-3-wishlist-2" />
          <linearGradient id="gradient-5-wishlist-2" x1={50} y1={90} x2={50} y2={10} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="black" stopOpacity="0.2" />
            <stop offset="40%" stopColor="black" stopOpacity={0} />
          </linearGradient>
        </defs>
        <g>
          <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="var(--fill-color)" />
          <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="url(#gradient-1-wishlist-2)" />
          <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="none" stroke="white" opacity="0.3" strokeWidth={3} filter="url(#shine-wishlist-2)" mask="url(#mask-wishlist-2)" />
          <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="url(#gradient-2-wishlist-2)" />
          <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="url(#gradient-3-wishlist-2)" />
          <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="url(#gradient-4-wishlist-2)" />
          <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="url(#gradient-5-wishlist-2)" />
        </g>
      </svg>
      
      <svg 
        id="pegtopthree" 
        xmlns="http://www.w3.org/2000/svg" 
        xmlnsXlink="http://www.w3.org/1999/xlink" 
        viewBox="0 0 100 100"
        style={{
          position: 'absolute',
          opacity: 0,
          transform: 'scale(0) translateY(-200px) translateX(100px)',
          animation: 'flowe-three 1s linear infinite',
          animationDelay: '0.6s',
        }}
      >
        <defs>
          <filter id="shine-wishlist-3">
            <feGaussianBlur stdDeviation={3} />
          </filter>
          <mask id="mask-wishlist-3">
            <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="white" />
          </mask>
          <radialGradient id="gradient-1-wishlist-3" cx={50} cy={66} fx={50} fy={66} r={30} gradientTransform="translate(0 35) scale(1 0.5)" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="black" stopOpacity="0.3" />
            <stop offset="50%" stopColor="black" stopOpacity="0.1" />
            <stop offset="100%" stopColor="black" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="gradient-2-wishlist-3" cx={55} cy={20} fx={55} fy={20} r={30} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="white" stopOpacity="0.3" />
            <stop offset="50%" stopColor="white" stopOpacity="0.1" />
            <stop offset="100%" stopColor="white" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="gradient-3-wishlist-3" cx={85} cy={50} fx={85} fy={50} xlinkHref="#gradient-2-wishlist-3" />
          <radialGradient id="gradient-4-wishlist-3" cx={50} cy={58} fx={50} fy={58} r={60} gradientTransform="translate(0 47) scale(1 0.2)" xlinkHref="#gradient-3-wishlist-3" />
          <linearGradient id="gradient-5-wishlist-3" x1={50} y1={90} x2={50} y2={10} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="black" stopOpacity="0.2" />
            <stop offset="40%" stopColor="black" stopOpacity={0} />
          </linearGradient>
        </defs>
        <g>
          <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="var(--fill-color)" />
          <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="url(#gradient-1-wishlist-3)" />
          <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="none" stroke="white" opacity="0.3" strokeWidth={3} filter="url(#shine-wishlist-3)" mask="url(#mask-wishlist-3)" />
          <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="url(#gradient-2-wishlist-3)" />
          <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="url(#gradient-3-wishlist-3)" />
          <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="url(#gradient-4-wishlist-3)" />
          <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="url(#gradient-5-wishlist-3)" />
        </g>
      </svg>

      <style jsx>{`
        @keyframes flowe-one {
          0% {
            transform: scale(0.5) translateY(-200px);
            opacity: 0;
          }
          25% {
            transform: scale(0.75) translateY(-100px);
            opacity: 1;
          }
          50% {
            transform: scale(1) translateY(0px);
            opacity: 1;
          }
          75% {
            transform: scale(0.5) translateY(50px);
            opacity: 1;
          }
          100% {
            transform: scale(0) translateY(100px);
            opacity: 0;
          }
        }

        @keyframes flowe-two {
          0% {
            transform: scale(0.5) rotateZ(-10deg) translateY(-200px) translateX(-100px);
            opacity: 0;
          }
          25% {
            transform: scale(1) rotateZ(-5deg) translateY(-100px) translateX(-50px);
            opacity: 1;
          }
          50% {
            transform: scale(1) rotateZ(0deg) translateY(0px) translateX(-25px);
            opacity: 1;
          }
          75% {
            transform: scale(0.5) rotateZ(5deg) translateY(50px) translateX(0px);
            opacity: 1;
          }
          100% {
            transform: scale(0) rotateZ(10deg) translateY(100px) translateX(25px);
            opacity: 0;
          }
        }

        @keyframes flowe-three {
          0% {
            transform: scale(0.5) rotateZ(10deg) translateY(-200px) translateX(100px);
            opacity: 0;
          }
          25% {
            transform: scale(1) rotateZ(5deg) translateY(-100px) translateX(50px);
            opacity: 1;
          }
          50% {
            transform: scale(1) rotateZ(0deg) translateY(0px) translateX(25px);
            opacity: 1;
          }
          75% {
            transform: scale(0.5) rotateZ(-5deg) translateY(50px) translateX(0px);
            opacity: 1;
          }
          100% {
            transform: scale(0) rotateZ(-10deg) translateY(100px) translateX(-25px);
            opacity: 0;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default WishlistLoader;
