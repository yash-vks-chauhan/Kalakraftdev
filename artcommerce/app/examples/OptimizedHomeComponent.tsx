// Example of how to update the main Home component with optimized state management

import { useTypingAnimation } from './hooks/useTypingAnimation'
import { useAsyncState } from './hooks/useAsyncState'
import BestSellersSection from './components/BestSellersSection'

export default function Home() {
  // Consolidated state management
  const messageState = useAsyncState<string | null>(null)
  const featuredProductsState = useAsyncState([])

  // Optimized typing animation
  const { displayText, currentWord, isTyping } = useTypingAnimation({
    words: ['coasters', 'wall art', 'home decor', 'custom pieces'],
    typingSpeed: 180,
    deletingSpeed: 100,
    pauseBeforeTyping: 800,
    pauseBeforeDeletion: 2500,
  })

  // Carousel state consolidation
  const carouselTrackRef = useRef<HTMLDivElement>(null)
  const [carouselState, setCarouselState] = useState({
    isManualNav: false,
    slidePosition: 0,
  })
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null)

  // ... rest of component logic

  return (
    <div>
      {/* Use the optimized BestSellersSection component */}
      <BestSellersSection styles={styles} />
      
      {/* Use the typing animation */}
      <div className={styles.typingText}>
        {displayText}
        <span className={`${styles.cursor} ${isTyping ? styles.typing : ''}`}>|</span>
      </div>
      
      {/* Other components... */}
    </div>
  )
}
