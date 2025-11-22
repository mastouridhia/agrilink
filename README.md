# 🌾 AgriLink

<div align="center">

**A collaborative platform for farmers to connect, share knowledge, and diagnose plant diseases**

[![React Native](https://img.shields.io/badge/React%20Native-0.76.9-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~52.0.46-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue.svg)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.14.1-orange.svg)](https://firebase.google.com/)

</div>

## 📖 Overview

AgriLink is a mobile application designed to help farmers collaborate, share agricultural knowledge, and diagnose plant diseases using AI-powered image recognition. The app enables farmers to connect with nearby peers, exchange advice, and quickly identify issues affecting their crops.

## ✨ Features

### Core Features
- **👥 Farmer Network**: Connect with nearby farmers using GPS-based location services
- **🗺️ Interactive Map**: Visualize farmer locations and organic farms on an interactive map
- **🌿 Plant Disease Diagnosis**: AI-powered plant disease identification using image recognition
- **💬 Real-time Chat**: Direct messaging and group chat functionality for farmer collaboration
- **📱 Offline Support**: Works offline with data persistence for critical features
- **🌍 Multi-language Support**: Supports Arabic and English interfaces

### Advanced Features
- **📍 Location-based Discovery**: Find farmers within a specified radius
- **🏷️ Crop Filtering**: Filter farmers by crop types (vegetables, fruits, grains)
- **🌱 Organic Farm Indicators**: Special markers for organic farms
- **📊 Plant Information**: Access detailed information about various plant species
- **👤 User Profiles**: Comprehensive farmer profiles with expertise and interests

## 🛠️ Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Maps**: React Native Maps
- **UI Library**: React Native Paper
- **Navigation**: React Navigation
- **Plant API**: Plant.id API for disease diagnosis
- **Plant Database**: Perenual API for plant information

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Git](https://git-scm.com/)

For mobile development:
- **Android**: Android Studio with Android SDK
- **iOS**: Xcode (macOS only)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/agrilink.git
cd agrilink/agrilink_v1
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Setup

Create a `.env` file in the `agrilink_v1` directory:

```bash
# Copy the example file
cp env.example.txt .env
```

Edit `.env` and add your API keys:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Plant.id API
EXPO_PUBLIC_PLANT_ID_API_KEY=your_plant_id_api_key

# Perenual API
EXPO_PUBLIC_PERENUAL_API_KEY=your_perenual_api_key

# Google OAuth
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

### 4. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Google Sign-in)
3. Create a Firestore database
4. Enable Storage
5. Copy your Firebase configuration to `.env`

### 5. Run the Application

```bash
# Start the Expo development server
npm start
# or
yarn start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web
```

## 📱 Project Structure

```
agrilink_v1/
├── src/
│   ├── components/          # Reusable UI components
│   ├── config/              # Configuration files (Firebase)
│   ├── context/             # React Context providers
│   ├── hooks/               # Custom React hooks
│   ├── navigation/          # Navigation configuration
│   ├── screens/             # Screen components
│   ├── services/            # API and business logic services
│   ├── theme/               # Theme configuration
│   └── types/               # TypeScript type definitions
├── assets/                  # Images and static assets
├── App.tsx                  # Main application component
├── app.json                 # Expo configuration
└── package.json             # Dependencies and scripts
```

## 🔐 Security Notes

⚠️ **Important**: Never commit your `.env` file to version control. The `.env.example` file is provided as a template only.

All API keys and sensitive credentials should be stored in environment variables. The app uses Expo's environment variable system (`EXPO_PUBLIC_*` prefix for client-side variables).

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- Follow TypeScript best practices
- Use functional components with hooks
- Maintain consistent naming conventions
- Add comments for complex logic
- Write meaningful commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Your Name - [@yourusername](https://github.com/yourusername)

## 🙏 Acknowledgments

- [Plant.id](https://plant.id/) for plant disease diagnosis API
- [Perenual](https://perenual.com/) for plant information database
- [Firebase](https://firebase.google.com/) for backend services
- [Expo](https://expo.dev/) for the development platform

## 📞 Support

For support, email your-email@example.com or open an issue in the repository.

## 🗺️ Roadmap

- [ ] Push notifications for new messages
- [ ] Advanced plant care recommendations
- [ ] Weather integration
- [ ] Crop yield tracking
- [ ] Marketplace for agricultural products
- [ ] Multi-language support expansion

---

<div align="center">
Made with ❤️ for farmers worldwide
</div>
