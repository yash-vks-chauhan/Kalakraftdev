'use client'

import { useEffect, useState, useRef } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import dynamic from 'next/dynamic'
import ErrorBoundary from './components/ErrorBoundary'

import { auth } from '../lib/firebase-client'

import { onAuthStateChanged } from 'firebase/auth'

import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

import styles from './home.module.css'
import { getImageUrl } from '../lib/cloudinaryImages'

// Import the mobile version
const MobileHomePage = dynamic(() => import('./components/mobile/MobileHomePage'), {
  loading: () => (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#fff'
    }}>
      <div style={{
        textAlign: 'center',
        fontSize: '16px',
        color: '#666'
      }}>
        Loading...
      </div>
    </div>
  )
})

// Import the desktop version
const DesktopHomePage = dynamic(() => import('./DesktopHomePage'), {
  loading: () => (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#fff'
    }}>
      <div style={{
        textAlign: 'center',
        fontSize: '16px',
        color: '#666'
      }}>
        Loading...
      </div>
    </div>
  )
})

export default function Home() {
  const [isMobile, setIsMobile] = useState(false)
  const [isClient, setIsClient] = useState(false)

  const [message, setMessage] = useState<string|null>(null)

  const [rotatingText, setRotatingText] = useState('coasters')

  const carouselTrackRef = useRef<HTMLDivElement>(null)

  const [isManualNav, setIsManualNav] = useState(false)

  const [slidePosition, setSlidePosition] = useState(0)

  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Product categories for the grid - expanded with more items
  const productCategories = [
    {
      image: getImageUrl('imagecollection1.png'),
      title: 'COASTERS',
      alt: 'Handcrafted resin coasters'
    },
    {
      image: getImageUrl('imageclock.png'),
      title: 'WALL ART',
      alt: 'Resin wall art pieces'
    },
    {
      image: getImageUrl('imagecollection99.png'),
      title: 'HOME DECOR',
      alt: 'Decorative resin items'
    },
    {
      image: getImageUrl('collectionwall.png'),
      title: 'CUSTOM PIECES',
      alt: 'Custom resin artwork'
    },
    {
      image: getImageUrl('category1.png'),
      title: 'CLOCKS',
      alt: 'Handcrafted resin clocks'
    },
    {
      image: getImageUrl('trayscollection.png'),
      title: 'JEWELRY TRAYS',
      alt: 'Elegant resin jewelry trays'
    },
    {
      image: getImageUrl('vases.png'),
      title: 'VASES',
      alt: 'Decorative resin vases'
    },
    {
      image: getImageUrl('category4.png'),
      title: 'TRAYS',
      alt: 'Stylish resin serving trays'
    }
  ]

  useEffect(() => {
    setIsClient(true)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Initial check
    checkMobile()
    
    // Listen for resize events
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // Show loading state during SSR
  if (!isClient) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#fff'
      }}>
        <div style={{
          textAlign: 'center',
          fontSize: '16px',
          color: '#666'
        }}>
          Loading...
        </div>
      </div>
    )
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setMessage('Not signed in')
        return
      }
      // Get fresh ID token
      const idToken = await fbUser.getIdToken()

      // Call your protected API
      const res = await fetch('/api/secure/hello', {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setMessage(json.message || json.error)
      } else {
        console.error('Failed to fetch secure data:', res.status)
        // Optional: Set a message to indicate the failure
        // setMessage('Could not authenticate with server.');
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    // Add required fonts
    const fonts = [
      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,400&display=swap',
      'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap'
    ]

    const links = fonts.map(font => {
      const link = document.createElement('link')
      link.href = font
      link.rel = 'stylesheet'
      document.head.appendChild(link)
      return link
    })

    // Smooth scroll to content when clicking the scroll indicator
    const handleScrollClick = () => {
      window.scrollTo({
        top: window.innerHeight,
        behavior: 'smooth'
      })
    }

    const scrollIndicator = document.querySelector(`.${styles.scrollIndicator}`)
    scrollIndicator?.addEventListener('click', handleScrollClick)

    return () => {
      links.forEach(link => document.head.removeChild(link))
      scrollIndicator?.removeEventListener('click', handleScrollClick)
    }
  }, [])

  useEffect(() => {
    // Rotating text animation
    const items = ['coasters', 'wall art', 'home decor', 'custom pieces']
    let currentIndex = 0

    const rotateText = () => {
      currentIndex = (currentIndex + 1) % items.length
      setRotatingText(items[currentIndex])
    }

    const interval = setInterval(rotateText, 3000)
    return () => clearInterval(interval)
  }, [])

  // Handle carousel navigation
  const handleCarouselNav = (direction: 'prev' | 'next') => {
    if (!carouselTrackRef.current) return;

    // If this is the first manual navigation, stop the auto-scrolling
    if (!isManualNav) {
      setIsManualNav(true);
    }

    // Clear any existing timer to reset the idle timeout
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current)
    }

    const cardWidth = 380; // Width of each card
    const gap = 40; // Gap between cards (2.5rem)
    const containerWidth = carouselTrackRef.current.parentElement?.clientWidth || 0;
    const totalWidth = productCategories.length * (cardWidth + gap);

    // Calculate the step size (one card width + gap)
    const step = cardWidth + gap;

    // Update the position based on direction
    let newPosition = slidePosition;
    if (direction === 'next') {
      newPosition = Math.max(slidePosition - step, -totalWidth + containerWidth);
    } else {
      newPosition = Math.min(slidePosition + step, 0);
    }

    setSlidePosition(newPosition);

    // Set a timer to resume auto-scrolling after 5 seconds of inactivity
    resumeTimerRef.current = setTimeout(() => {
      setIsManualNav(false)
    }, 5000) // 5 seconds

    // Apply the transform
    carouselTrackRef.current.style.transform = `translateX(${newPosition}px)`;
  }

  // Cleanup timer on component unmount
  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: 'ease-in-out',
    })
  }, [])

  // Add this new useEffect for video loading
  useEffect(() => {
    // Function to handle video loading
    const handleVideoLoading = () => {
      const videoElement = document.querySelector(`.${styles.videoBackground}`) as HTMLVideoElement;
      const fallbackImage = document.getElementById('videoFallback');
      
      if (videoElement && fallbackImage) {
        // Check if video loaded successfully
        videoElement.addEventListener('loadeddata', () => {
          // Video loaded successfully
          videoElement.style.display = 'block';
          fallbackImage.style.display = 'none';
        });
        
        videoElement.addEventListener('error', () => {
          // Video failed to load
          videoElement.style.display = 'none';
          fallbackImage.style.display = 'block';
        });
        
        // Force reload the video
        videoElement.load();
      }
    };
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(handleVideoLoading, 300);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <ErrorBoundary>
      {isMobile ? <MobileHomePage /> : <DesktopHomePage />}
    </ErrorBoundary>
  )
}