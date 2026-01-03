"use client";

import { inputRegistry } from "./input-registry";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

/**
 * Реєструє всі кастомні типи інпутів
 * Викликається при ініціалізації додатку
 * 
 * @example Використання слайдера в схемі:
 * {
 *   "type": "number",
 *   "title": "Pain Level",
 *   "inputType": "slider",
 *   "minimum": 0,
 *   "maximum": 10,
 *   "default": 0,
 *   "description": "Select your pain level"
 * }
 */
export function registerInputTypes() {
  // Реєструємо слайдер
  inputRegistry.register("slider", ({ value, onChange, schema }) => {
    // Визначаємо поточне значення: використовуємо value, або default, або minimum, або 0
    const numValue =
      typeof value === "number"
        ? value
        : typeof schema.default === "number"
          ? schema.default
          : typeof schema.minimum === "number"
            ? schema.minimum
            : 0;

    const min = typeof schema.minimum === "number" ? schema.minimum : 0;
    const max = typeof schema.maximum === "number" ? schema.maximum : 100;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{schema.title || ""}</Label>
          <span className="text-sm text-muted-foreground">{numValue}</span>
        </div>
        <Slider
          value={[numValue]}
          onValueChange={(values) => {
            onChange(values[0]);
          }}
          min={min}
          max={max}
        />
      </div>
    );
  });

  // Тут можна додати інші кастомні інпути
  // inputRegistry.register("checkbox", ...)
  // inputRegistry.register("custom-input", ...)
}
