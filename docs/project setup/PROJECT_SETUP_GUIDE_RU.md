# Руководство по настройке проекта

Это руководство поможет вам настроить проект GetSpace.uz локально и развернуть его в облаке.

## 📋 Предварительные требования

- Node.js (>=14)
- Docker и Docker Compose
- Git
- PostgreSQL (если не используете Docker)

## 🏠 Настройка локальной разработки

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Настройка переменных окружения

Этот проект требует два отдельных `.env` файла:

#### Файл `.env` на корневом уровне
```bash
cp .env.example .env
```

#### Файл `.env` на уровне клиента
```bash
cp client/.env.example client/.env
```

Заполните необходимые переменные окружения в обоих файлах:

**Корневой `.env` (Конфигурация бэкенда):**
- `CLOUDINARY_*`: Учетные данные Cloudinary
- `ESKIZ_*`: Учетные данные SMS сервиса
- `CLICK_*`: Учетные данные платежного шлюза Click.uz
- `PAYME_*`: Учетные данные платежного шлюза Payme
- `OCTO_*`: Учетные данные платежного шлюза Octo

**Клиентский `.env` (Конфигурация фронтенда):**
- `VITE_API_BASE_URL`: URL бэкенд API (http://localhost:4000/api для локальной разработки)
- `VITE_TELEGRAM_BOT_USERNAME`: Имя пользователя Telegram бота
- `VITE_YANDEX_GEOCODER_API_KEY`: API ключ Yandex для геокодирования
- `VITE_GOOGLE_MAPS_API_KEY`: API ключ Google Maps
- `VITE_PROTECTION_PLAN_PERCENTAGE`: Процент плана защиты (например, 20)

### 3. Настройка базы данных

Запустите PostgreSQL с помощью Docker Compose:

```bash
docker-compose up -d postgres
```

Это выполнит:
- Создание контейнера PostgreSQL на порту 5433
- Создание базы данных `conferencehub`
- Настройка пользователя `postgres` с паролем `postgres`

### 4. Установка зависимостей

#### Установка корневых зависимостей:
```bash
npm install
```

#### Установка клиентских зависимостей:
```bash
cd client
npm install
cd ..
```

### 5. Запуск серверов разработки

Запустите и бэкенд, и фронтенд в режиме разработки:

```bash
npm run dev
```

Эта команда:
- Запустит API сервер на http://localhost:4000
- Запустит Vite dev сервер на http://localhost:5173
- Включит горячую перезагрузку для фронтенда и бэкенда

### 7. Доступ к приложению

- **Фронтенд**: http://localhost:5173
- **Бэкенд API**: http://localhost:4000/api
- **База данных**: localhost:5433

---

## ☁️ Развертывание в облаке (Render.com)

### 1. Настройка Render.com

Проект включает файл `render.yaml` для простого развертывания на Render.com.

#### Необходимая конфигурация сервисов:

1. **Веб-сервис**: `conferencehub-app`
2. **База данных**: `conferencehub-db` (PostgreSQL)

### 2. Настройка переменных окружения

Настройте следующие переменные окружения в вашей панели управления Render:

#### Основная конфигурация
- `NODE_ENV=production`
- `PORT=10000`
- `DB_URL`: Автоматически настраивается из подключения к базе данных

#### Ключи сторонних сервисов

##### Cloudinary (Хранение изображений/видео)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

**Инструкции по настройке:**
1. Создайте аккаунт на [cloudinary.com](https://cloudinary.com)
2. Получите учетные данные из Панель управления → Настройки → API ключи
3. Настройте предустановки загрузки и трансформации по необходимости

##### SMS сервис Eskiz
- `ESKIZ_EMAIL`
- `ESKIZ_SECRET_CODE`
- `ESKIZ_BASE_URL=https://notify.eskiz.uz/api`
- `ESKIZ_FROM`

**Инструкции по настройке:**
1. Зарегистрируйтесь на [eskiz.uz](https://eskiz.uz)
2. Получите API учетные данные из вашей панели управления
3. При необходимости отправьте новые SMS шаблоны на одобрение
4. Смотрите примеры Eskiz в [docs/ESKIZ_SUBMISSION_TEMPLATES.md](../ESKIZ_SUBMISSION_TEMPLATES.md)

##### Платежные шлюзы

**Click.uz:**
- `CLICK_MERCHANT_ID`
- `CLICK_SERVICE_ID`
- `CLICK_CHECKOUT_LINK`
- `CLICK_SECRET_KEY`

Справочная документация: [Пользовательские истории Click](../CLICK_PAYMENT_INTEGRATION.md)

**Payme:**
- `PAYME_MERCHANT_ID`
- `PAYME_SECRET_KEY`
- `PAYME_TEST_KEY`
- `VITE_PAYME_MERCHANT_ID`

Справочная документация: [Пользовательские истории Payme](../PAYME_INTEGRATION_EPIC.md)

**Octo:**
- `OCTO_SECRET`
- `OCTO_SHOP_ID`

Справочная документация: [Пользовательские истории Octo](../payment-spike.md)

**Инструкции по настройке:**
1. Зарегистрируйте мерчант аккаунты у каждого платежного провайдера
2. Завершите процесс верификации
3. Обращайтесь к документации каждого провайдера для конфигурации. Click - единственный провайдер, у которого мы получаем успешный платеж, в то время как остальные полагаются на webhooks. Причина в том, что Click не отправляет уведомления на международные серверы и разрешает только локальные узбекские серверы.
4. Тестируйте в sandbox режиме перед запуском в production. Payme предоставляет sandbox окружение

##### Карты и геокодирование

**Google Maps API:**
- `VITE_GOOGLE_MAPS_API_KEY`

**Yandex Geocoder API:**
- `VITE_YANDEX_GEOCODER_API_KEY`

**Инструкции по настройке:**
1. **Google Maps**: Включите Maps JavaScript API, Places API и Geocoding API в Google Cloud Console
2. **Yandex**: Зарегистрируйтесь на [developer.tech.yandex.com](https://developer.tech.yandex.com) и получите API ключ Geocoder
3. Настройте ограничения API и лимиты использования

##### Аутентификация Telegram бота
- `TELEGRAM_GATEWAY_TOKEN`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME`
- `VITE_TELEGRAM_BOT_USERNAME`

**Инструкции по настройке:**
1. Создайте бота через [@BotFather](https://t.me/botfather) в Telegram
2. Получите токен и имя пользователя бота
3. Настройте домены Telegram Login Widget. Для локального запуска вам нужен ngrok со статическим URL.

### 3. Конфигурация домена

Установите ваш production домен в переменных окружения:
- `PRODUCTION_DOMAIN=getspace.uz`
- `PRODUCTION_URL=https://getspace.uz`
- `FRONTEND_URL=https://getspace.uz`
- `CLIENT_BASE_URL=https://getspace.uz`
- `CORS_ALLOWED_ORIGINS=["https://getspace.uz", "https://www.getspace.uz"]`

### 4. Развертывание на Render

1. Подключите ваш GitHub репозиторий к Render
2. Создайте сервисы на основе `render.yaml`
3. Установите все переменные окружения
4. Разверните

---

## 🔧 Детали конфигурации

### Настройки миграции базы данных
- `MIGRATIONS_ONLY=true`: Запускать только миграции, не автосинхронизацию
- `DB_AUTOSYNC=false`: Отключить автоматическую синхронизацию базы данных (рекомендуется для production)

### Конфигурация платежей
- `PROTECTION_PLAN_PERCENTAGE=20`: Установить процент плана защиты (20%)

### Региональные настройки
Приложение поддерживает несколько валют и языков:
- **Языки**: Русский (RU), Узбекский (UZ), Английский (EN)
- **Валюты**: UZS, RUB, USD, EUR
- **API конвертации валют**: Доступен по адресам `/api/currency/rates/:baseCurrency` и `/api/currency/convert`
  - Использует внешний Exchange Rate API (https://open.er-api.com) с кэшированием на 1 час
  - Утилиты конвертации в `client/src/utils/currencyUtils.js`
  - Провайдер контекста валют в `client/src/contexts/CurrencyContext.jsx`

---

## 🚀 Чек-лист для production

Перед запуском убедитесь:

- [ ] Все API ключи настроены и действительны
- [ ] Платежные шлюзы установлены в production режим
- [ ] Webhook URL правильно настроены
- [ ] SSL сертификаты установлены
- [ ] Резервные копии базы данных настроены
- [ ] Мониторинг ошибок настроен
- [ ] DNS домена правильно настроен
- [ ] CORS источники правильно установлены
- [ ] Все аккаунты сторонних сервисов верифицированы

---

## 📚 Дополнительные ресурсы

- [Документация Cloudinary](https://cloudinary.com/documentation)
- [Eskiz SMS API](https://documenter.getpostman.com/view/663428/RzfmES4z)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Yandex Geocoder API](https://yandex.com/dev/maps/geocoder/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Руководство по развертыванию Render](https://render.com/docs)

---

## 🆘 Устранение неполадок

### Распространенные проблемы

1. **Проблемы подключения к базе данных**
   - Проверьте, запущен ли контейнер PostgreSQL: `docker ps`
   - Проверьте переменные окружения в `.env`

2. **Ошибки API ключей**
   - Убедитесь, что все необходимые API ключи установлены в переменных окружения
   - Проверьте разрешения API ключей и лимиты использования

3. **Проблемы платежных шлюзов**
   - Проверьте доступность webhook URL
   - Проверьте, находятся ли платежные провайдеры в правильном режиме (test/production)

4. **Ошибки сборки**
   - Очистите node_modules и переустановите: `rm -rf node_modules package-lock.json && npm install`
   - Проверьте совместимость версии Node.js

### Получение помощи

- Проверьте issues проекта на GitHub
- Изучите API документацию сторонних сервисов
- Обратитесь к команде разработки

---

*Последнее обновление: Сентябрь 2025*