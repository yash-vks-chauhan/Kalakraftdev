// components/RotatingText.tsx
'use client';
import { useState, useEffect } from 'react';

interface RotatingTextProps {
  words: string[];
  interval?: number;
}

export function RotatingText({ words, interval = 2500 }: RotatingTextProps) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(i => (i + 1) % words.length);
    }, interval);
    return () => clearInterval(timer);
  }, [words, interval]);
  return <span>{words[index]}</span>;
}