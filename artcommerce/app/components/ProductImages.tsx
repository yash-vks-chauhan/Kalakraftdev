import { useState } from "react";
import Image from "next/image";
import styles from "./ProductImages.module.css"; // Import the new CSS module

export default function ProductImages({ imageUrls, name }: { imageUrls: string[]; name: string }) {
  const [mainIdx, setMainIdx] = useState(0);

  const handlePrev = () => {
    setMainIdx((prevIdx) => (prevIdx === 0 ? imageUrls.length - 1 : prevIdx - 1));
  };

  const handleNext = () => {
    setMainIdx((prevIdx) => (prevIdx === imageUrls.length - 1 ? 0 : prevIdx + 1));
  };

  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className={`${styles.imageContainer} ${styles.noImagePlaceholder}`}>
        <span className={styles.noImageText}>No image available</span>
      </div>
    );
  }

  return (
    <div className={styles.imageContainer}>
      {/* Main/displayed image */}
      <div className={styles.mainImageWrapper}>
        <Image
          src={imageUrls[mainIdx]}
          alt={`${name} (main image)`}
          width={800}
          height={600}
          className={styles.mainImage}
        />

        {/* Navigation Arrows */}
        {imageUrls.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className={`${styles.navigationButton} ${styles.prev}`}
              aria-label="Previous image"
            >
              ←
            </button>
            <button
              onClick={handleNext}
              className={`${styles.navigationButton} ${styles.next}`}
              aria-label="Next image"
            >
              →
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      <div className={styles.thumbnailStrip}>
        {imageUrls.map((src, idx) => (
          <button
            key={idx}
            onClick={() => setMainIdx(idx)}
            className={`${styles.thumbnailButton} ${idx === mainIdx ? styles.active : ""}`}
          >
            <Image
              src={src}
              alt={`${name} (thumb ${idx + 1})`}
              width={100}
              height={75}
              className={styles.thumbnailImage}
            />
          </button>
        ))}
      </div>
    </div>
  );
} 