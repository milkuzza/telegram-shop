# Руководство по развертыванию Telegram Mini App E-commerce Store

## Обзор системы

Mezohit - это полнофункциональный интернет-магазин, реализованный как Telegram Mini App, способный обслуживать 10,000 пользователей в день.

### Архитектура:
- **Frontend**: React.js с TypeScript
- **Backend**: Node.js с NestJS
- **База данных**: MongoDB с Redis для кэширования
- **Веб-сервер**: Nginx
- **Контейнеризация**: Docker и Docker Compose
- **SSL**: Let's Encrypt

## Требования к серверу

### Минимальные требования:
- **CPU**: 2 ядра
- **RAM**: 4 GB
- **Диск**: 50 GB SSD
- **ОС**: Ubuntu 20.04 LTS или новее
- **Сеть**: Статический IP-адрес

### Рекомендуемые требования для 10,000 пользователей в день:
- **CPU**: 4 ядра
- **RAM**: 8 GB
- **Диск**: 100 GB SSD
- **ОС**: Ubuntu 22.04 LTS

## Шаг 1: Подготовка сервера

### 1.1 Обновление системы
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git nano htop
```

### 1.2 Установка Docker
```bash
# Удаление старых версий
sudo apt remove docker docker-engine docker.io containerd runc

# Установка зависимостей
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Добавление официального GPG ключа Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Добавление репозитория Docker
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Установка Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER
newgrp docker
```

### 1.3 Установка Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 1.4 Настройка файрвола
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw status
```

## Шаг 2: Клонирование и настройка проекта

### 2.1 Клонирование репозитория
```bash
cd /opt
sudo git clone https://github.com/your-repo/mezohit-telegram.git
sudo chown -R $USER:$USER mezohit-telegram
cd mezohit-telegram
```

### 2.2 Настройка переменных окружения
```bash
cp .env.example .env
nano .env
```

Заполните следующие переменные:
```env
# База данных
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=ваш_безопасный_пароль_mongo
MONGO_DATABASE=mezohit

# Redis
REDIS_PASSWORD=ваш_безопасный_пароль_redis

# JWT
JWT_SECRET=ваш_супер_секретный_jwt_ключ_минимум_32_символа

# Telegram Bot
TELEGRAM_BOT_TOKEN=ваш_токен_telegram_бота
TELEGRAM_WEBHOOK_URL=https://ваш_домен.com/api/telegram/webhook
REACT_APP_TELEGRAM_BOT_USERNAME=имя_вашего_бота

# API
REACT_APP_API_URL=https://ваш_домен.com/api

# Администратор
ADMIN_EMAIL=admin@mezohit.com
ADMIN_PASSWORD=ваш_безопасный_пароль_админа

# Платежи Telegram
TELEGRAM_PAYMENT_PROVIDER_TOKEN=ваш_токен_провайдера_платежей

# Email (для уведомлений)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ваш_email@gmail.com
SMTP_PASS=ваш_пароль_email
```

## Шаг 3: Настройка SSL сертификата

### 3.1 Установка Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 3.2 Получение SSL сертификата
```bash
sudo certbot certonly --standalone -d ваш_домен.com
```

### 3.3 Настройка автоматического обновления
```bash
sudo crontab -e
# Добавьте строку:
0 12 * * * /usr/bin/certbot renew --quiet
```

## Шаг 4: Запуск приложения

### 4.1 Сборка и запуск контейнеров
```bash
# Сборка образов
docker-compose build

# Запуск в фоновом режиме
docker-compose up -d

# Проверка статуса
docker-compose ps
```

### 4.2 Проверка логов
```bash
# Просмотр логов всех сервисов
docker-compose logs -f

# Просмотр логов конкретного сервиса
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
docker-compose logs -f redis
```

## Шаг 5: Настройка Telegram Bot

### 5.1 Создание бота
1. Откройте @BotFather в Telegram
2. Отправьте `/newbot`
3. Следуйте инструкциям для создания бота
4. Сохраните токен бота

### 5.2 Настройка Web App
```bash
# Установите webhook для бота
curl -X POST "https://api.telegram.org/bot<ВАШ_ТОКЕН>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://ваш_домен.com/api/telegram/webhook"}'

# Настройте меню бота
curl -X POST "https://api.telegram.org/bot<ВАШ_ТОКЕН>/setChatMenuButton" \
     -H "Content-Type: application/json" \
     -d '{"menu_button": {"type": "web_app", "text": "Open Store", "web_app": {"url": "https://ваш_домен.com"}}}'
```

### 5.3 Настройка платежей
1. Свяжитесь с @BotFather
2. Отправьте `/mybots`
3. Выберите вашего бота
4. Выберите "Payments"
5. Подключите платежного провайдера

## Шаг 6: Мониторинг и логирование

### 6.1 Установка системы мониторинга
```bash
# Создание директории для мониторинга
sudo mkdir -p /opt/monitoring
cd /opt/monitoring

# Создание docker-compose.yml для мониторинга
cat > docker-compose.monitoring.yml << EOF
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    restart: unless-stopped

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana_data:/var/lib/grafana
    restart: unless-stopped

volumes:
  grafana_data:
EOF

# Запуск мониторинга
docker-compose -f docker-compose.monitoring.yml up -d
```

### 6.2 Настройка логирования
```bash
# Настройка ротации логов
sudo nano /etc/logrotate.d/docker-containers

# Добавьте:
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=1M
    missingok
    delaycompress
    copytruncate
}
```

## Шаг 7: Резервное копирование

### 7.1 Создание скрипта резервного копирования
```bash
sudo nano /opt/backup.sh
```

Содержимое скрипта:
```bash
#!/bin/bash

BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
MONGO_CONTAINER="mezohit-mongodb"

# Создание директории для бэкапов
mkdir -p $BACKUP_DIR

# Резервное копирование MongoDB
docker exec $MONGO_CONTAINER mongodump --out /tmp/backup_$DATE
docker cp $MONGO_CONTAINER:/tmp/backup_$DATE $BACKUP_DIR/

# Сжатие бэкапа
cd $BACKUP_DIR
tar -czf mongodb_backup_$DATE.tar.gz backup_$DATE
rm -rf backup_$DATE

# Удаление старых бэкапов (старше 30 дней)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: mongodb_backup_$DATE.tar.gz"
```

### 7.2 Настройка автоматического резервного копирования
```bash
sudo chmod +x /opt/backup.sh
sudo crontab -e

# Добавьте строку для ежедневного бэкапа в 2:00
0 2 * * * /opt/backup.sh
```

## Шаг 8: Оптимизация производительности

### 8.1 Настройка MongoDB
```bash
# Подключение к MongoDB
docker exec -it mezohit-mongodb mongo -u admin -p

# Создание индексов для оптимизации
use mezohit
db.products.createIndex({ "name": "text", "description": "text" })
db.products.createIndex({ "categoryId": 1 })
db.products.createIndex({ "isActive": 1 })
db.products.createIndex({ "isFeatured": 1 })
db.users.createIndex({ "telegramId": 1 }, { unique: true })
db.orders.createIndex({ "userId": 1 })
db.orders.createIndex({ "status": 1 })
```

### 8.2 Настройка Redis
```bash
# Подключение к Redis
docker exec -it mezohit-redis redis-cli -a ваш_пароль_redis

# Настройка параметров
CONFIG SET maxmemory 1gb
CONFIG SET maxmemory-policy allkeys-lru
CONFIG REWRITE
```

### 8.3 Оптимизация Nginx
```bash
# Редактирование конфигурации Nginx
sudo nano nginx/nginx.conf

# Увеличьте worker_connections для высокой нагрузки
worker_connections 2048;

# Перезапуск Nginx
docker-compose restart nginx
```

## Шаг 9: Безопасность

### 9.1 Настройка fail2ban
```bash
sudo apt install -y fail2ban

# Создание конфигурации
sudo nano /etc/fail2ban/jail.local
```

Содержимое файла:
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10
```

### 9.2 Обновление системы безопасности
```bash
# Автоматические обновления безопасности
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Шаг 10: Тестирование и запуск

### 10.1 Проверка работоспособности
```bash
# Проверка статуса всех сервисов
docker-compose ps

# Проверка доступности API
curl -f http://localhost:3000/api/health

# Проверка фронтенда
curl -f http://localhost:3001/health

# Проверка базы данных
docker exec mezohit-mongodb mongo --eval "db.adminCommand('ismaster')"
```

### 10.2 Нагрузочное тестирование
```bash
# Установка Apache Bench
sudo apt install -y apache2-utils

# Тестирование API
ab -n 1000 -c 10 http://ваш_домен.com/api/products

# Тестирование фронтенда
ab -n 1000 -c 10 http://ваш_домен.com/
```

## Устранение неполадок

### Общие проблемы:

1. **Контейнеры не запускаются**
   ```bash
   docker-compose logs
   docker system prune -f
   ```

2. **Проблемы с базой данных**
   ```bash
   docker-compose restart mongodb
   docker exec -it mezohit-mongodb mongo --eval "db.stats()"
   ```

3. **Проблемы с SSL**
   ```bash
   sudo certbot certificates
   sudo nginx -t
   ```

4. **Высокая нагрузка**
   ```bash
   htop
   docker stats
   ```

## Масштабирование

Для увеличения нагрузки:

1. **Горизонтальное масштабирование backend**
2. **Настройка кластера MongoDB**
3. **Использование CDN для статических файлов**
4. **Настройка балансировщика нагрузки**

## Поддержка

Для получения поддержки:
- Проверьте логи: `docker-compose logs`
- Мониторинг: http://ваш_домен.com:3001 (Grafana)
- Документация API: http://ваш_домен.com/api/docs

Приложение готово к работе! 🚀
