import { useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Crown, Shield, Sword } from 'lucide-react'
import type { PieceType, Position } from '@shared/schema'

interface InteractiveGamePieceProps {
  type: PieceType
  position: Position
  isSelected?: boolean
  canMove?: boolean
  onDragStart?: (position: Position) => void
  onDragEnd?: (from: Position | null, to: Position | null) => void
  className?: string
}

export default function InteractiveGamePiece({
  type,
  position,
  isSelected,
  canMove,
  onDragStart,
  onDragEnd,
  className,
}: InteractiveGamePieceProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })

  const pieceRef = useRef<HTMLDivElement>(null)
  const dragStartPosition = useRef<Position | null>(null)

  if (!type) return null

  // Handle touch drag start
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!canMove) return

      e.preventDefault()
      e.stopPropagation()

      const touch = e.touches[0]
      const rect = pieceRef.current?.getBoundingClientRect()

      if (rect) {
        setDragOffset({
          x: touch.clientX - rect.left - rect.width / 2,
          y: touch.clientY - rect.top - rect.height / 2,
        })

        setDragPosition({
          x: touch.clientX,
          y: touch.clientY,
        })

        setIsDragging(true)
        dragStartPosition.current = position
        onDragStart?.(position)

        // Haptic feedback for drag start
        if ('vibrate' in navigator) {
          navigator.vibrate([15])
        }
      }
    },
    [canMove, position, onDragStart]
  )

  // Handle touch drag move
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return

      e.preventDefault()
      const touch = e.touches[0]

      setDragPosition({
        x: touch.clientX,
        y: touch.clientY,
      })
    },
    [isDragging]
  )

  // Handle touch drag end
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return

      e.preventDefault()
      setIsDragging(false)

      // Find the target square under the touch point
      const touch = e.changedTouches[0]
      const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY)

      let targetPosition: Position | null = null

      // Look for board cell element
      let current = elementUnder
      while (current && !current.classList.contains('board-cell')) {
        current = current.parentElement
      }

      if (current && current.classList.contains('board-cell')) {
        // Extract position from the grid
        const boardContainer = current.parentElement
        if (boardContainer) {
          const cells = Array.from(boardContainer.children)
          const cellIndex = cells.indexOf(current)
          if (cellIndex >= 0) {
            const row = Math.floor(cellIndex / 11)
            const col = cellIndex % 11
            targetPosition = { row, col }
          }
        }
      }

      onDragEnd?.(dragStartPosition.current, targetPosition)
      dragStartPosition.current = null

      // Reset drag position
      setDragPosition({ x: 0, y: 0 })
    },
    [isDragging, onDragEnd]
  )

  // Handle mouse events for desktop compatibility
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!canMove) return

      e.preventDefault()
      e.stopPropagation()

      const rect = pieceRef.current?.getBoundingClientRect()

      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left - rect.width / 2,
          y: e.clientY - rect.top - rect.height / 2,
        })

        setDragPosition({
          x: e.clientX,
          y: e.clientY,
        })

        setIsDragging(true)
        dragStartPosition.current = position
        onDragStart?.(position)
      }
    },
    [canMove, position, onDragStart]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return

      e.preventDefault()

      setDragPosition({
        x: e.clientX,
        y: e.clientY,
      })
    },
    [isDragging]
  )

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return

      e.preventDefault()
      setIsDragging(false)

      const elementUnder = document.elementFromPoint(e.clientX, e.clientY)
      let targetPosition: Position | null = null

      let current = elementUnder
      while (current && !current.classList.contains('board-cell')) {
        current = current.parentElement
      }

      if (current && current.classList.contains('board-cell')) {
        const boardContainer = current.parentElement
        if (boardContainer) {
          const cells = Array.from(boardContainer.children)
          const cellIndex = cells.indexOf(current)
          if (cellIndex >= 0) {
            const row = Math.floor(cellIndex / 11)
            const col = cellIndex % 11
            targetPosition = { row, col }
          }
        }
      }

      onDragEnd?.(dragStartPosition.current, targetPosition)
      dragStartPosition.current = null
      setDragPosition({ x: 0, y: 0 })
    },
    [isDragging, onDragEnd]
  )

  // Add global mouse event listeners when dragging
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const getPieceIcon = () => {
    const iconClass = 'w-full h-full'
    switch (type) {
      case 'king':
        return <Crown className={cn(iconClass, 'text-yellow-900')} />
      case 'defender':
        return <Shield className={cn(iconClass, 'text-white drop-shadow-sm')} />
      case 'attacker':
        return <Sword className={cn(iconClass, 'text-white drop-shadow-sm')} />
      default:
        return null
    }
  }

  const getPieceClass = () => {
    const baseClass = cn(
      'rounded-full flex items-center justify-center transition-all duration-200',
      'shadow-lg border-2 select-none',
      className,
      {
        'cursor-grab active:cursor-grabbing': canMove && !isDragging,
        'cursor-grabbing': isDragging,
        'transform scale-110 ring-4 ring-opacity-60': isSelected,
        'transform scale-105': isDragging,
        'hover:scale-105': canMove && !isDragging,
        'z-50': isDragging,
      }
    )

    switch (type) {
      case 'king':
        return cn(
          baseClass,
          'piece-king',
          'bg-gradient-to-br from-yellow-400 to-yellow-600',
          'border-yellow-300',
          {
            'ring-yellow-400': isSelected,
            'shadow-2xl': isDragging,
          }
        )
      case 'defender':
        return cn(
          baseClass,
          'piece-defender',
          'bg-gradient-to-br from-blue-500 to-blue-700',
          'border-blue-300',
          {
            'ring-blue-400': isSelected,
            'shadow-2xl': isDragging,
          }
        )
      case 'attacker':
        return cn(
          baseClass,
          'piece-attacker',
          'bg-gradient-to-br from-red-500 to-red-700',
          'border-red-300',
          {
            'ring-red-400': isSelected,
            'shadow-2xl': isDragging,
          }
        )
      default:
        return baseClass
    }
  }

  const pieceStyle = isDragging
    ? {
        position: 'fixed' as const,
        left: dragPosition.x - dragOffset.x,
        top: dragPosition.y - dragOffset.y,
        zIndex: 1000,
        pointerEvents: 'none' as const,
      }
    : {}

  return (
    <div
      ref={pieceRef}
      className={getPieceClass()}
      style={pieceStyle}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      role="button"
      tabIndex={canMove ? 0 : -1}
      aria-label={`${type} piece at row ${position.row + 1}, column ${position.col + 1}`}
      aria-pressed={isSelected}
    >
      {getPieceIcon()}

      {/* Visual feedback for dragging */}
      {isDragging && (
        <div className="absolute inset-0 rounded-full bg-white bg-opacity-20 animate-pulse" />
      )}
    </div>
  )
}
