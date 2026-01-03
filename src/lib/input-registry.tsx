import * as React from "react";
import { JsonSchemaProperty } from "@/src/api/trackers/trackers.api";

export type CustomInputRenderer = (props: {
  value: unknown;
  onChange: (value: unknown) => void;
  schema: JsonSchemaProperty;
  index?: number;
  label?: string;
}) => React.ReactNode;

type InputTypeRegistry = Map<string, CustomInputRenderer>;

class InputRegistry {
  private registry: InputTypeRegistry = new Map();

  /**
   * Реєструє кастомний тип інпута
   */
  register(type: string, renderer: CustomInputRenderer): void {
    this.registry.set(type, renderer);
  }

  /**
   * Отримує renderer для типу інпута, або fallback якщо тип не знайдено
   */
  get(
    type: string | undefined,
    fallbackType?: "checkbox" | "slider" | "number" | "text"
  ): CustomInputRenderer | null {
    if (!type) return null;

    const renderer = this.registry.get(type);
    if (renderer) return renderer;

    // Якщо тип не знайдено і є fallback, повертаємо null
    // (fallback буде оброблено в LogEntryDialog)
    return null;
  }

  /**
   * Перевіряє чи зареєстрований тип
   */
  has(type: string): boolean {
    return this.registry.has(type);
  }
}

// Експортуємо singleton instance
export const inputRegistry = new InputRegistry();
