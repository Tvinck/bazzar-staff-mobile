# 🎨 Bazzar Staff Mobile - Design & Animation Upgrade

## ✅ Выполненные улучшения

### 1. **Telegram Premium Dark Theme**
- Базовый цвет: `#1c1c1e` (как в нативном iOS/Telegram)
- Вторичный: `#2c2c2e`
- Акцент: `#007aff` (iOS Blue)
- Все цвета доступны через Tailwind: `bg-tg-bg`, `bg-tg-secondary`, `text-tg-link`

### 2. **Плавные анимации**
- **Page Transitions**: Плавные переходы между страницами с iOS-easing
- **Haptic Feedback**: Тактильная обратная связь при навигации
- **Micro-animations**: Skeleton loading, shimmer effects, tap animations

### 3. **Glassmorphism**
Утилиты для эффекта матового стекла:
- `.glass-panel` - полупрозрачная панель с blur
- `.glass-card` - карточка с тенью
- `.fintech-card` - градиентная карточка

### 4. **Mobile-First оптимизация**
- Safe Area Insets (для iPhone с вырезом)
- Скрытие scrollbar
- Отключение text-selection (app-like feel)
- `-webkit-tap-highlight-color: transparent`

## 🚀 Запуск

```bash
cd /Users/macbookpro/Desktop/BAZZAR\ PRODJECT\'S/BAZZAR\ MARKET/bazzar-staff-mobile
npm run dev
```

Приложение доступно на: **http://localhost:5173/**

## 🎯 Кастомные Tailwind классы

```jsx
// Цвета
<div className="bg-tg-bg text-tg-text">
<button className="bg-tg-link">

// Анимации
<div className="animate-fade-in">
<div className="animate-slide-up">
<div className="animate-scale-in">

// Glassmorphism
<div className="glass-panel">
<div className="glass-card">

// Tap effects
<button className="tap-active">
```

## 📱 Особенности

1. **Адаптивность**: Полная поддержка iPhone notch/Dynamic Island
2. **Производительность**: Lazy loading страниц, оптимизированные анимации
3. **PWA**: Работает как нативное приложение
4. **Offline**: Кеширование через Service Worker

## 🔧 Технологии

- React 19
- Vite 7
- Tailwind CSS 3
- Framer Motion 12
- Supabase
- React Query

## ⚠️ Примечания

Предупреждения `Unknown at rule @tailwind` в IDE — это нормально. 
PostCSS корректно обрабатывает эти директивы при сборке.

Для отключения предупреждений добавьте в `.vscode/settings.json`:
```json
{
  "css.lint.unknownAtRules": "ignore"
}
```
