import React from 'react';
import Link from 'next/link';
import styles from '../home.module.css';

const MobileVideoSection: React.FC = () => {
  return (
    <section style={{ 
      padding: '2rem 0 0.5rem 0',
      background: '#f9f9f9', // Match collections section background
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background design elements to match collections section */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 
          `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.025'/%3E%3C/svg%3E"),
          url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.015'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        opacity: 0.7,
        pointerEvents: 'none',
        zIndex: 1
      }} />
      
      {/* Decorative corner accent */}
      <div style={{
        position: 'absolute',
        top: '30px',
        left: '30px',
        width: '60px',
        height: '60px',
        borderTop: '1px solid',
        borderLeft: '1px solid',
        borderImage: 'linear-gradient(135deg, rgba(179, 138, 88, 0.6), rgba(0, 0, 0, 0.15)) 1',
        zIndex: 2,
        pointerEvents: 'none'
      }} />
      
      {/* Watercolor accent 1 */}
      <div style={{
        position: 'absolute',
        width: '200px',
        height: '200px',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cpath d='M50,100 Q70,70 90,90 T130,80 T170,100 T150,130 T110,140 T70,120 T50,100' fill='%23b38a58' fill-opacity='0.04'/%3E%3C/svg%3E")`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        top: '15%',
        right: '10%',
        zIndex: 1,
        opacity: 0.6,
        transform: 'rotate(-20deg)',
        pointerEvents: 'none',
        animation: 'gentle-float 18s infinite alternate ease-in-out'
      }} />
      
      {/* Watercolor accent 2 */}
      <div style={{
        position: 'absolute',
        width: '150px',
        height: '150px',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cpath d='M70,60 Q90,40 110,50 T150,60 T160,90 T140,120 T100,130 T60,100 T70,60' fill='%23b38a58' fill-opacity='0.03'/%3E%3C/svg%3E")`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        bottom: '10%',
        left: '5%',
        zIndex: 1,
        opacity: 0.6,
        transform: 'rotate(15deg)',
        pointerEvents: 'none',
        animation: 'gentle-float 15s infinite alternate-reverse ease-in-out'
      }} />
      
      {/* Section header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '1.5rem',
        position: 'relative',
        padding: '0 1rem',
        zIndex: 2
      }}>
        <div style={{ 
          width: '40px',
          height: '2px',
          background: '#000',
          margin: '0.5rem auto'
        }} />
        <h2 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '2rem',
          fontWeight: 400,
          color: '#000',
          margin: 0,
          letterSpacing: '0.05em',
          fontStyle: 'italic'
        }}>Behind The Scenes</h2>
        <div style={{ 
          width: '40px',
          height: '2px',
          background: '#000',
          margin: '0.5rem auto'
        }} />
      </div>
      
      {/* Description */}
      <div style={{
        textAlign: 'center',
        maxWidth: '90%',
        margin: '0 auto 1rem',
        fontSize: '0.95rem',
        lineHeight: 1.6,
        color: '#666',
        padding: '0 1rem',
        position: 'relative',
        zIndex: 2
      }}>
        <p>Watch the artistry and craftsmanship that goes into creating each unique piece</p>
      </div>
      
      {/* Video container - keeping the same video format and styling */}
      <div style={{ 
        width: '100vw', 
        position: 'relative',
        left: '50%',
        right: '50%',
        marginLeft: '-50vw',
        marginRight: '-50vw',
        marginTop: '1rem',
        marginBottom: '1.5rem',
        zIndex: 2
      }}>
        <div style={{ 
          width: '100%', 
          overflow: 'hidden',
          position: 'relative',
          paddingBottom: '110%', /* Slightly taller than square */
          height: 0,
          backgroundColor: '#000'
        }}>
          <video
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block'
            }}
            playsInline
            loop
            autoPlay
            muted
            poster="/images/loading.png"
            preload="auto"
          >
            <source src="https://res.cloudinary.com/downe8107/video/upload/v1752756632/Goal_make_the_202507170106_9lp5g_rosxzs.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
      
      {/* Footer section */}
      <div style={{
        textAlign: 'center',
        margin: '1.5rem auto 1rem',
        padding: '0 1rem',
        position: 'relative',
        zIndex: 2
      }}>
        <p style={{
          marginBottom: '1.5rem',
          fontSize: '0.95rem',
          color: '#666',
          lineHeight: 1.6
        }}>Experience the magic of resin art creation</p>
        <Link 
          href="/products" 
          className={styles.exploreAllButton}
        >
          Explore Our Process
        </Link>
      </div>
    </section>
  );
};

export default MobileVideoSection; 