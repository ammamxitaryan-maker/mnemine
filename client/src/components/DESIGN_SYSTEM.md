# 🎨 Modern Design System

## Обзор
Унифицированная система дизайна для всех страниц приложения, обеспечивающая симметрию, баланс и современный внешний вид.

## Основные Компоненты

### 1. PageLayout
Универсальный компонент для всех страниц с единообразным заголовком и навигацией.

```tsx
import { PageLayout } from '@/components/PageLayout';
import { SomeIcon } from 'lucide-react';

<PageLayout
  title="Page Title"
  subtitle="Optional subtitle"
  icon={SomeIcon}
  iconColor="from-blue-500 to-indigo-600" // или любой другой градиент
>
  {/* Контент страницы */}
</PageLayout>
```

### 2. ModernCard
Современная карточка с анимациями и hover эффектами.

```tsx
import { ModernCard } from '@/components/ModernCard';
import { SomeIcon } from 'lucide-react';

<ModernCard
  title="Card Title"
  icon={SomeIcon}
  iconColor="from-green-500 to-emerald-600"
  delay={0.1} // задержка анимации
  hoverEffect={true}
>
  {/* Содержимое карточки */}
</ModernCard>
```

## Цветовая Палитра

### Градиенты для иконок:
- **Blue**: `from-blue-500 to-indigo-600`
- **Green**: `from-green-500 to-emerald-600`
- **Purple**: `from-purple-500 to-pink-600`
- **Yellow**: `from-yellow-500 to-orange-600`
- **Red**: `from-red-500 to-rose-600`

### Фоны страниц:
```css
bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/30
```

## Сетка и Отступы

### Основная сетка:
```tsx
<div className="w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Контент */}
</div>
```

### Секции:
```tsx
<motion.section 
  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
  initial={{ y: 20, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ delay: 0.2, duration: 0.5 }}
>
  {/* Элементы */}
</motion.section>
```

## Анимации

### Базовые анимации:
```tsx
// Появление
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5 }}

// Hover эффект
whileHover={{ y: -4 }}
transition={{ type: "spring", stiffness: 300, damping: 20 }}

// Задержки для последовательных элементов
transition={{ delay: 0.1 + index * 0.1 }}
```

## Пример Полной Страницы

```tsx
import React from 'react';
import { PageLayout } from '@/components/PageLayout';
import { ModernCard } from '@/components/ModernCard';
import { motion } from 'framer-motion';
import { SomeIcon } from 'lucide-react';

const MyPage = () => {
  return (
    <PageLayout
      title="My Page"
      subtitle="Page description"
      icon={SomeIcon}
      iconColor="from-blue-500 to-indigo-600"
    >
      <div className="space-y-8">
        {/* Статистика */}
        <motion.section 
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <ModernCard
            title="Stat 1"
            icon={SomeIcon}
            iconColor="from-blue-500 to-indigo-600"
            delay={0.1}
          >
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">123</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Description</p>
            </div>
          </ModernCard>
        </motion.section>

        {/* Основной контент */}
        <motion.section
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {/* Ваш контент */}
        </motion.section>
      </div>
    </PageLayout>
  );
};
```

## CSS Утилиты

### Glass эффекты:
```css
.glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}
```

### Градиентный текст:
```css
.gradient-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

## Принципы

1. **Симметрия**: Все элементы выровнены по сетке
2. **Баланс**: Равномерное распределение контента
3. **Консистентность**: Единые отступы, размеры, цвета
4. **Анимации**: Плавные переходы и микро-взаимодействия
5. **Адаптивность**: Работа на всех устройствах
6. **Современность**: Glass эффекты, градиенты, тени
