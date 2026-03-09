# LUNA Backend (api.lunarisma.online)

## Start

```bash
npm install --omit=dev
cp .env.example .env
npm start
```

## Wichtige ENV-Werte

- `OPENAI_API_KEY`
- `PORT` (bei Proxy oft `8787`)
- `EMAIL_NOTIFICATIONS_ENABLED=true`
- `NOTIFY_TO_EMAIL=joycemansamba@ymail.com`
- `SMTP_HOST=smtp.mail.yahoo.com`
- `SMTP_PORT=465`
- `SMTP_SECURE=true`
- `SMTP_USER=...`
- `SMTP_PASS=...`
- `SMTP_FROM=LUNA Chat <...>`

## Reverse Proxy

Stelle sicher, dass `https://api.lunarisma.online` auf diesen Node-Prozess zeigt.
