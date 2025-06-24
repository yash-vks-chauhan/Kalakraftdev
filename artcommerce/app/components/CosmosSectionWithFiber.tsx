import React, { useRef, useEffect, useState } from 'react';

// Enhanced cosmos-style animation keyframes with center flow transition
const cosmosStyleAnimation = `
@keyframes stackEntrance {
  0% {
    transform: translateX(var(--entrance-x)) translateY(var(--entrance-y)) 
               translateZ(-800px) rotateX(120deg) rotateY(var(--entrance-rotate)) 
               rotateZ(45deg) scale(0.2);
    opacity: 0;
  }
  40% {
    transform: translateX(calc(var(--entrance-x) * 0.6)) translateY(calc(var(--entrance-y) * 0.6)) 
               translateZ(-400px) rotateX(90deg) rotateY(calc(var(--entrance-rotate) * 0.6)) 
               rotateZ(20deg) scale(0.5);
    opacity: 0.3;
  }
  70% {
    transform: translateX(calc(var(--entrance-x) * 0.2)) translateY(calc(var(--entrance-y) * 0.2)) 
               translateZ(-100px) rotateX(50deg) rotateY(calc(var(--entrance-rotate) * 0.2)) 
               rotateZ(5deg) scale(0.8);
    opacity: 0.7;
  }
  100% {
    transform: translateX(var(--stack-x)) translateY(var(--stack-y)) 
               translateZ(var(--stack-z)) rotateX(var(--stack-tilt)) rotateY(0deg) 
               rotateZ(var(--stack-rotate)) scale(1);
    opacity: var(--stack-opacity);
  }
}

@keyframes stackFloat {
  0%, 100% {
    transform: translateX(var(--stack-x)) translateY(var(--stack-y)) 
               translateZ(var(--stack-z)) rotateX(var(--stack-tilt)) rotateY(0deg) 
               rotateZ(var(--stack-rotate));
  }
  33% {
    transform: translateX(calc(var(--stack-x) + 3px)) translateY(calc(var(--stack-y) - 4px)) 
               translateZ(calc(var(--stack-z) + 8px)) rotateX(calc(var(--stack-tilt) - 2deg)) rotateY(1deg) 
               rotateZ(calc(var(--stack-rotate) + 1deg));
  }
  66% {
    transform: translateX(calc(var(--stack-x) - 2px)) translateY(calc(var(--stack-y) - 6px)) 
               translateZ(calc(var(--stack-z) + 12px)) rotateX(calc(var(--stack-tilt) + 2deg)) rotateY(-0.5deg) 
               rotateZ(calc(var(--stack-rotate) - 0.5deg));
  }
}

@keyframes moveStackForward {
  0% {
    transform: translateX(var(--stack-x)) translateY(var(--stack-y)) 
               translateZ(var(--stack-z)) rotateX(var(--stack-tilt)) rotateY(0deg) 
               rotateZ(var(--stack-rotate)) scale(1);
  }
  50% {
    transform: translateX(calc(var(--stack-x) * 0.8)) translateY(calc(var(--stack-y) * 0.8)) 
               translateZ(calc(var(--stack-z) + 100px)) rotateX(calc(var(--stack-tilt) * 0.7)) rotateY(0deg) 
               rotateZ(calc(var(--stack-rotate) * 0.8)) scale(1.1);
  }
  100% {
    transform: translateX(var(--stack-x)) translateY(var(--stack-y)) 
               translateZ(var(--stack-z)) rotateX(var(--stack-tilt)) rotateY(0deg) 
               rotateZ(var(--stack-rotate)) scale(1);
  }
}

@keyframes flowToCenter {
  0% {
    transform: translateX(var(--stack-x)) translateY(var(--stack-y)) 
               translateZ(var(--stack-z)) rotateX(var(--stack-tilt)) rotateY(0deg) 
               rotateZ(var(--stack-rotate)) scale(1);
    opacity: var(--stack-opacity);
  }
  20% {
    transform: translateX(calc(var(--stack-x) * 0.9)) translateY(calc(var(--stack-y) * 0.9)) 
               translateZ(calc(var(--stack-z) + 50px)) rotateX(calc(var(--stack-tilt) * 0.8)) rotateY(0deg) 
               rotateZ(calc(var(--stack-rotate) * 0.9)) scale(1.05);
    opacity: var(--stack-opacity);
  }
  50% {
    transform: translateX(var(--flow-center-x)) translateY(var(--flow-center-y)) 
               translateZ(300px) rotateX(-10deg) rotateY(0deg) 
               rotateZ(0deg) scale(1.3);
    opacity: 1;
  }
  80% {
    transform: translateX(var(--flow-center-x)) translateY(var(--flow-center-y)) 
               translateZ(350px) rotateX(-5deg) rotateY(0deg) 
               rotateZ(0deg) scale(1.4);
    opacity: 1;
  }
  100% {
    transform: translateX(var(--stack-x)) translateY(var(--stack-y)) 
               translateZ(var(--stack-z)) rotateX(var(--stack-tilt)) rotateY(0deg) 
               rotateZ(var(--stack-rotate)) scale(1);
    opacity: var(--stack-opacity);
  }
}

@keyframes titleGlow {
  0%, 100% { 
    text-shadow: 0 0 20px rgba(255,255,255,0.1), 0 10px 30px rgba(0,0,0,0.4); 
  }
  50% { 
    text-shadow: 0 0 30px rgba(255,255,255,0.2), 0 0 50px rgba(255,255,255,0.1), 0 10px 30px rgba(0,0,0,0.4); 
  }
}

@keyframes fadeInScale3D {
  from {
    opacity: 0;
    transform: scale(0.8) translateZ(-100px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateZ(0);
  }
}

.stack-container:hover .stack-card {
  animation-play-state: paused;
}

.stack-card:hover {
  transform: translateX(var(--stack-x)) translateY(calc(var(--stack-y) - 20px)) 
             translateZ(calc(var(--stack-z) + 40px)) rotateX(calc(var(--stack-tilt) - 15deg)) rotateY(5deg) 
             rotateZ(calc(var(--stack-rotate) + 3deg)) scale(1.08) !important;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  z-index: 1000 !important;
}

.flow-active .stack-card:first-child {
  animation: flowToCenter 6s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
}

.flow-active .stack-card:not(:first-child) {
  animation: moveStackForward 6s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
}
`;

interface CosmosSectionProps {
  imageUrls?: string[];
}

export default function CosmosSection({ imageUrls = [] }: CosmosSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [isFlowing, setIsFlowing] = useState(false);

  // Default placeholder images
  const defaultImages = [
    'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1433162653888-a571db5ccccf?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1516298773066-c48f8e9bd92b?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1544568100-847a948585b9?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1518549268-1f2d4a1e87c2?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1440342359743-84fcb8c21f21?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1464822759844-d150ad6b5322?w=400&h=500&fit=crop'
  ];

  useEffect(() => {
    setImages(imageUrls.length > 0 ? imageUrls : defaultImages);

    // Trigger flowing animation periodically
    const flowInterval = setInterval(() => {
      setIsFlowing(true);
      setTimeout(() => setIsFlowing(false), 6000);
    }, 12000);

    return () => clearInterval(flowInterval);
  }, [imageUrls]);

  // Create stack configurations - each stack has multiple cards
  const createStacks = () => {
    const stacks = [
      // Left side stacks
      { 
        x: 15, y: 25, rotation: -8, cards: 5,
        entranceX: -600, entranceY: -300, entranceRotate: -45,
        flowCenterX: 200, flowCenterY: -50 // Flow from left to right-center
      },
      { 
        x: 12, y: 70, rotation: 12, cards: 4,
        entranceX: -700, entranceY: 200, entranceRotate: 30,
        flowCenterX: 150, flowCenterY: 80 // Flow from left to center-right
      },
      
      // Right side stacks
      { 
        x: 85, y: 30, rotation: 6, cards: 5,
        entranceX: 600, entranceY: -250, entranceRotate: 45,
        flowCenterX: -200, flowCenterY: -30 // Flow from right to left-center
      },
      { 
        x: 88, y: 75, rotation: -10, cards: 4,
        entranceX: 650, entranceY: 300, entranceRotate: -30,
        flowCenterX: -150, flowCenterY: 60 // Flow from right to center-left
      },
      
      // Top stacks
      { 
        x: 35, y: 15, rotation: 4, cards: 3,
        entranceX: -200, entranceY: -500, entranceRotate: 15,
        flowCenterX: 50, flowCenterY: 100 // Flow from top-left to center
      },
      { 
        x: 65, y: 12, rotation: -6, cards: 4,
        entranceX: 250, entranceY: -550, entranceRotate: -20,
        flowCenterX: -50, flowCenterY: 120 // Flow from top-right to center
      }
    ];

    return stacks;
  };

  const stacks = createStacks();
  let imageIndex = 0;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cosmosStyleAnimation }} />
      <div
        ref={containerRef}
        className="relative w-full h-screen bg-black overflow-hidden"
        style={{
          perspective: '2000px',
          perspectiveOrigin: '50% 35%'
        }}
      >
        {/* Center Content */}
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="text-center px-4 transform-gpu">
            <h1
              className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight transition-all duration-700 hover:scale-105 cursor-default"
              style={{
                animation: 'fadeInScale3D 1.8s ease-out 1s both, titleGlow 6s ease-in-out infinite',
                fontWeight: 800,
                textShadow: '0 0 40px rgba(255,255,255,0.15), 0 20px 50px rgba(0,0,0,0.4)',
                transform: 'translateZ(200px)',
                mixBlendMode: 'screen'
              }}
              onMouseEnter={() => setIsFlowing(true)}
            >
              KALAKRAFT
              <span className="text-2xl md:text-3xl align-top opacity-70">©</span>
            </h1>

            <div
              className="flex items-center justify-center gap-3 text-gray-400 flex-wrap"
              style={{
                animation: 'fadeInScale3D 1.5s ease-out 1.3s both',
                filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.6))',
                transform: 'translateZ(150px)'
              }}
            >
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"></div>
              <span className="text-lg md:text-xl">A discovery engine for</span>
              <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 px-4 py-1.5 rounded-full transition-all duration-300 hover:bg-gray-800/60 hover:border-gray-600/50 hover:scale-105">
                <span className="text-white text-lg md:text-xl">artists</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Cosmos-style Stacked Cards with Flow Animation */}
        {stacks.map((stack, stackIndex) => (
          <div
            key={stackIndex}
            className={`stack-container absolute ${isFlowing ? 'flow-active' : ''}`}
            style={{
              left: `${stack.x}%`,
              top: `${stack.y}%`,
              transform: 'translate(-50%, -50%)',
              transformStyle: 'preserve-3d',
              zIndex: 30 - stackIndex
            }}
          >
            {Array.from({ length: stack.cards }, (_, cardIndex) => {
              if (imageIndex >= images.length) imageIndex = 0;
              const currentImage = images[imageIndex++];
              
              // Enhanced stack positioning for better upward view
              const stackOffsetY = cardIndex * -3;
              const stackOffsetX = cardIndex * 2;
              const stackDepth = cardIndex * -18;
              const stackRotation = stack.rotation + (cardIndex * 1.2);
              const stackOpacity = Math.max(0.5, 1 - cardIndex * 0.1);
              const stackTilt = -35 - (cardIndex * 3); // Upward tilt

              return (
                <div
                  key={cardIndex}
                  className="stack-card absolute cursor-pointer"
                  style={{
                    width: '200px',
                    height: '280px',
                    left: '50%',
                    top: '50%',
                    transformOrigin: 'center center',
                    animation: isFlowing && cardIndex === 0 
                      ? `flowToCenter 6s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${stackIndex * 0.3}s`
                      : isFlowing 
                      ? `moveStackForward 6s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${stackIndex * 0.3}s`
                      : `
                        stackEntrance 3s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${stackIndex * 0.4 + cardIndex * 0.2}s both,
                        stackFloat ${12 + stackIndex * 2}s ease-in-out infinite ${3 + stackIndex * 0.4 + cardIndex * 0.2}s
                      `,
                    '--entrance-x': `${stack.entranceX}px`,
                    '--entrance-y': `${stack.entranceY}px`,
                    '--entrance-rotate': `${stack.entranceRotate}deg`,
                    '--stack-x': `${stackOffsetX}px`,
                    '--stack-y': `${stackOffsetY}px`,
                    '--stack-z': `${stackDepth}px`,
                    '--stack-rotate': `${stackRotation}deg`,
                    '--stack-tilt': `${stackTilt}deg`,
                    '--stack-opacity': stackOpacity,
                    '--flow-center-x': `${stack.flowCenterX}px`,
                    '--flow-center-y': `${stack.flowCenterY}px`,
                    transform: `
                      translate(-50%, -50%)
                      translateX(${stackOffsetX}px)
                      translateY(${stackOffsetY}px)
                      translateZ(${stackDepth}px)
                      rotateX(${stackTilt}deg)
                      rotateZ(${stackRotation}deg)
                    `,
                    opacity: stackOpacity,
                    zIndex: isFlowing && cardIndex === 0 ? 1000 : 50 - cardIndex
                  } as React.CSSProperties}
                >
                  <div
                    className="relative group w-full h-full"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(20px)',
                      borderRadius: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      boxShadow: `
                        0 30px 70px rgba(0,0,0,0.8),
                        0 15px 30px rgba(0,0,0,0.5),
                        inset 0 1px 0 rgba(255,255,255,0.1),
                        inset 0 0 30px rgba(255,255,255,0.03)
                      `,
                      overflow: 'hidden',
                      transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)'
                    }}
                  >
                    <img
                      src={currentImage}
                      alt={`Artwork ${imageIndex}`}
                      className="w-full h-full object-cover"
                      style={{
                        filter: 'contrast(1.1) brightness(0.9) saturate(1.2)',
                        transition: 'filter 0.4s ease'
                      }}
                    />
                    
                    {/* Enhanced upward-view lighting overlay */}
                    <div
                      className="absolute inset-0 opacity-60 group-hover:opacity-80 transition-opacity duration-400"
                      style={{
                        background: `
                          linear-gradient(20deg, 
                            rgba(255,255,255,0.4) 0%, 
                            rgba(255,255,255,0.15) 30%, 
                            transparent 60%, 
                            rgba(0,0,0,0.2) 80%, 
                            rgba(0,0,0,0.5) 100%
                          )
                        `,
                        pointerEvents: 'none'
                      }}
                    />

                    {/* Enhanced hover glow for upward view */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-60 transition-opacity duration-500"
                      style={{
                        background: 'radial-gradient(ellipse at 70% 80%, rgba(255,255,255,0.5) 0%, transparent 70%)',
                        pointerEvents: 'none'
                      }}
                    />

                    {/* Bottom edge highlight for upward tilt */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1 opacity-50 group-hover:opacity-70 transition-opacity duration-300"
                      style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                        pointerEvents: 'none'
                      }}
                    />

                    {/* Card number indicator for stacked effect */}
                    {cardIndex > 0 && (
                      <div
                        className="absolute top-2 right-2 w-1.5 h-1.5 bg-white/30 rounded-full opacity-50"
                        style={{
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}
                      />
                    )}

                    {/* Flow animation glow effect */}
                    {isFlowing && cardIndex === 0 && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                          animation: 'pulse 1s ease-in-out infinite'
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Enhanced Background Effects */}
        <div className="absolute inset-0 pointer-events-none z-0">
          {/* Central glow */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/1 rounded-full blur-3xl"></div>
          
          {/* Ambient lighting */}
          <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-blue-500/2 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-500/2 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }}></div>
          <div className="absolute top-3/4 left-1/3 w-32 h-32 bg-cyan-500/2 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '6s' }}></div>
        </div>

        {/* UI Elements */}
        <div
          className="absolute top-8 left-8 z-40"
          style={{ animation: 'fadeInScale3D 1.2s ease-out 2.5s both' }}
        >
          <div className="flex items-center gap-3 text-gray-500 backdrop-blur-sm bg-black/30 rounded-full px-5 py-2.5 border border-gray-800/50">
            <div className="flex gap-1.5">
              {stacks.map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 bg-gray-600 rounded-full opacity-70"></div>
              ))}
            </div>
            <span className="text-sm font-medium">{stacks.length} collections</span>
          </div>
        </div>

        <div
          className="absolute bottom-8 right-8 z-40"
          style={{ animation: 'fadeInScale3D 1.2s ease-out 2.8s both' }}
          onClick={() => setIsFlowing(true)}
        >
          <div className="flex items-center gap-3 text-gray-500 hover:text-gray-400 transition-colors duration-300 backdrop-blur-sm bg-black/30 rounded-full px-5 py-2.5 border border-gray-800/50 cursor-pointer hover:bg-black/40">
            <span className="text-sm font-medium hidden md:block">Flow to center</span>
            <div className="w-6 h-6 border border-gray-600 rounded-full flex items-center justify-center hover:border-gray-500 transition-colors duration-300">
              <div className="w-1 h-3 bg-gray-600 rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>

        <div
          className="absolute bottom-8 left-8 z-40"
          style={{ animation: 'fadeInScale3D 1.2s ease-out 3s both' }}
        >
          <div className="flex items-center gap-3 text-gray-600 backdrop-blur-sm bg-black/30 rounded-full px-5 py-2.5 border border-gray-800/50">
            <div className={`w-2 h-2 bg-gray-600 rounded-full ${isFlowing ? 'animate-pulse bg-green-500' : 'animate-pulse'}`}></div>
            <span className="text-xs font-medium">Stacked Gallery {isFlowing ? '- Flowing' : ''}</span>
          </div>
        </div>
      </div>
    </>
  );
}