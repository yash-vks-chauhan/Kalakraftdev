'use client'

import React from 'react'
import OptimizedParticles from '../../../../app/components/OptimizedParticles'

export type ParticlesProps = {
  className?: string
  quantity?: number
  staticity?: number
  ease?: number
  size?: number
  color?: string
  vx?: number
  vy?: number
}

export function Particles({
  className,
  quantity = 60,
  size = 1,
  color = '#ffffff',
  vx = 0,
  vy = 0,
}: ParticlesProps) {
  return (
    <OptimizedParticles
      className={className}
      quantity={quantity}
      size={size}
      color={color}
      vx={vx}
      vy={vy}
    />
  )
}

export default Particles
