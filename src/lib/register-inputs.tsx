"use client";

import { inputRegistry } from "./input-registry";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { EmotionSlider } from "@/components/trackers/LogEntryDialog/components/EmotionSlider";

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
 * 
 * @example Використання emotion-slider в схемі:
 * {
 *   "type": "string",
 *   "title": "Emotion",
 *   "inputType": "emotion-slider",
 *   "enum": ["5 - Best", "4 - Good", "3 - Neutral", "2 - Bad", "1 - Worst"],
 *   "description": "Select your emotional state"
 * }
 */
const registerInputTypes = () => {
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

  // Реєструємо emotion-slider (слайдер з іконками емоцій)
  inputRegistry.register("emotion-slider", ({ value, onChange, schema }) => {
    return <EmotionSlider value={value} onChange={onChange} schema={schema} />;
  });

  // Тут можна додати інші кастомні інпути
  // inputRegistry.register("checkbox", ...)
  // inputRegistry.register("custom-input", ...)
}

// Реєструємо одразу при завантаженні модуля (не через useEffect)
// Це гарантує, що реєстрація відбувається перед рендерингом компонентів
if (typeof window !== "undefined") {
  registerInputTypes();
}

// Експортуємо функцію для ручного виклику, якщо потрібно
export { registerInputTypes };
