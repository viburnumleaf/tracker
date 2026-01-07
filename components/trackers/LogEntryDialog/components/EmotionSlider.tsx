"use client";

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { JsonSchemaProperty } from "@/src/api/trackers/trackers.api";
import { Smile, Meh, Frown, Annoyed, Laugh } from "lucide-react";

type EmotionSliderProps = {
  value: unknown;
  onChange: (value: unknown) => void;
  schema: JsonSchemaProperty;
}

// Видобуваємо числове значення з enum (наприклад "5 - Best" -> 5)
const extractNumberFromEnum = (enumValue: string): number => {
  const match = enumValue.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

// Видобуваємо текст з enum (наприклад "5 - Best" -> "Best")
const extractTextFromEnum = (enumValue: string): string => {
  const parts = enumValue.split(" - ");
  return parts.length > 1 ? parts[1] : enumValue;
}

// Map кольорів для емоцій
const EMOTION_COLORS: Record<string, string> = {
  "5": "#58b556", // green
  "4": "#91ca66", // light green
  "3": "#f7d129", // yellow
  "2": "#ed7844", // orange
  "1": "#f04e5f", // red
};

// Компонент для відображення іконки емоції
const EmotionIcon = ({ value }: { value: string }) => {
  const numValue = extractNumberFromEnum(value).toString();
  const iconSize = "size-6";
  const color = EMOTION_COLORS[numValue] || EMOTION_COLORS["3"];

  switch (numValue) {
    case "5":
      return <Laugh className={iconSize} style={{ color }} />;
    case "4":
      return <Smile className={iconSize} style={{ color }} />;
    case "3":
      return <Meh className={iconSize} style={{ color }} />;
    case "2":
      return <Annoyed className={iconSize} style={{ color }} />;
    case "1":
      return <Frown className={iconSize} style={{ color }} />;
    default:
      return <Meh className={iconSize} style={{ color }} />;
  }
}

export const EmotionSlider = ({ value, onChange, schema }: EmotionSliderProps) => {
  const enumValues = schema.enum || [];

  // Сортуємо enum значення за числовим значенням (від найменшого до найбільшого, щоб best було справа)
  const sortedEnumValues = [...enumValues].sort((a, b) => {
    return extractNumberFromEnum(a) - extractNumberFromEnum(b);
  });

  // Визначаємо поточне значення
  const currentValue =
    typeof value === "string" ? value : sortedEnumValues[0] || "";
  const currentIndex = sortedEnumValues.findIndex((v) => v === currentValue);
  const sliderValue = currentIndex >= 0 ? currentIndex : 0;

  // Мінімальне та максимальне значення для слайдера (індекси)
  const min = 0;
  const max = sortedEnumValues.length - 1;

  const handleSliderChange = (values: number[]) => {
    const selectedIndex = values[0];
    const selectedValue = sortedEnumValues[selectedIndex];
    if (selectedValue) {
      onChange(selectedValue);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{schema.title || ""}</Label>
        <span className="text-sm text-muted-foreground">
          {extractTextFromEnum(currentValue)}
        </span>
      </div>

      {/* Слайдер з іконками */}
      <div className="relative">
        <Slider
          value={[sliderValue]}
          onValueChange={handleSliderChange}
          min={min}
          max={max}
          step={1}
          className="mb-8"
        />

        {/* Іконки під слайдером */}
        <div className="flex justify-between items-center -mt-6 px-1">
          {sortedEnumValues.map((enumValue, index) => {
            const numValue = extractNumberFromEnum(enumValue).toString();
            const isActive = index === sliderValue;

            return (
              <button
                key={enumValue}
                type="button"
                onClick={() => handleSliderChange([index])}
                className={`flex flex-col items-center gap-1 transition-all mt-2 ${
                  isActive ? "opacity-100" : "opacity-40 hover:opacity-70"
                }`}
              >
                <div
                  className={
                    isActive
                      ? "scale-125 transition-transform"
                      : "transition-transform"
                  }
                >
                  <EmotionIcon value={enumValue} />
                </div>
                <span className="text-xs text-muted-foreground">
                  {numValue}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
