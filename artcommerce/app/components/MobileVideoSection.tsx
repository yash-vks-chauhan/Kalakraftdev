import React, { useRef, useState, useEffect } from 'react';
import styles from './MobileVideoSection.module.css';

interface MobileVideoSectionProps {
  videoUrl?: string;
}

const MobileVideoSection: React.FC<MobileVideoSectionProps> = ({ 
  videoUrl = process.env.NEXT_PUBLIC_INSTAGRAM_VIDEO_URL || "https://res.cloudinary.com/downe8107/video/upload/v1752756632/Goal_make_the_202507170106_9lp5g_rosxzs.mp4"
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  
  // Use Intersection Observer to auto-play when video is visible
  useEffect(() => {
    if (!videoContainerRef.current || !videoRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        
        if (entry.isIntersecting && videoRef.current) {
          videoRef.current.play()
            .catch(err => console.error('Video play failed:', err));
        } else if (!entry.isIntersecting && videoRef.current) {
          videoRef.current.pause();
        }
      },
      { threshold: 0.3 } // Trigger when 30% of the video is visible
    );
    
    observer.observe(videoContainerRef.current);
    
    return () => {
      if (videoContainerRef.current) {
        observer.unobserve(videoContainerRef.current);
      }
    };
  }, []);
  
  // Toggle mute/unmute
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };
  
  return (
    <section className={styles.mobileVideoSection}>
      {/* Subtle watercolor background accents */}
      <div className={styles.watercolorAccent1} aria-hidden="true" />
      <div className={styles.watercolorAccent2} aria-hidden="true" />
      
      <div className={styles.mobileSectionHeader}>
        <div className={styles.mobileHeaderLine} />
        <h2 className={styles.mobileSectionTitle}>Behind The Scenes</h2>
        <div className={styles.mobileHeaderLine} />
      </div>
      
      <div className={styles.mobileVideoDescription}>
        <p>Watch the artistry and craftsmanship that goes into creating each unique piece</p>
      </div>
      
      <div className={styles.mobileVideoContainer} ref={videoContainerRef}>
        <div className={styles.mobileVideoCard}>
          <video
            ref={videoRef}
            className={styles.mobileVideo}
            playsInline
            loop
            autoPlay
            muted={isMuted}
            poster="/images/loading.png"
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          {/* Video Controls - only mute/unmute */}
          <div className={styles.videoControls}>
            <button 
              className={styles.muteButton} 
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute video" : "Mute video"}
            >
              {isMuted ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <line x1="23" y1="9" x2="17" y2="15"></line>
                  <line x1="17" y1="9" x2="23" y2="15"></line>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MobileVideoSection; 