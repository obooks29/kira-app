# SenseVoice 🤲👂💬🛡️
### The AI Co-Pilot for the Deaf and Mute

> Built for the Amazon Nova AI Hackathon  
> Powered by Amazon Nova 2 Sonic · Nova Multimodal Embeddings · Nova 2 Lite · Nova Act

---

## 🌍 What is SenseVoice?

SenseVoice gives 70 million deaf and mute people worldwide:
- **A voice** — sign language to speech in real time
- **Ears** — ambient sound classification and safety alerts  
- **Conversation** — two-way live chat with anyone, no interpreter needed
- **Safety** — one-shake SOS with GPS to emergency contacts
- **Independence** — a Duolingo-style system that celebrates every milestone

---

## 📱 Screens Overview

| Screen | Phase | Description |
|--------|-------|-------------|
| Welcome | Onboarding | Animated 4-slide introduction |
| Onboarding | Setup | Name, voice, caregiver setup |
| Home | Core | Dashboard with XP, goals, module grid |
| My Voice | Phase 1 | Sign language → speech + type mode |
| Quick Phrases | Phase 1 | 200+ phrases across 7 categories |
| My Ears | Phase 2 | Always-on sound classification |
| Conversation | Phase 2 | Two-way live conversation |
| My World | Phase 2 | Scene understanding via camera |
| My Safety | Phase 3 | SOS, Emergency ID card, contacts |
| Caregiver | Phase 3 | Parent/carer daily summary dashboard |
| Milestones | Phase 3 | XP, levels, achievement system |
| Personalize | Phase 4 | Voice personality + sign language |
| Language Packs | Phase 4 | Domain vocabulary bundles |
| Profile | Shared | User stats, streaks, quick links |
| Settings | Shared | Accessibility + alert preferences |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- React Native CLI
- Android Studio (Android) or Xcode (iOS/Mac)
- Java JDK 17+

### Installation

```bash
# 1. Install dependencies
npm install

# 2. iOS only (Mac)
cd ios && pod install && cd ..

# 3. Configure AWS
# Edit src/services/aws-config.js with your credentials

# 4. Run on Android
npx react-native run-android

# 5. Run on iOS (Mac only)
npx react-native run-ios
```

### AWS Setup

1. Create an AWS account at [aws.amazon.com](https://aws.amazon.com)
2. Enable **Amazon Bedrock** in `us-east-1`
3. Request access to **Amazon Nova** models (Nova Lite, Nova Sonic)
4. Create an IAM user with `AmazonBedrockFullAccess`
5. Add credentials to `src/services/aws-config.js`

---

## 🏗️ Architecture

```
SenseVoice
├── App.js                          # Root component
├── src/
│   ├── theme/                      # Material Design 3 tokens
│   ├── utils/AppContext.js         # Global state (useReducer)
│   ├── services/
│   │   ├── NovaService.js          # All Amazon Nova API calls
│   │   └── aws-config.js          # AWS credentials
│   ├── navigation/AppNavigator.js  # Stack + Tab navigation
│   ├── components/common/          # Reusable UI components
│   └── screens/
│       ├── onboarding/             # Welcome + Setup
│       ├── home/                   # Dashboard
│       ├── phase1/                 # My Voice, Quick Phrases
│       ├── phase2/                 # My Ears, Conversation, My World
│       ├── phase3/                 # Safety, Caregiver, Milestones
│       ├── phase4/                 # Personalize, Language Packs
│       └── shared/                 # Profile, Settings
```

---

## 🤖 Amazon Nova Integration

| Feature | Nova Model | Usage |
|---------|-----------|-------|
| Sign language recognition | Nova Multimodal Embeddings | Camera frame analysis |
| Text naturalisation | Nova 2 Lite | Make spoken text feel natural |
| Sound classification | Nova 2 Sonic + Nova 2 Lite | Ambient sound → alert category |
| Speech transcription | Nova 2 Sonic | Real-time speech-to-text |
| Quick reply suggestions | Nova 2 Lite | Contextual conversation replies |
| Scene understanding | Nova Multimodal Embeddings | Camera scene → plain language |
| Emergency dispatch | Nova Act | SOS automation, contact alerting |
| Daily summary | Nova 2 Lite | Caregiver natural language report |

---

## 🎨 Design System

- **Framework**: Material Design 3
- **Palette**: Warm Teal (trust/safety) + Coral (joy/warmth) + Amber (celebration)
- **Inspiration**: Duolingo's emotional warmth + Material You's expressiveness
- **Accessibility**: WCAG 2.1 AA, haptic-first, high contrast option

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| react-navigation | Stack + tab navigation |
| react-native-linear-gradient | Hero gradients |
| react-native-camera | Sign language capture |
| react-native-tts | Text-to-speech |
| react-native-voice | Speech recognition |
| react-native-haptic-feedback | Vibration alerts |
| react-native-reanimated | Smooth animations |
| lottie-react-native | Milestone celebration animations |

---

## 👥 Target Users

- **Primary**: Deaf and mute individuals (ages 8-65)
- **Secondary**: Caregivers, family members, teachers, healthcare workers
- **Market**: Nigeria (launch), then Ghana, Kenya, UK, USA

---

## 📄 License

MIT — Built with love for a more inclusive world.

*"The measure of a society is how it treats those who cannot speak for themselves."*
*SenseVoice exists to change that.*
