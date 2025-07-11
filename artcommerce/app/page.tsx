'use client'

import { useEffect, useState, useRef } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'

import { auth } from '../lib/firebase-client'

import { onAuthStateChanged } from 'firebase/auth'

import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

import styles from './home.module.css'
import { getImageUrl } from '../lib/cloudinaryImages'

// Add this to detect mobile view
const isMobileView = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768;
};

export default function Home() {

const [message, setMessage] = useState<string|null>(null)

// Adjust the typing speed parameters to be slower
const [rotatingText, setRotatingText] = useState('coasters')
const [displayText, setDisplayText] = useState('')
const [isTyping, setIsTyping] = useState(true)
const [currentWordIndex, setCurrentWordIndex] = useState(0)
const words = ['coasters', 'wall art', 'home decor', 'custom pieces']
const typingSpeed = 180 // milliseconds per character (slower typing)
const deletingSpeed = 100 // milliseconds per character (slower deletion)
const pauseBeforeTyping = 800 // longer pause before typing a new word
const pauseBeforeDeletion = 2500 // longer pause before deleting the word

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
  let timer: NodeJS.Timeout;
  
  // Handle the typewriter effect
  if (isTyping) {
    // If we're typing and haven't completed the word
    if (displayText.length < words[currentWordIndex].length) {
      timer = setTimeout(() => {
        setDisplayText(words[currentWordIndex].substring(0, displayText.length + 1));
      }, typingSpeed);
    } 
    // If we've completed typing the word
    else {
      setIsTyping(false);
      timer = setTimeout(() => {
        setIsTyping(false);
      }, pauseBeforeDeletion);
    }
  } else {
    // If we're deleting and there's still text left
    if (displayText.length > 0) {
      timer = setTimeout(() => {
        setDisplayText(displayText.substring(0, displayText.length - 1));
      }, deletingSpeed);
    } 
    // If we've deleted all text
    else {
      setIsTyping(true);
      // Move to the next word
      setCurrentWordIndex((currentWordIndex + 1) % words.length);
      timer = setTimeout(() => {
        // Small delay before typing next word
      }, pauseBeforeTyping);
    }
  }
  
  // Update the main rotating text state for any components that use it
  setRotatingText(displayText);
  
  return () => clearTimeout(timer);
}, [displayText, isTyping, currentWordIndex])



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

<main data-page="home" style={{background: '#f8f8f8'}}>

<section className={`relative overflow-hidden ${styles.desktopOnly}`}>

<div className={styles.videoContainer}>
  {/* Video with fallback image */}
  <picture>
    {/* Fallback image that will be shown if video fails */}
    <img 
      src={getImageUrl('featured3.JPG')}
      alt="Handcrafted resin art" 
      className={styles.videoBackground}
      style={{ display: 'none' }}
      id="videoFallback"
    />
  </picture>

  <video
    className={styles.videoBackground}
    autoPlay
    loop
    muted
    playsInline
    preload="metadata"
    poster="/images/loading.png"
    onError={(e) => {
      // If video fails to load, show the fallback image
      const videoElement = e.currentTarget;
      videoElement.style.display = 'none';
      document.getElementById('videoFallback')!.style.display = 'block';
    }}
  >
    <source 
      src={process.env.NEXT_PUBLIC_CLOUDINARY_VIDEO_URL || '/images/homepage_video.mp4'} 
      type="video/mp4" 
    />
    Your browser does not support the video tag.
  </video>

  <div className={styles.overlay} />


<div className={styles.content}>

<div className={styles.headerText}>

<div className={styles.topText} data-aos="fade-in" data-aos-delay="200">A HANDCRAFTED ART STUDIO</div>

<img

src={getImageUrl('logo.png')}

alt="Kalakraft Logo"

className={styles.logo}

data-aos="fade-in"

data-aos-delay="400"

/>

<h1 className={styles.title} data-aos="fade-up" data-aos-delay="600">

Handcrafted resin art for <span id="rotator">{displayText}</span>

</h1>

{/* New button for "Discover All Pieces" - Desktop only */}
<div className={`${styles.buttonContainer} ${styles.desktopOnly}`} data-aos="fade-up" data-aos-delay="700">
  <a href="/products" className={styles.discoverAllButton}>
    Discover All Pieces
  </a>
</div>

</div>


<div
  className={styles.scrollIndicator}
  onClick={() => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    })
  }}
/>

</div>

</div>

</section>



{/* Product Categories Grid Section */}

<section className={styles.productGridSection} data-aos="fade-up">

{/* Section Header with description */}

<div className={styles.sectionHeader} data-aos="fade-up">

<div className={styles.headerLine}></div>

<h2 className={styles.sectionTitle}>Our Collections</h2>

<div className={styles.headerLine}></div>

</div>


<div className={styles.collectionDescription} data-aos="fade-up" data-aos-delay="100">

<p>Discover our handcrafted resin art pieces, each one uniquely created with passion and precision. 
Our collections showcase the perfect blend of artistic expression and functional elegance, 
bringing the beauty of fluid art into your everyday life.</p>

</div>

<div className={styles.carouselContainer} data-aos="fade-up" data-aos-delay="200">

<div 

ref={carouselTrackRef}

className={`${styles.carouselTrack} ${isManualNav ? styles.manualNav : ''}`}

style={isManualNav ? { transform: `translateX(${slidePosition}px)` } : {}}

>

{/* First set of items */}

{productCategories.map((category, index) => (

<div

key={`original-${index}`}

className={styles.productCard}

style={{animationDelay: `${index * 0.15}s`}}

>

<div className={styles.cardInner}>

<img

src={category.image}

alt={category.alt}

className={styles.productImage}

// Add a fallback for broken images

onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400/f0f0f0/ccc?text=Image+Not+Found')}

/>

<div className={styles.cardOverlay}>

<button className={styles.viewAllButton}>Explore Collection</button>

</div>

<h3 className={styles.categoryTitle}>{category.title}</h3>

</div>

</div>

))}



{/* Duplicate set for seamless looping */}

{productCategories.map((category, index) => (

<div

key={`duplicate-${index}`}

className={styles.productCard}

style={{animationDelay: `${index * 0.15}s`}}

>

<div className={styles.cardInner}>

<img

src={category.image}

alt={category.alt}

className={styles.productImage}

// Add a fallback for broken images

onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400/f0f0f0/ccc?text=Image+Not+Found')}

/>

<div className={styles.cardOverlay}>

<button className={styles.viewAllButton}>Explore Collection</button>

</div>

<h3 className={styles.categoryTitle}>{category.title}</h3>

</div>

</div>

))}

</div>



{/* Navigation arrows */}

<div 

className={`${styles.carouselNav} ${styles.prevNav}`}

onClick={() => handleCarouselNav('prev')}

>

<ChevronLeft size={24} color="white" />

</div>

<div 

className={`${styles.carouselNav} ${styles.nextNav}`}

onClick={() => handleCarouselNav('next')}

>

<ChevronRight size={24} color="white" />

</div>

</div>


<div className={styles.collectionFooter} data-aos="fade-up" data-aos-delay="300">

<p>Each piece tells a story through layers of color and texture, inviting you to bring the essence of artistic expression into your home.</p>

<button className={styles.exploreAllButton}>View All Collections</button>

</div>


{/* Decorative elements */}

<div className={styles.watercolorSplash}></div>

<div className={styles.watercolorSplash2}></div>

<div className={styles.inkSplash}></div>

<div className={styles.lightEffect}></div>

<div className={styles.brushAccent}></div>

</section>

{/* Artistry in Every Layer Section - Redesigned - Desktop Only */}
<section className={`${styles.artistrySection} ${styles.desktopOnly}`}>
  <div 
    className={styles.artistryBackground}
    style={{
      backgroundImage: `linear-gradient(to right, rgba(248, 248, 248, 0.95), rgba(248, 248, 248, 0.8)), url('${getImageUrl('collectionwall.png')}')`
    }}
  >
    <img 
      src={getImageUrl('DSC01366.JPG')}
      alt="Resin art creation process" 
      className={styles.artistryFeatureImage} 
      data-aos="fade-left"
    />
    
    <div className={styles.artistryContent}>
      {/* Section Header with description */}
      <div className={styles.sectionHeader} data-aos="fade-in">
        <div className={styles.headerLine}></div>
        <h2 className={styles.sectionTitle}>Artistry in Every Layer</h2>
        <div className={styles.headerLine}></div>
      </div>
      
      <div className={styles.artistryQuote} data-aos="fade-up">
        Our resin art combines premium materials with meticulous craftsmanship to create pieces that capture light, color, and imagination in ways that will endure for generations.
      </div>
      
      <div className={styles.artistryCards}>
        {/* Card 1 */}
        <div className={styles.artistryCard} data-aos="fade-up" data-aos-delay="100">
          <div className={styles.artistryIcon}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="rgba(179, 138, 88, 0.8)" strokeWidth="1.5">
              <path d="M32 8C32 8 16 24 16 40C16 48.8366 23.1634 56 32 56C40.8366 56 48 48.8366 48 40C48 24 32 8 32 8Z" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M32 44C34.2091 44 36 42.2091 36 40C36 37.7909 32 32 32 32C32 32 28 37.7909 28 40C28 42.2091 29.7909 44 32 44Z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className={styles.artistryIconRipple}></div>
          </div>
          <h3 className={styles.artistryCardTitle}>Museum-Grade Resin</h3>
          <p className={styles.artistryCardText}>Hand-mixed for crystal clarity and vibrant hues that endure.</p>
        </div>
        
        {/* Card 2 */}
        <div className={styles.artistryCard} data-aos="fade-up" data-aos-delay="200">
          <div className={styles.artistryIcon}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="rgba(179, 138, 88, 0.8)" strokeWidth="1.5">
              <path d="M8 24L32 32L56 24" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 32L32 40L56 32" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 40L32 48L56 40" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M32 16L16 22L32 28L48 22L32 16Z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className={styles.artistryIconRipple}></div>
          </div>
          <h3 className={styles.artistryCardTitle}>Precision Pouring</h3>
          <p className={styles.artistryCardText}>Controlled, bubble-free layers for a seamless, mirror-smooth surface.</p>
        </div>
        
        {/* Card 3 */}
        <div className={styles.artistryCard} data-aos="fade-up" data-aos-delay="300">
          <div className={styles.artistryIcon}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="rgba(179, 138, 88, 0.8)" strokeWidth="1.5">
              <circle cx="32" cy="32" r="16" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M32 16V8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M32 56V48" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 32H8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M56 32H48" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M48 16L44 20" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 44L16 48" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M48 48L44 44" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 20L16 16" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M32 24V32H40" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className={styles.artistryIconRipple}></div>
          </div>
          <h3 className={styles.artistryCardTitle}>UV-Resistant Gloss</h3>
          <p className={styles.artistryCardText}>Anti-yellowing top coat protects color and shine from sun exposure.</p>
        </div>
      </div>
    </div>
  </div>
</section>

</main>

)

}