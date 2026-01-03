# Features Layer

Цей шар містить бізнес-логіку та хуки для роботи з фічами.

## Структура

```
src/features/
└── auth/
    └── hooks/
        ├── index.ts        # Експорт всіх хуків
        ├── useAuth.ts      # Хук для отримання сесії
        ├── useLogin.ts     # Хук для входу
        ├── useRegister.ts  # Хук для реєстрації
        ├── useLogout.ts    # Хук для виходу
        └── useUser.ts      # Хук для отримання даних користувача
```

## Принципи

1. **Інкапсуляція**: Кожна фіча має свою папку з усією необхідною логікою
2. **Хуки орієнтовані на API**: Всі хуки використовують API шар (`src/api/`)
3. **TanStack Query**: Всі хуки використовують TanStack Query для кешування та управління станом

## Створення нової фічі

1. Створіть папку для фічі: `src/features/your-feature/`
2. Створіть API методи в `src/api/your-feature/your-feature.api.ts`
3. Створіть хуки в `src/features/your-feature/hooks/`:

```typescript
// src/features/your-feature/hooks/useYourFeature.ts
import { useQuery } from "@tanstack/react-query";
import { yourFeatureApi, YourType } from "@/api/your-feature/your-feature.api";

export const useYourFeature = () => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<YourType>({
    queryKey: ["your-feature"],
    queryFn: yourFeatureApi.getData,
    staleTime: 5 * 60 * 1000,
  });

  return {
    data,
    isLoading,
    error,
    refetch,
  };
};
```

4. Експортуйте хуки в `hooks/index.ts`:

```typescript
export { useYourFeature } from "./useYourFeature";
```

## Використання в компонентах

```typescript
"use client";

import { useYourFeature } from "@/src/features/your-feature/hooks";

export default function YourComponent() {
  const { data, isLoading } = useYourFeature();

  if (isLoading) return <div>Loading...</div>;

  return <div>{data?.name}</div>;
}
```

