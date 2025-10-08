import * as React from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: number
  gap?: 'none' | 'sm' | 'md' | 'lg'
  aspectRatio?: 'square' | 'auto'
  touchOptimized?: boolean
}

const ResponsiveGrid = React.forwardRef<HTMLDivElement, ResponsiveGridProps>(
  (
    {
      className,
      cols = 11,
      gap = 'sm',
      aspectRatio = 'square',
      touchOptimized = true,
      children,
      ...props
    },
    ref
  ) => {
    const gapClasses = {
      none: 'gap-0',
      sm: 'gap-1 sm:gap-2',
      md: 'gap-2 sm:gap-3',
      lg: 'gap-3 sm:gap-4',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'grid w-full max-w-full',
          `grid-cols-${cols}`,
          gapClasses[gap],
          aspectRatio === 'square' && 'aspect-square',
          touchOptimized && 'touch-manipulation select-none',
          className
        )}
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ResponsiveGrid.displayName = 'ResponsiveGrid'

interface GridCellProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean
  highlighted?: boolean
  disabled?: boolean
  touchTarget?: boolean
}

const GridCell = React.forwardRef<HTMLDivElement, GridCellProps>(
  (
    {
      className,
      selected = false,
      highlighted = false,
      disabled = false,
      touchTarget = true,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative aspect-square border border-border/50 transition-all duration-200',
          'flex items-center justify-center',
          // Touch optimization
          touchTarget && 'min-h-11 min-w-11 cursor-pointer',
          // Interactive states
          !disabled && 'hover:bg-accent/50 active:scale-95',
          selected && 'ring-2 ring-primary ring-offset-2 bg-accent',
          highlighted && 'bg-primary/20 ring-1 ring-primary/50',
          disabled && 'opacity-50 cursor-not-allowed',
          // Focus states for accessibility
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className
        )}
        tabIndex={disabled ? -1 : 0}
        role="gridcell"
        aria-selected={selected}
        aria-disabled={disabled}
        {...props}
      >
        {children}
      </div>
    )
  }
)
GridCell.displayName = 'GridCell'

// Game Board specific grid component
interface GameBoardGridProps extends Omit<ResponsiveGridProps, 'cols'> {
  boardSize?: 7 | 9 | 11 | 13
  showCoordinates?: boolean
}

const GameBoardGrid = React.forwardRef<HTMLDivElement, GameBoardGridProps>(
  ({ boardSize = 11, showCoordinates = false, className, children, ...props }, ref) => {
    return (
      <div className="flex flex-col items-center space-y-2">
        {showCoordinates && (
          <div className="flex justify-center space-x-1 text-xs text-muted-foreground">
            {Array.from({ length: boardSize }, (_, i) => (
              <div key={i} className="w-8 text-center">
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center space-x-2">
          {showCoordinates && (
            <div className="flex flex-col space-y-1 text-xs text-muted-foreground">
              {Array.from({ length: boardSize }, (_, i) => (
                <div key={i} className="h-8 flex items-center justify-center">
                  {boardSize - i}
                </div>
              ))}
            </div>
          )}

          <ResponsiveGrid
            ref={ref}
            cols={boardSize}
            className={cn(
              'bg-card border-2 border-border rounded-lg p-2',
              'shadow-lg',
              // Responsive sizing
              'w-full max-w-sm sm:max-w-md md:max-w-lg',
              className
            )}
            {...props}
          >
            {children}
          </ResponsiveGrid>

          {showCoordinates && (
            <div className="flex flex-col space-y-1 text-xs text-muted-foreground">
              {Array.from({ length: boardSize }, (_, i) => (
                <div key={i} className="h-8 flex items-center justify-center">
                  {boardSize - i}
                </div>
              ))}
            </div>
          )}
        </div>

        {showCoordinates && (
          <div className="flex justify-center space-x-1 text-xs text-muted-foreground">
            {Array.from({ length: boardSize }, (_, i) => (
              <div key={i} className="w-8 text-center">
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
)
GameBoardGrid.displayName = 'GameBoardGrid'

export { ResponsiveGrid, GridCell, GameBoardGrid }
