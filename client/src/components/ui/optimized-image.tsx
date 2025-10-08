import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  OptimizedImageProps,
  optimizeImageUrl,
  generateResponsiveSizes,
  generateSrcSet,
  generateBlurDataURL,
  lazyImageLoader,
  imagePerformanceTracker,
} from '@/lib/image-optimization'

/**
 * Optimized image component with lazy loading, responsive sizing, and performance tracking
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  quality = 75,
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  className,
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isIntersecting, setIsIntersecting] = useState(priority)
  const imgRef = useRef<HTMLImageElement>(null)

  // Generate responsive image URLs
  const optimizedSrc = optimizeImageUrl(src, { quality, width, height })
  const responsiveSizes = width ? generateResponsiveSizes(width) : undefined
  const srcSet = width ? generateSrcSet(src, [width, width * 1.5, width * 2]) : undefined

  // Generate blur placeholder if not provided
  const blurPlaceholder =
    blurDataURL || (placeholder === 'blur' ? generateBlurDataURL() : undefined)

  useEffect(() => {
    const img = imgRef.current
    if (!img || priority) return

    // Set up lazy loading
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true)
          observer.disconnect()
        }
      },
      { rootMargin: '50px 0px', threshold: 0.01 }
    )

    observer.observe(img)

    return () => observer.disconnect()
  }, [priority])

  useEffect(() => {
    if (isIntersecting && imgRef.current) {
      // Start performance tracking
      imagePerformanceTracker.startTracking(src)
    }
  }, [isIntersecting, src])

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true)

    // End performance tracking
    const img = event.currentTarget
    const size = img.naturalWidth * img.naturalHeight * 4 // Approximate size in bytes
    imagePerformanceTracker.endTracking(src, size)

    onLoad?.()
  }

  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true)
    onError?.(event as any)
  }

  // Don't render anything if there's an error
  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-100 text-gray-400 text-sm',
          className
        )}
        style={{ width, height }}
      >
        Failed to load image
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden', className)} style={{ width, height }}>
      {/* Blur placeholder */}
      {!isLoaded && blurPlaceholder && (
        <img
          src={blurPlaceholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110"
          aria-hidden="true"
        />
      )}

      {/* Loading skeleton */}
      {!isLoaded && !blurPlaceholder && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={isIntersecting ? optimizedSrc : undefined}
        srcSet={isIntersecting && srcSet ? srcSet : undefined}
        sizes={responsiveSizes}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          !isIntersecting && 'lazy-loading'
        )}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        {...props}
      />

      {/* Loading indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

/**
 * Avatar component with optimized image loading
 */
export interface AvatarImageProps {
  src?: string
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fallback?: string
  className?: string
}

export const AvatarImage: React.FC<AvatarImageProps> = ({
  src,
  alt,
  size = 'md',
  fallback,
  className,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  }

  const sizePixels = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  }

  if (!src) {
    return (
      <div
        className={cn(
          'rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium',
          sizeClasses[size],
          className
        )}
      >
        {fallback || alt.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={sizePixels[size]}
      height={sizePixels[size]}
      quality={90}
      priority={size === 'xl'} // Prioritize large avatars
      className={cn('rounded-full', sizeClasses[size], className)}
    />
  )
}

/**
 * Game piece image component with preloading
 */
export interface GamePieceImageProps {
  piece: 'king' | 'attacker' | 'defender'
  size?: number
  className?: string
  priority?: boolean
}

export const GamePieceImage: React.FC<GamePieceImageProps> = ({
  piece,
  size = 48,
  className,
  priority = false,
}) => {
  const pieceImages = {
    king: '/images/pieces/king.svg',
    attacker: '/images/pieces/attacker.svg',
    defender: '/images/pieces/defender.svg',
  }

  return (
    <OptimizedImage
      src={pieceImages[piece]}
      alt={`${piece} piece`}
      width={size}
      height={size}
      quality={100} // SVGs should be high quality
      priority={priority}
      className={cn('select-none', className)}
    />
  )
}

/**
 * Background image component with lazy loading
 */
export interface BackgroundImageProps {
  src: string
  alt: string
  children?: React.ReactNode
  className?: string
  overlay?: boolean
}

export const BackgroundImage: React.FC<BackgroundImageProps> = ({
  src,
  alt,
  children,
  className,
  overlay = false,
}) => {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        onLoad={() => setIsLoaded(true)}
      />

      {overlay && <div className="absolute inset-0 bg-black bg-opacity-40" />}

      {children && (
        <div
          className={cn(
            'relative z-10 transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}
