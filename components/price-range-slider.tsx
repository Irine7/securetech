"use client"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"

interface PriceRangeSliderProps {
  min: number
  max: number
  initialMin: number
  initialMax: number
  step?: number
  onValueChange?: (values: [number, number]) => void
}

export function PriceRangeSlider({
  min,
  max,
  initialMin,
  initialMax,
  step = 100,
  onValueChange,
}: PriceRangeSliderProps) {
  const [values, setValues] = useState<[number, number]>([initialMin, initialMax])

  // Handle external value changes
  useEffect(() => {
    setValues([initialMin, initialMax])
  }, [initialMin, initialMax])

  const handleValueChange = (newValues: number[]) => {
    const typedValues: [number, number] = [newValues[0], newValues[1]]
    setValues(typedValues)
    if (onValueChange) {
      onValueChange(typedValues)
    }
  }

  return (
    <div className="space-y-4">
      <Slider
        min={min}
        max={max}
        step={step}
        defaultValue={values}
        onValueChange={handleValueChange}
        className="py-4"
      />
      <div className="flex justify-between text-sm">
        <span>{values[0].toLocaleString()} ₽</span>
        <span>{values[1].toLocaleString()} ₽</span>
      </div>
    </div>
  )
}
