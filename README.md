# 🛡️ GitGuard AI

Automated Pull Request Reviewer powered by Groq AI (Llama 3)

## What it does
GitGuard AI automatically reviews Pull Requests on GitHub using AI. When a developer opens a PR, it:
- Fetches the code diff using Octokit
- Sends it to Groq AI for analysis
- Posts a structured review comment back to GitHub
- All in under 5 seconds!

## Tech Stack
- Node.js + Express
- GitHub Webhooks
- Octokit SDK
- Groq AI (Llama 3)
- Ngrok (for local tunneling)

## Features
- Bug detection
- Security vulnerability scanning
- Code quality suggestions
- Auto fix suggestions
- Internal dashboard

## Setup
1. Clone the repo
2. Run npm install
3. Add .env file with your keys
4. Run node index.js
5. Start ngrok

## Environment Variables
- WEBHOOK_SECRET
- GITHUB_TOKEN
- GROQ_API_KEY
- PORT

How It Works
1. GitHub PR triggers webhook
2. Webhook receives event
3. Diff is fetched from GitHub
4. AI analyzes code
5. Review is:
   - Posted to PR
   - Saved in `reviews.log`

Review Logging Feature (Week 4)

This project includes a review logging feature that stores AI-generated code review results in a file.
