<div align="center">

# 📱 BAZZAR Staff Mobile

**Мобильное приложение для сотрудников BAZZAR**  
*Построено как Telegram Mini App*

[![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646cff?logo=vite)](https://vitejs.dev/)
[![Telegram](https://img.shields.io/badge/Telegram-Mini%20App-26a5e4?logo=telegram)](https://core.telegram.org/bots/webapps)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ecf8e?logo=supabase)](https://supabase.com/)

[Демо](#) · [Документация](#-документация) · [Отчет об ошибке](https://github.com/Tvinck/bazzar-staff-mobile/issues)

</div>

---

## ✨ Возможности

### 🎨 Telegram Mini Apps SDK (9/9 фич)
- ✅ **Back Button** - навигация назад
- ✅ **Main Button** - основная кнопка действия
- ✅ **Popup Dialogs** - нативные диалоги
- ✅ **Biometric Auth** - биометрическая аутентификация
- ✅ **Settings Button** - кнопка настроек
- ✅ **Swipe Behavior** - управление свайпами
- ✅ **Cloud Storage** - облачное хранилище
- ✅ **QR Scanner** - сканер QR-кодов
- ✅ **Dynamic Theme** - динамическая тема

### 🔐 Аутентификация
- 📧 Email/Password регистрация
- 🔢 OTP верификация через Supabase
- 🔒 PIN-код для быстрого входа
- 👆 Биометрическая аутентификация

### 💰 DesslyHub Integration
- 💵 Просмотр баланса (USD/RUB)
- 🎫 Выдача ваучеров
- 🎮 Steam гифты
- 💳 Пополнение Steam кошелька
- 📊 История транзакций
- 📋 Детальная информация о заказах

### 📊 Дополнительный функционал
- 🖥️ Мониторинг системы
- 👥 Управление персоналом
- 🔌 Интеграция с сервисами
- ⚡ Real-time обновления

---

## 🚀 Быстрый старт

### Требования
- Node.js 18+
- npm или yarn
- Supabase аккаунт
- Telegram Bot Token

### Установка

```bash
# Клонировать репозиторий
git clone https://github.com/Tvinck/bazzar-staff-mobile.git
cd bazzar-staff-mobile

# Установить зависимости
npm install

# Создать .env файл
cp .env.example .env
```

### Настройка .env

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

### Запуск

```bash
# Development сервер
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

Приложение будет доступно по адресу `http://localhost:5173`

---

## 📁 Структура проекта

```
bazzar-staff-mobile/
├── 📂 src/
│   ├── 📂 components/       # React компоненты
│   ├── 📂 pages/           # Страницы приложения
│   │   ├── 📂 services/    # Страницы сервисов
│   │   │   ├── DesslyHub.jsx
│   │   │   ├── Monitoring.jsx
│   │   │   └── Staff.jsx
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   └── Profile.jsx
│   ├── 📂 services/        # API клиенты
│   │   ├── desslyHub.js
│   │   └── supabase.js
│   ├── 📂 hooks/           # Custom React hooks
│   ├── 📂 utils/           # Утилиты
│   └── App.jsx             # Главный компонент
├── 📂 supabase/
│   └── 📂 migrations/      # SQL миграции
├── 📂 public/              # Статические файлы
├── 📄 vite.config.js       # Vite конфигурация
├── 📄 tailwind.config.js   # TailwindCSS конфигурация
└── 📄 package.json         # Зависимости
```

---

## 🗄️ База данных

### Supabase Setup

1. Создайте проект в [Supabase](https://supabase.com)
2. Скопируйте URL и anon key в `.env`
3. Запустите миграции:

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

---

## 🔧 Технологии

<div align="center">

| Категория | Технологии |
|-----------|-----------|
| **Frontend** | React 18, Vite 7 |
| **Styling** | TailwindCSS, Framer Motion |
| **Backend** | Supabase |
| **API** | DesslyHub, Telegram Bot API |
| **State** | React Query, Context API |
| **UI** | Lucide Icons, Sonner |

</div>

---

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

---

## 🎨 Дизайн

- 🌙 Темная тема по умолчанию
- ✨ Glassmorphism эффекты
- 🎨 Градиенты и анимации
- 📱 Адаптивный дизайн
- 🔵 Нативные Telegram элементы

---

## 📚 Документация

Подробная документация доступна в папке проекта:

- [`TELEGRAM_FEATURES_REPORT.md`](TELEGRAM_FEATURES_REPORT.md) - Telegram SDK интеграция
- [`DESSLYHUB_INTEGRATION_REPORT.md`](DESSLYHUB_INTEGRATION_REPORT.md) - DesslyHub API
- [`REGISTRATION_GUIDE.md`](REGISTRATION_GUIDE.md) - Система регистрации
- [`SESSION_SUMMARY.md`](SESSION_SUMMARY.md) - Общая сводка

---

## 🔐 Безопасность

- 🔒 Row Level Security (RLS) в Supabase
- 🎫 JWT токены для аутентификации
- 🔑 PIN-код шифруется локально
- 🔐 API ключи через переменные окружения
- 🛡️ CORS настроен через Vite proxy

---

## 🚧 Roadmap

- [ ] Интеграция с Mighty
- [ ] Расширенная аналитика
- [ ] Push уведомления
- [ ] Экспорт отчетов
- [ ] Мультиязычность

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m '✨ Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 👥 Authors

- **BAZZAR Team** - *Initial work*

---

## 📞 Support

- 💬 Telegram: [@your_support_bot](https://t.me/your_support_bot)
- 📧 Email: support@bazzar.com
- 🐛 Issues: [GitHub Issues](https://github.com/Tvinck/bazzar-staff-mobile/issues)

---

## 🌟 Скриншоты

<div align="center">

### 🏠 Главная страница
*Красивый дизайн с glassmorphism эффектами*

### 💰 DesslyHub
*Управление балансом и транзакциями*

### 👤 Профиль
*Настройки и персонализация*

</div>

---

## 📊 Статистика

<div align="center">

![GitHub repo size](https://img.shields.io/github/repo-size/Tvinck/bazzar-staff-mobile)
![GitHub code size](https://img.shields.io/github/languages/code-size/Tvinck/bazzar-staff-mobile)
![GitHub last commit](https://img.shields.io/github/last-commit/Tvinck/bazzar-staff-mobile)

</div>

---

<div align="center">

**Made with ❤️ by BAZZAR Team**

⭐ Star us on GitHub — it helps!

[⬆ Back to top](#-bazzar-staff-mobile)

</div>
