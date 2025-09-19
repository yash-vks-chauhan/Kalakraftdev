'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { getImageUrl } from '@/lib/cloudinaryImages';

interface CosmosSectionProps {
  imageUrls: string[];
}

export function CosmosSection({ imageUrls }: CosmosSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    containerRef.current.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 10;

    const loader = new THREE.TextureLoader();
    const group = new THREE.Group();

    imageUrls.forEach((url) => {
      const texture = loader.load(url);
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);

      mesh.position.setFromSphericalCoords(
        8,
        Math.random() * Math.PI,
        Math.random() * Math.PI * 2
      );
      mesh.lookAt(camera.position);
      group.add(mesh);
    });
    scene.add(group);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.rotateSpeed = 0.3;

    const animate = () => {
      group.rotation.y += 0.002;
      group.children.forEach((child) => child.lookAt(camera.position));

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [imageUrls]);

  return (
    <section className="relative w-full h-screen overflow-hidden"
             style={{ backgroundColor: 'var(--bg, #fff)' }}>
      <div ref={containerRef} className="absolute inset-0" />

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
        <img
          src={getImageUrl('logo.png')}
          alt="Kalakraft Logo"
          className="w-32 h-auto mb-4"
        />
        <h2 className="text-4xl font-serif text-center text-current">
          Handcrafted Resin Art Universe
        </h2>
      </div>
    </section>
  );
}
