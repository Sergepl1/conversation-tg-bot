# Telegram AI Responder Bot

A NestJS-based Telegram bot that uses Google Gemini AI to generate clever, humorous, and flirtatious responses to forwarded messages. The bot can automatically use your Telegram profile name to personalize its replies.

## Features

- **Gemini AI Integration**: Uses Google's latest Gemini models (e.g., Gemini 1.5 Flash, 2.5 Flash Lite) to generate high-quality text responses.
- **Smart Grouping**: Automatically accumulates multiple forwarded messages and processes them as a single context after a short pause (500ms).
- **Personalized Responses**: The bot identifies you by your Telegram profile name and generates answers "on your behalf".
- **Flexible Configuration**: Everything from the AI model and API version to the specific system prompt is configurable via environment variables.
- **Webhook & Long Polling Support**: Automatically switches between Webhooks (for production like Railway) and Long Polling (for local development).
- **Error Protection**: Includes a global exception filter to prevent Telegram from "spamming" the bot with retries if an error occurs.
- **Detailed Logging**: Tracks incoming messages and forward origins for easy monitoring.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [Yarn](https://yarnpkg.com/)
- A [Telegram Bot Token](https://t.me/botfather)
- A [Google AI API Key](https://aistudio.google.com/app/apikey)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd tg-bot-conversation
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env` and fill in your keys:
   ```bash
   cp .env.example .env
   ```

## Configuration (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Your token from @BotFather | - |
| `GEMINI_API_KEY` | Your key from Google AI Studio | - |
| `PORT` | The port the application will run on | `3000` |
| `WEBHOOK_DOMAIN` | Your public domain (set to `localhost` for Long Polling) | `localhost` |
| `GEMINI_MODEL` | The model ID (e.g., `gemini-1.5-flash`) | `gemini-1.5-flash` |
| `GEMINI_API_VERSION` | Google AI API version | `v1` |
| `GEMINI_PROMPT` | The core instructions for the AI | - |
| `MESSAGES_COUNT` | Number of variations to generate per request | `1` |

## Local Development

To run the bot locally using Long Polling:
1. Ensure `WEBHOOK_DOMAIN=localhost` in your `.env`.
2. Start the app:
   ```bash
   yarn start:dev
   ```

## Deployment (Railway)

1. Push your code to a GitHub repository.
2. Create a new project on [Railway](https://railway.app/) and connect your repo.
3. In the Railway project settings, add a public domain (Networking).
4. Set the `WEBHOOK_DOMAIN` variable to your new Railway domain (e.g., `your-app.up.railway.app`).
5. Add your `TELEGRAM_BOT_TOKEN` and `GEMINI_API_KEY`.
6. Railway will automatically build and start the bot.

## Usage

1. Open your bot in Telegram and send `/start`.
2. Forward one or more messages from any conversation to the bot.
3. Wait a moment (0.5s after the last forwarded message).
4. Receive AI-generated response variations!

## License

This project is unlicensed. Use at your own risk.
