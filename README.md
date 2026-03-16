# Kira 🐰 — AI Co-Pilot for the Deaf & Hard of Hearing

> Built for the Amazon Nova AI Hackathon 2026

Kira is an Android mobile app that gives people who are deaf or have speech impairments a real voice — reading signs, classifying sounds, detecting danger, and speaking for them using Amazon Nova Lite, Nova Sonic, and Amazon Polly.

## Live Demo
- **Nova Sonic Server:** https://kira-sonic-server.onrender.com
- **Server Repo:** https://github.com/obooks29/kira-sonic-server

## Features
- **My Voice** — Type or sign to speak, powered by Nova multimodal + Amazon Polly neural TTS
- **My Ears** — Continuous sound detection with Nova AI enrichment and name detection
- **My World** — Nova scene analysis reads aloud what the camera sees
- **My Safety** — Nova writes personalised emergency SMS dispatched in 2 seconds
- **Talk** — Two-way conversation assistant with Nova quick replies
- **Caregiver Dashboard** — Daily Nova AI summaries for caregivers and family
- **BunnieAgent** — 4-step autonomous agentic emergency pipeline

## Tech Stack
- React Native 0.73 (Android)
- Amazon Nova Lite (`amazon.nova-lite-v1:0`)
- Amazon Nova 2 Sonic (`amazon.nova-2-sonic-v1:0`)
- Amazon Polly (Joanna, neural)
- AWS Bedrock (us-east-1)
- Custom AWS Signature V4 (no SDK)
- Node.js WebSocket proxy server

## Setup

### Prerequisites
- Node.js 18+
- Android Studio + Android SDK
- AWS account with IAM user having `AmazonBedrockFullAccess` + `AmazonPollyFullAccess`

### Installation
```bash
git clone https://github.com/obooks29/kira-app.git
cd kira-app
npm install
```

### Configure AWS credentials
Create `src/services/aws-config.js`:
```javascript
export const AWS_REGION           = 'us-east-1';
export const BEDROCK_ENDPOINT     = `https://bedrock-runtime.${AWS_REGION}.amazonaws.com`;
export const AWS_ACCESS_KEY_ID     = 'YOUR_AWS_ACCESS_KEY_ID';
export const AWS_SECRET_ACCESS_KEY = 'YOUR_AWS_SECRET_ACCESS_KEY';
```

### Run
```bash
# Window 1
npx react-native start --port 8083

# Window 2
npx react-native run-android --port 8083
```

## Architecture

```
React Native App
       ↓
AWS Bedrock (Nova Lite) — intelligence features
       ↓
Nova Sonic Proxy Server (Render)
       ↓
Amazon Polly — neural voice (Joanna)
       ↓
react-native-video — audio playback
```

## Nova Sonic Server
The proxy server handles the Nova 2 Sonic bidirectional streaming protocol.
Deploy your own: https://github.com/obooks29/kira-sonic-server

## Hackathon
Amazon Nova AI Hackathon 2026 — Category: Multimodal Understanding
#AmazonNova
