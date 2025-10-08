/**
 * Image optimization utilities for mobile performance
 */

export interface ImageOptimizationOptions {
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
  width?: number
  height?: number
  lazy?: boolean
  placeholder?: 'blur' | 'empty'
}

/**
 * Optimized image component props
 */
export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  width?: number
  height?: number
  quality?: number
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  onLoad?: () => void
  onError?: () => void
}

/**
 * Generate responsive image sizes
 */
export function generateResponsiveSizes(baseWidth: number): string {
  const breakpoints = [320, 640, 768, 1024, 1280, 1536]
  const sizes = breakpoints
    .map(bp => `(max-width: ${bp}px) ${Math.min(bp, baseWidth)}px`)
    .join(', ')

  return `${sizes}, ${baseWidth}px`
}

/**
 * Generate srcSet for responsive images
 */
export function generateSrcSet(src: string, widths: number[]): string {
  return widths.map(width => `${optimizeImageUrl(src, { width })} ${width}w`).join(', ')
}

/**
 * Optimize image URL with parameters
 */
export function optimizeImageUrl(src: string, options: ImageOptimizationOptions = {}): string {
  const { quality = 75, format = 'webp', width, height } = options

  // For external images, return as-is (would need image optimization service)
  if (src.startsWith('http')) {
    return src
  }

  // For local images, add optimization parameters
  const url = new URL(src, window.location.origin)

  if (quality !== 75) url.searchParams.set('q', quality.toString())
  if (format !== 'webp') url.searchParams.set('f', format)
  if (width) url.searchParams.set('w', width.toString())
  if (height) url.searchParams.set('h', height.toString())

  return url.toString()
}

/**
 * Check if WebP is supported
 */
export function isWebPSupported(): Promise<boolean> {
  return new Promise(resolve => {
    const webP = new Image()
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2)
    }
    webP.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
  })
}

/**
 * Lazy loading intersection observer
 */
export class LazyImageLoader {
  private observer: IntersectionObserver | null = null
  private images = new Set<HTMLImageElement>()

  constructor() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement
              this.loadImage(img)
              this.observer?.unobserve(img)
              this.images.delete(img)
            }
          })
        },
        {
          rootMargin: '50px 0px',
          threshold: 0.01,
        }
      )
    }
  }

  observe(img: HTMLImageElement) {
    if (this.observer) {
      this.observer.observe(img)
      this.images.add(img)
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(img)
    }
  }

  private loadImage(img: HTMLImageElement) {
    const src = img.dataset.src
    const srcSet = img.dataset.srcset

    if (src) {
      img.src = src
      img.removeAttribute('data-src')
    }

    if (srcSet) {
      img.srcset = srcSet
      img.removeAttribute('data-srcset')
    }

    img.classList.remove('lazy-loading')
    img.classList.add('lazy-loaded')
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect()
      this.images.clear()
    }
  }
}

/**
 * Global lazy image loader instance
 */
export const lazyImageLoader = new LazyImageLoader()

/**
 * Generate blur placeholder data URL
 */
export function generateBlurDataURL(width: number = 8, height: number = 8): string {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  // Create a simple gradient blur effect
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#f3f4f6')
  gradient.addColorStop(1, '#e5e7eb')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  return canvas.toDataURL('image/jpeg', 0.1)
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, options: ImageOptimizationOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => resolve()
    img.onerror = reject

    // Set srcset for responsive images
    if (options.width) {
      const widths = [options.width, options.width * 2]
      img.srcset = generateSrcSet(src, widths)
      img.sizes = generateResponsiveSizes(options.width)
    }

    img.src = optimizeImageUrl(src, options)
  })
}

/**
 * Batch preload multiple images
 */
export async function preloadImages(
  images: Array<{ src: string; options?: ImageOptimizationOptions }>
): Promise<void> {
  const promises = images.map(({ src, options }) => preloadImage(src, options))
  await Promise.allSettled(promises)
}

/**
 * Image compression utility for user uploads
 */
export function compressImage(
  file: File,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    format?: 'jpeg' | 'webp' | 'png'
  } = {}
): Promise<Blob> {
  const { maxWidth = 1920, maxHeight = 1080, quality = 0.8, format = 'jpeg' } = options

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        blob => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to compress image'))
          }
        },
        `image/${format}`,
        quality
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Get optimal image format based on browser support
 */
export async function getOptimalImageFormat(): Promise<'webp' | 'jpeg'> {
  const supportsWebP = await isWebPSupported()
  return supportsWebP ? 'webp' : 'jpeg'
}

/**
 * Image loading performance metrics
 */
export class ImagePerformanceTracker {
  private metrics = new Map<string, { startTime: number; endTime?: number; size?: number }>()

  startTracking(src: string) {
    this.metrics.set(src, { startTime: performance.now() })
  }

  endTracking(src: string, size?: number) {
    const metric = this.metrics.get(src)
    if (metric) {
      metric.endTime = performance.now()
      metric.size = size
    }
  }

  getMetrics() {
    const results: Array<{
      src: string
      loadTime: number
      size?: number
      bytesPerMs?: number
    }> = []

    this.metrics.forEach((metric, src) => {
      if (metric.endTime) {
        const loadTime = metric.endTime - metric.startTime
        results.push({
          src,
          loadTime,
          size: metric.size,
          bytesPerMs: metric.size ? metric.size / loadTime : undefined,
        })
      }
    })

    return results
  }

  clear() {
    this.metrics.clear()
  }
}

/**
 * Global image performance tracker
 */
export const imagePerformanceTracker = new ImagePerformanceTracker()
