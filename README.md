# 📱 BAZZAR Staff Mobile

Мобильное приложение для сотрудников BAZZAR, построенное как Telegram Mini App.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.3-61dafb.svg)
![Vite](https://img.shields.io/badge/Vite-7.3-646cff.svg)
![Telegram](https://img.shields.io/badge/Telegram-Mini%20App-26a5e4.svg)

## ✨ Возможности

### 🎨 Telegram Mini Apps SDK (9/9 фич)
- ✅ Back Button - навигация назад
- ✅ Main Button - основная кнопка действия
- ✅ Popup Dialogs - нативные диалоги
- ✅ Biometric Auth - биометрическая аутентификация
- ✅ Settings Button - кнопка настроек
- ✅ Swipe Behavior - управление свайпами
- ✅ Cloud Storage - облачное хранилище
- ✅ QR Scanner - сканер QR-кодов
- ✅ Dynamic Theme - динамическая тема

### 🔐 Аутентификация
- Email/Password регистрация
- OTP верификация через Supabase
- PIN-код для быстрого входа
- Биометрическая аутентификация

### 💰 DesslyHub Integration
- Просмотр баланса (USD/RUB)
- Выдача ваучеров
- Steam гифты
- Пополнение Steam кошелька
- История транзакций
- Детальная информация о заказах

### 📊 Функционал
- Мониторинг системы
- Управление персоналом
- Интеграция с сервисами
- Реал-тайм обновления

## 🚀 Быстрый старт

### Требования
- Node.js 18+
- npm или yarn
- Supabase аккаунт
- Telegram Bot Token

### Установка

```bash
# Клонировать репозиторий
git clone https://github.com/YOUR_USERNAME/bazzar-staff-mobile.git
cd bazzar-staff-mobile

# Установить зависимости
npm install

# Создать .env файл
cp .env.example .env

# Настроить переменные окружения
# Отредактируйте .env файл
```

### Настройка .env

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

### Запуск

```bash
# Development
npm run dev

# Build
npm run build

# Preview
npm run preview
```

## 📁 Структура проекта

```
bazzar-staff-mobile/
├── src/
│   ├── components/       # React компоненты
│   ├── pages/           # Страницы приложения
│   │   ├── services/    # Страницы сервисов
│   │   │   ├── DesslyHub.jsx
│   │   │   ├── Monitoring.jsx
│   │   │   └── Staff.jsx
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   └── Profile.jsx
│   ├── services/        # API клиенты
│   │   ├── desslyHub.js
│   │   └── supabase.js
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Утилиты
│   └── App.jsx          # Главный компонент
├── supabase/
│   └── migrations/      # SQL миграции
├── public/              # Статические файлы
└── docs/               # Документация
```

## 🗄️ База данных

### Supabase Setup

1. Создайте проект в [Supabase](https://supabase.com)
2. Запустите миграции:

```bash
# Установите Supabase CLI
npm install -g supabase

# Войдите в Supabase
supabase login

# Примените миграции
supabase db push
```

### Таблицы

- `profiles` - профили пользователей
- `staff` - данные сотрудников
- `transactions` - история операций

## 🔧 Технологии

- **Frontend**: React 18, Vite 7
- **Styling**: TailwindCSS, Framer Motion
- **Backend**: Supabase
- **API**: DesslyHub, Telegram Bot API
- **State**: React Query, Context API
- **UI**: Lucide Icons, Sonner (toasts)

## 📱 Telegram Mini App

### Настройка бота

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Получите токен
3. Настройте Mini App:
   ```
   /newapp
   /setmenubutton
   ```
4. Укажите URL вашего приложения

### Web App URL

```
https://your-domain.com
```

## 🎨 Дизайн

- Темная тема по умолчанию
- Glassmorphism эффекты
- Градиенты и анимации
- Адаптивный дизайн
- Нативные Telegram элементы

## 📚 Документация

Подробная документация доступна в папке проекта:

- `TELEGRAM_FEATURES_REPORT.md` - Telegram SDK интеграция
- `DESSLYHUB_INTEGRATION_REPORT.md` - DesslyHub API
- `REGISTRATION_GUIDE.md` - Система регистрации
- `SESSION_SUMMARY.md` - Общая сводка

## 🔐 Безопасность

- Row Level Security (RLS) в Supabase
- JWT токены для аутентификации
- PIN-код шифруется локально
- API ключи через переменные окружения
- CORS настроен через Vite proxy

## 🚧 Roadmap

- [ ] Интеграция с Mighty
- [ ] Расширенная аналитика
- [ ] Push уведомления
- [ ] Экспорт отчетов
- [ ] Мультиязычность

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

## 👥 Authors

- BAZZAR Team

## 📞 Support

- Telegram: [@your_support_bot](https://t.me/your_support_bot)
- Email: support@bazzar.com

---

Made with ❤️ by BAZZAR Team
