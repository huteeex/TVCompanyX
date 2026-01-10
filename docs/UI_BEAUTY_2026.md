# UI Beauty 2026 — Design System Documentation

## 🎨 Выбранная палитра: **Premium Indigo + Warm Peach**

### Почему эта палитра?

Вариант **Б (Premium Indigo + Warm Peach)** выбран как самый модный и актуальный тренд 2025–2026 года, который идеально подходит для SaaS-платформ в сфере рекламы и маркетинга:

- **Primary Indigo** (#4F46E5 / #4338CA) — создаёт ощущение профессионализма, надёжности и инновационности
- **Warm Peach** (#FB923C / #EA580C) — добавляет энергии, креативности и внимания к CTA-элементам
- **Teal Accent** (#0D9488) — для положительной статистики и успешных метрик
- **Нейтральные тона** — максимально чистый slate/neutral для текста и фонов

## 🎯 Визуальное направление

### Философия дизайна

**Минимализм с акцентом на функциональность** — каждый элемент имеет цель, нет декоративной перегруженности.

Основные принципы:
- **Много воздуха** — generous padding/margins (16-24px минимум)
- **Мягкие тени** вместо резких — shadow-soft, shadow-soft-lg, shadow-glow
- **Закруглённые углы** — rounded-xl (12px) и rounded-2xl (16px)
- **Тонкие границы** — border thickness 1px, цвет neutral-200/50
- **Градиенты только в акцентах** — кнопки, иконки, hero-элементы

### Типографика

```
Шрифт: Inter (Variable Font)
- Hero: 48-60px, weight 700, letter-spacing -0.02em
- Section Title: 36px, weight 600, letter-spacing -0.01em
- Body: 15-16px, line-height 1.5-1.6
- Small: 14px, для вторичного текста
```

### Spacing System

```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
3xl: 64px
```

## 🎬 Анимации (Framer Motion)

### Основные паттерны

**Появление блоков при скролле:**
```tsx
<motion.div
  initial={{ y: 20, opacity: 0 }}
  whileInView={{ y: 0, opacity: 1 }}
  viewport={{ once: true }}
  transition={{ duration: 0.7 }}
>
```

**Hover эффект для карточек:**
```tsx
<motion.div
  whileHover={{ y: -8, transition: { duration: 0.3 } }}
  className="transition-shadow duration-300 hover:shadow-soft-lg"
>
```

**Stagger Children (последовательное появление):**
```tsx
const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    }
  }
}

const item = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
}

<motion.div variants={container} initial="hidden" animate="visible">
  {items.map(item => (
    <motion.div key={item.id} variants={item}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

### Timing Functions

```
Smooth: cubic-bezier(0.4, 0, 0.2, 1)
Duration: 0.25-0.7s в зависимости от элемента
```

## 🧩 Компоненты

### Button

5 вариантов: `primary | secondary | outline | ghost | danger`

```tsx
import { Button } from '@/components/ui/FormElements'

<Button variant="primary" size="lg" icon={<ArrowRight />}>
  Начать работу
</Button>
```

### Card / StatCard

```tsx
import { Card, StatCard } from '@/components/ui/Card'

<StatCard
  label="Активных кампаний"
  value="1.2K+"
  change={12}
  changeType="increase"
  icon={<TrendingUp className="h-6 w-6 text-white" />}
  gradient="from-primary-500 to-primary-600"
/>
```

### Input / Select

```tsx
import { Input, Select } from '@/components/ui/FormElements'

<Input
  label="Email"
  placeholder="you@company.com"
  icon={<Mail className="h-4 w-4" />}
  error={errors.email}
/>
```

## 🎨 Tailwind Утилиты

### Новые цвета

```css
primary-600    /* Основной indigo */
accent-500     /* Тёплый оранжевый */
teal-600       /* Для успешных метрик */
neutral-950    /* Тёмный текст */
neutral-50     /* Светлый фон */
```

### Тени

```css
shadow-soft        /* Лёгкая тень для карточек */
shadow-soft-lg     /* Увеличенная тень при hover */
shadow-glow        /* Свечение для primary элементов */
shadow-glow-accent /* Свечение для accent элементов */
```

### Анимации

```css
animate-fade-in-up
animate-scale-in
animate-breathe    /* Лёгкая пульсация */
animate-float      /* Плавное плавание вверх-вниз */
```

## 📦 Структура файлов

```
src/
├── components/
│   ├── ui/
│   │   ├── Card.tsx           # Карточки и статистика
│   │   └── FormElements.tsx   # Кнопки, инпуты, селекты
│   ├── layout/
│   │   ├── Header.tsx         # Модернизированный хедер
│   │   └── Sidebar.tsx        # Современный сайдбар
│   └── dashboard/
│       └── Dashboard.tsx      # Компонент дашборда с графиками
├── utils/
│   └── animations.ts          # Готовые анимационные пресеты
└── pages/
    └── index.tsx              # Переработанная главная страница
```

## 🚀 Использование

### Импорт компонентов

```tsx
import { Button, Input } from '@/components/ui/FormElements'
import { Card, StatCard } from '@/components/ui/Card'
import { fadeInUp, staggerContainer } from '@/utils/animations'
import { motion } from 'framer-motion'
```

### Пример страницы с анимациями

```tsx
export default function MyPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="max-w-7xl mx-auto px-4 py-12"
      >
        <h1 className="text-section text-neutral-950 mb-8">
          Заголовок страницы
        </h1>
        
        <div className="grid grid-cols-3 gap-6">
          {/* Контент */}
        </div>
      </motion.div>
    </div>
  )
}
```

## ✨ Ключевые улучшения

1. **Главная страница** — полностью переработана с hero-блоком, анимациями scroll reveal, floating stats
2. **Навигация** — современный Header с backdrop blur и animated dropdown, Sidebar с плавными переходами
3. **Компоненты** — система карточек, кнопок, форм в едином стиле
4. **Dashboard** — красивые виджеты статистики с иконками и трендами
5. **Анимации** — деликатные Framer Motion transitions на всех элементах

## 🎯 Результат

После редизайна сайт выглядит как продукт из портфолио ведущего европейского digital-агентства 2026 года — чисто, стильно, функционально, с perfect attention to detail в каждой анимации и микроинтеракции.
