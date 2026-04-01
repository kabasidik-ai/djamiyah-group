import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn() utility', () => {
  it('merges class names correctly', () => {
    const result = cn('text-red-500', 'bg-blue-500')
    expect(result).toBe('text-red-500 bg-blue-500')
  })

  it('handles conditional classes', () => {
    const isActive = true
    const result = cn('base-class', isActive && 'active-class')
    expect(result).toBe('base-class active-class')
  })

  it('filters falsy values', () => {
    const result = cn('text-red-500', false, null, undefined, '')
    expect(result).toBe('text-red-500')
  })
})
