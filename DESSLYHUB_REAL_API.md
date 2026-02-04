# 🎉 DesslyHub API - Реальная интеграция!

## ✅ Что сделано

Изучена официальная документация DesslyHub и внедрены **ВСЕ** доступные эндпоинты.

---

## 🔑 Авторизация

**Заголовок:** `apikey: YOUR_API_KEY`  
**API Key:** `b067ff3a1e7840dd9de50c627ac2b59e`  
**Base URL:** `https://desslyhub.com/api/v1`  
**Через прокси:** `/api/desslyhub` (автоматически добавляет apikey)

---

## 📋 Все доступные эндпоинты

### 1️⃣ **Merchant & Balance** (Баланс и транзакции)

#### **GET /merchants/balance**
Получить текущий баланс мерчанта

**Пример:**
```javascript
const data = await desslyHubAPI.getBalance();
// { balance: 15420.50 }
```

#### **GET /merchants/transactions?page=1**
Получить список транзакций (100 на страницу)

**Параметры:**
- `page` - номер страницы (обязательно)

**Пример:**
```javascript
const data = await desslyHubAPI.getTransactions(1);
// { transactions: [...], total: 150, page: 1 }
```

#### **GET /merchants/transaction/{id}**
Получить детали конкретной транзакции

**Пример:**
```javascript
const data = await desslyHubAPI.getTransaction('tx_123456');
```

#### **GET /status/{id}**
Проверить статус транзакции

**Пример:**
```javascript
const data = await desslyHubAPI.checkStatus('tx_123456');
// { status: 'completed', ... }
```

---

### 2️⃣ **Vouchers** (Ваучеры / Подарочные карты)

#### **GET /service/voucher/products**
Получить список всех доступных ваучеров

**Пример:**
```javascript
const data = await desslyHubAPI.getVouchers();
// { products: [...] }
```

**Структура товара:**
```json
{
  "root_id": 1,
  "variant_id": 2,
  "name": "PlayStation Plus 12 месяцев",
  "price": 4500,
  "region": "RU",
  "available": true,
  "category": "Gaming"
}
```

#### **GET /service/voucher/products/{id}**
Получить информацию о конкретном ваучере

**Пример:**
```javascript
const data = await desslyHubAPI.getVoucher(123);
```

#### **POST /service/voucher/buy**
Купить ваучер

**Body:**
```json
{
  "root_id": 1,
  "variant_id": 2,
  "reference": "order_12345"
}
```

**Пример:**
```javascript
const result = await desslyHubAPI.buyVoucher({
  root_id: 1,
  variant_id: 2,
  reference: 'customer@example.com'
});
// { voucher_code: "XXXX-YYYY-ZZZZ", ... }
```

---

### 3️⃣ **Steam** (Игры и пополнение)

#### **GET /service/steamgift/games**
Получить список доступных игр Steam

**Пример:**
```javascript
const data = await desslyHubAPI.getSteamGames();
// { games: [...] }
```

#### **GET /service/steamgift/games/{appid}**
Получить информацию об игре

**Пример:**
```javascript
const data = await desslyHubAPI.getSteamGame(730); // CS2
```

#### **POST /service/steamgift/gift**
Купить игру в подарок

**Body:**
```json
{
  "appid": 730,
  "friend_url": "https://s.team/p/abc-def/xyz"
}
```

**Пример:**
```javascript
const result = await desslyHubAPI.buySteamGift({
  appid: 730,
  friend_url: 'https://s.team/p/abc-def/xyz'
});
```

#### **POST /service/steamtopup/check_login**
Проверить возможность пополнения Steam аккаунта

**Body:**
```json
{
  "amount": 100,
  "username": "steamuser"
}
```

**Пример:**
```javascript
const result = await desslyHubAPI.checkSteamLogin({
  amount: 100,
  username: 'steamuser'
});
```

#### **POST /steam/refill**
Пополнить Steam кошелек

**Body:**
```json
{
  "amount": 500,
  "username": "steamuser"
}
```

**Пример:**
```javascript
const result = await desslyHubAPI.steamRefill({
  amount: 500,
  username: 'steamuser'
});
```

---

### 4️⃣ **Mobile** (Мобильные игры)

#### **GET /service/mobile/variant/{v}/games**
Получить список мобильных игр

**Параметры:**
- `v` - вариант (1 или 2)

**Пример:**
```javascript
const data = await desslyHubAPI.getMobileGames(1);
```

#### **POST /service/mobile/variant/{v}/games/refill**
Пополнить мобильный аккаунт

**Body:**
```json
{
  "game_id": 1,
  "account": "player123",
  "amount": 100
}
```

**Пример:**
```javascript
const result = await desslyHubAPI.mobileRefill(1, {
  game_id: 1,
  account: 'player123',
  amount: 100
});
```

---

### 5️⃣ **Currency** (Курсы валют)

#### **GET /exchange_rate/steam/{currency}**
Получить курс обмена для Steam

**Параметры:**
- `currency` - код валюты (USD, RUB, EUR и т.д.)

**Пример:**
```javascript
const data = await desslyHubAPI.getExchangeRate('RUB');
// { rate: 1.05, currency: 'RUB' }
```

---

## 🔧 Прокси конфигурация

### vite.config.js
```javascript
server: {
  proxy: {
    '/api/desslyhub': {
      target: 'https://desslyhub.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/desslyhub/, '/api/v1'),
      configure: (proxy, options) => {
        proxy.on('proxyReq', (proxyReq, req, res) => {
          proxyReq.setHeader('apikey', 'b067ff3a1e7840dd9de50c627ac2b59e');
          console.log('Proxy request:', req.method, req.url, '→', proxyReq.path);
        });
        proxy.on('proxyRes', (proxyRes, req, res) => {
          console.log('Proxy response:', proxyRes.statusCode, req.url);
        });
      }
    }
  }
}
```

**Что делает:**
- Перехватывает `/api/desslyhub/*`
- Перенаправляет на `https://desslyhub.com/api/v1/*`
- Автоматически добавляет заголовок `apikey`
- Логирует запросы и ответы

---

## 📊 Коды ошибок

| Код | Описание |
|-----|----------|
| `-1` | Внутренняя ошибка сервера |
| `-2` | Недостаточно средств на балансе |
| `-3` | Неправильная сумма |
| `-4` | Ошибка валидации (неправильное тело запроса) |
| `-5` | Доступ запрещен (неверный API ключ) |
| `-151` | Неверный ID транзакции |
| `-152` | Транзакция не найдена |

---

## 🚀 Примеры использования

### Пример 1: Получить баланс
```javascript
try {
  const data = await desslyHubAPI.getBalance();
  console.log('Баланс:', data.balance, '₽');
} catch (error) {
  console.error('Ошибка:', error.message);
}
```

### Пример 2: Купить ваучер
```javascript
try {
  // 1. Получить список товаров
  const products = await desslyHubAPI.getVouchers();
  
  // 2. Выбрать товар
  const product = products.products[0];
  
  // 3. Купить
  const result = await desslyHubAPI.buyVoucher({
    root_id: product.root_id,
    variant_id: product.variant_id,
    reference: 'customer@example.com'
  });
  
  console.log('Код:', result.voucher_code);
} catch (error) {
  console.error('Ошибка:', error.message);
}
```

### Пример 3: Отправить Steam гифт
```javascript
try {
  // 1. Получить список игр
  const games = await desslyHubAPI.getSteamGames();
  
  // 2. Выбрать игру
  const game = games.games.find(g => g.appid === 730); // CS2
  
  // 3. Отправить подарок
  const result = await desslyHubAPI.buySteamGift({
    appid: game.appid,
    friend_url: 'https://s.team/p/abc-def/xyz'
  });
  
  console.log('Подарок отправлен!');
} catch (error) {
  console.error('Ошибка:', error.message);
}
```

### Пример 4: Пополнить Steam
```javascript
try {
  // 1. Проверить логин
  const check = await desslyHubAPI.checkSteamLogin({
    amount: 500,
    username: 'steamuser'
  });
  
  if (check.valid) {
    // 2. Пополнить
    const result = await desslyHubAPI.steamRefill({
      amount: 500,
      username: 'steamuser'
    });
    
    console.log('Пополнение выполнено!');
  }
} catch (error) {
  console.error('Ошибка:', error.message);
}
```

---

## ✅ Готово!

**Все эндпоинты DesslyHub интегрированы!**

**Доступно:**
- ✅ Баланс и транзакции
- ✅ Ваучеры (покупка)
- ✅ Steam игры (гифты)
- ✅ Steam пополнение
- ✅ Мобильные игры
- ✅ Курсы валют

**Сервер:** http://localhost:5173/

**Проверьте консоль для логов прокси!** 🚀
