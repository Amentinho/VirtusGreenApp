# VirtusGreen Mobile App Deployment Guide

## ✅ Setup Complete!

Your VirtusGreen app is now ready for iOS and Android deployment. This guide will walk you through publishing to both app stores.

---

## 📱 Current Setup

### Installed & Configured:
- ✅ Capacitor 7.4.3 (latest)
- ✅ iOS platform (`ios/` folder created)
- ✅ Android platform (`android/` folder created)
- ✅ 6 Native plugins:
  - Camera (for barcode scanning)
  - Preferences (for local storage)
  - Push Notifications (requires APNs/FCM setup - see below)
  - Splash Screen
  - Status Bar
  - Share (for native sharing)

### Configuration Files:
- ✅ `capacitor.config.ts` - Main Capacitor configuration
- ✅ App ID: `com.virtusgreen.app`
- ✅ App Name: `VirtusGreen`
- ✅ Brand color: #22c55e (green)

---

## 🚀 Quick Start Commands

```bash
# Build web app and sync to mobile platforms
npm run build
npx cap sync

# Open projects in native IDEs
npx cap open ios       # Opens Xcode (requires Mac)
npx cap open android   # Opens Android Studio

# Update native apps after code changes
npm run build && npx cap sync
```

---

## 📋 Prerequisites

### For iOS (App Store):
- ✅ **Mac computer** (required for iOS builds)
- ✅ **Xcode** (download from Mac App Store)
- ✅ **Apple Developer Account** ($99/year)
  - Sign up at: https://developer.apple.com
- ✅ **App icons and splash screens** (see `resources/MOBILE_ASSETS_GUIDE.md`)

### For Android (Google Play):
- ✅ **Android Studio** (works on Mac, Windows, Linux)
  - Download: https://developer.android.com/studio
- ✅ **Google Play Developer Account** ($25 one-time fee)
  - Sign up at: https://play.google.com/console
- ✅ **App icons and splash screens** (see `resources/MOBILE_ASSETS_GUIDE.md`)

---

## 🔔 Push Notifications Setup (Optional but Recommended)

Push notifications are installed but require additional configuration for both platforms.

### iOS - Apple Push Notification Service (APNs)

1. **Enable Push Capability in Xcode**:
   ```bash
   npx cap open ios
   ```
   - Select project → Signing & Capabilities
   - Click "+ Capability"
   - Add "Push Notifications"

2. **Create APNs Key** (Recommended Method):
   - Go to https://developer.apple.com/account
   - Certificates, Identifiers & Profiles → Keys
   - Create new Key → Enable "Apple Push Notifications service (APNs)"
   - Download .p8 file (save securely - can't download again!)
   - Note the Key ID and Team ID

3. **Update Info.plist**:
   ```xml
   <key>UIBackgroundModes</key>
   <array>
     <string>remote-notification</string>
   </array>
   ```

4. **Request Permission in Code** (add to your app):
   ```typescript
   import { PushNotifications } from '@capacitor/push-notifications';
   
   const registerPush = async () => {
     let permStatus = await PushNotifications.checkPermissions();
     
     if (permStatus.receive === 'prompt') {
       permStatus = await PushNotifications.requestPermissions();
     }
     
     if (permStatus.receive === 'granted') {
       await PushNotifications.register();
     }
   };
   ```

### Android - Firebase Cloud Messaging (FCM)

1. **Create Firebase Project**:
   - Go to https://console.firebase.google.com
   - Create new project (or use existing)
   - Add Android app with package name: `com.virtusgreen.app`

2. **Download google-services.json**:
   - Download from Firebase Console
   - Place in `android/app/google-services.json`

3. **Update AndroidManifest.xml**:
   ```xml
   <!-- Add to manifest tag -->
   <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
   ```

4. **Add Firebase to build.gradle**:
   ```gradle
   // In android/build.gradle (project level)
   buildscript {
     dependencies {
       classpath 'com.google.gms:google-services:4.4.0'
     }
   }
   
   // In android/app/build.gradle (app level)
   apply plugin: 'com.google.gms.google-services'
   
   dependencies {
     implementation 'com.google.firebase:firebase-messaging:23.4.0'
   }
   ```

5. **Request Runtime Permission** (Android 13+):
   ```typescript
   // Add to your app for Android 13+
   if (Capacitor.getPlatform() === 'android') {
     const { receive } = await PushNotifications.requestPermissions();
     if (receive === 'granted') {
       await PushNotifications.register();
     }
   }
   ```

6. **Rebuild after Firebase setup**:
   ```bash
   npx cap sync android
   npx cap open android
   # Build → Clean Project
   # Build → Rebuild Project
   ```

---

## 🍎 iOS App Store Deployment

### Step 1: Prepare App Assets
```bash
# 1. Create app icon (1024x1024) and save as resources/icon.png
# 2. Create splash screen (2732x2732) and save as resources/splash.png
# 3. Generate all sizes
npm install @capacitor/assets --save-dev
npx capacitor-assets generate --ios
```

### Step 2: Configure in Xcode
```bash
# Open iOS project
npx cap open ios
```

In Xcode:
1. **Set Bundle Identifier**: Select project → General → Bundle Identifier: `com.virtusgreen.app`
2. **Set Display Name**: Change to "VirtusGreen"
3. **Set Version**: Set to 1.0.0
4. **Configure Signing**:
   - Select project → Signing & Capabilities
   - Check "Automatically manage signing"
   - Select your Apple Developer team
5. **Add Capabilities**:
   - Camera Usage (already configured)
   - Push Notifications (if needed)

### Step 3: Update Info.plist Permissions
Add these privacy descriptions in `ios/App/App/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to scan product barcodes</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need access to view and select product images</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>We need access to save product images to your photo library</string>
```

**Important**: These permissions are required or Apple will reject your app!

### Step 4: Build and Archive
1. In Xcode: Product → Archive
2. Wait for build to complete (~5-10 minutes)
3. Window → Organizer → Select archive → Distribute App
4. Choose "App Store Connect"
5. Upload to Apple

### Step 5: Submit in App Store Connect
1. Go to https://appstoreconnect.apple.com
2. Create new app:
   - Name: VirtusGreen
   - Primary Language: English
   - Bundle ID: com.virtusgreen.app
   - SKU: virtusgreen-001
3. Fill out app information:
   - **Description**: Focus on eco-friendly shopping and token rewards
   - **Keywords**: eco, green, sustainable, environment, barcode, shopping
   - **Screenshots**: Required for all iPhone sizes (use iOS Simulator)
   - **Privacy Policy URL**: (Required - host on your domain)
4. Select build and submit for review

**Review Time**: Typically 1-7 days

---

## 🤖 Android (Google Play) Deployment

### Step 1: Prepare App Assets
```bash
# Generate Android icons
npx capacitor-assets generate --android
```

### Step 2: Configure in Android Studio
```bash
# Open Android project
npx cap open android
```

In Android Studio:
1. **Update app/build.gradle**:
   ```gradle
   android {
       defaultConfig {
           applicationId "com.virtusgreen.app"
           versionCode 1
           versionName "1.0.0"
       }
   }
   ```

2. **Update strings.xml** (`android/app/src/main/res/values/strings.xml`):
   ```xml
   <string name="app_name">VirtusGreen</string>
   <string name="title_activity_main">VirtusGreen</string>
   ```

3. **Add permissions** in `AndroidManifest.xml`:
   ```xml
   <uses-permission android:name="android.permission.CAMERA" />
   <uses-permission android:name="android.permission.INTERNET" />
   <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
   ```
   
   **Note**: `POST_NOTIFICATIONS` is required for Android 13+ (API 33+) to show notifications. You must also request this permission at runtime in your app code.

### Step 3: Generate Signed APK/Bundle
1. In Android Studio: Build → Generate Signed Bundle / APK
2. Choose "Android App Bundle" (required for Play Store)
3. Create new keystore:
   - **Key store path**: Save securely (you'll need this for updates!)
   - **Password**: Choose strong password (save it!)
   - **Key alias**: virtusgreen
   - **Validity**: 25 years
4. Build release bundle (takes ~3-5 minutes)

### Step 4: Submit to Google Play Console
1. Go to https://play.google.com/console
2. Create new app:
   - App name: VirtusGreen
   - Default language: English
   - App or game: App
   - Free or paid: Free
3. Complete store listing:
   - **Short description** (80 chars): "Discover eco-friendly products and earn rewards"
   - **Full description** (4000 chars): Detailed app description
   - **App icon**: 512x512 PNG
   - **Feature graphic**: 1024x500 PNG
   - **Screenshots**: At least 2 per device type
   - **App category**: Shopping or Lifestyle
   - **Privacy Policy URL**: (Required)
4. Upload release:
   - Production → Create release
   - Upload AAB file
   - Release name: 1.0.0
   - Release notes: "Initial release"
5. Complete content rating questionnaire
6. Submit for review

**Review Time**: Typically 1-3 days (faster than iOS)

---

## 🔄 Updating Your App

### After Code Changes:
```bash
# 1. Build web app
npm run build

# 2. Sync to mobile platforms
npx cap sync

# 3a. For iOS: Open Xcode and archive new version
npx cap open ios

# 3b. For Android: Generate new signed bundle
npx cap open android
```

### Version Numbering:
- **iOS**: Increment version in Xcode (e.g., 1.0.0 → 1.0.1)
- **Android**: Increment `versionCode` and `versionName` in `build.gradle`

---

## 📝 Required Legal Documents

### Privacy Policy (Required for both stores)
Create a privacy policy covering:
- What data you collect (email, barcode scans, tokens)
- How you use it (product search, rewards, profile)
- Third-party services (OpenFoodFacts API, SendGrid)
- User rights (data deletion, access)

**Host it on your domain**: `https://virtusgreen.com/privacy`

**Free generators**:
- https://www.privacypolicygenerator.info/
- https://www.freeprivacypolicy.com/

### Terms of Service (Recommended)
- User conduct rules
- Token system terms
- Refund policy
- Account termination terms

---

## 🎯 App Store Optimization (ASO)

### Keywords to Target:
- eco friendly shopping
- sustainable products
- green shopping
- environmental impact
- barcode scanner
- eco rewards

### Screenshot Tips:
1. **Home screen** - Show main barcode scanner
2. **Product details** - Environmental metrics visualization
3. **Token rewards** - Show token earning and marketplace
4. **Profile** - Display gamification features
5. **Marketplace** - Coupon redemption interface

### Description Template:
```
🌱 Discover Eco-Friendly Products & Earn Rewards!

VirtusGreen helps you make environmentally conscious purchasing decisions. 
Scan product barcodes to see detailed environmental impact metrics and 
earn tokens for green shopping choices.

✨ KEY FEATURES:
• 📱 Instant barcode scanning
• 🌍 Environmental impact analysis
• 🎁 Token rewards system
• 🏆 Gamified challenges
• 🛒 Coupon marketplace
• 👥 Referral program

💚 WHY VIRTUSGREEN?
Make every purchase count toward a greener future. Our app provides 
real environmental data from trusted sources, helping you choose 
sustainable products effortlessly.

🎯 EARN & REDEEM:
• Scan products to earn tokens
• Complete your profile for bonuses
• Share on social media for rewards
• Redeem tokens for exclusive coupons

Download now and start your eco-friendly shopping journey!
```

---

## 🐛 Troubleshooting

### iOS Build Issues:
- **"No development team"**: Sign in to Xcode with Apple Developer account
- **"Provisioning profile failed"**: Enable automatic signing
- **"Code signing error"**: Check certificate in Keychain Access

### Android Build Issues:
- **"Gradle build failed"**: Update Gradle in Android Studio
- **"Signing key not found"**: Re-generate signed bundle
- **"Permission denied"**: Check AndroidManifest.xml permissions

### Capacitor Issues:
- **"Web assets not found"**: Run `npm run build` first
- **"Plugin not installed"**: Run `npx cap sync` after adding plugins
- **"Native code out of sync"**: Run `npx cap sync` after updates

---

## 📊 Launch Checklist

### Pre-Launch (Do These First):
- [ ] Create app icons (1024x1024 for iOS, 512x512 for Android)
- [ ] Create splash screens (2732x2732)
- [ ] Write privacy policy and host it online
- [ ] Create Apple Developer account ($99/year)
- [ ] Create Google Play Developer account ($25 one-time)
- [ ] Take app screenshots on real devices/simulators
- [ ] Test app thoroughly on iOS and Android devices
- [ ] Write app description and store listing

### iOS Submission:
- [ ] Configure in Xcode (bundle ID, signing)
- [ ] Add privacy permissions to Info.plist
- [ ] Build and archive app
- [ ] Upload to App Store Connect
- [ ] Complete app information
- [ ] Add screenshots for all sizes
- [ ] Submit for review

### Android Submission:
- [ ] Configure in Android Studio (app ID, version)
- [ ] Generate signed App Bundle (.aab)
- [ ] Create Google Play Console listing
- [ ] Upload App Bundle
- [ ] Add screenshots and graphics
- [ ] Complete content rating
- [ ] Submit for review

### Post-Launch:
- [ ] Monitor crash reports (Xcode/Play Console)
- [ ] Respond to user reviews
- [ ] Plan version 1.1 features
- [ ] Set up analytics (optional)
- [ ] Promote app to existing users

---

## 🎉 Success Metrics

Track these metrics after launch:
- Downloads/Installs
- Daily Active Users (DAU)
- Retention Rate (Day 1, Day 7, Day 30)
- Token Earning Rate
- Coupon Redemption Rate
- User Reviews & Ratings
- Crash-Free Rate (aim for >99%)

---

## 🆘 Support Resources

- **Capacitor Docs**: https://capacitorjs.com/docs
- **iOS Human Interface Guidelines**: https://developer.apple.com/design/human-interface-guidelines
- **Android Material Design**: https://m3.material.io/
- **App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Google Play Policy**: https://play.google.com/about/developer-content-policy/

---

## 💡 Pro Tips

1. **Start with Android** - Faster approval, easier testing
2. **Use TestFlight** - Beta test iOS app before public release
3. **Enable crash reporting** - Catch issues before users complain
4. **Soft launch** - Release in one country first to test
5. **Update regularly** - Monthly updates improve store ranking
6. **Respond to reviews** - Engagement boosts visibility
7. **Cross-promote** - Link iOS app in Android description and vice versa

---

## 🚀 Next Steps

1. **Create app assets** - Follow `resources/MOBILE_ASSETS_GUIDE.md`
2. **Set up developer accounts** - Apple & Google
3. **Build and test** - Use simulators and real devices
4. **Submit to stores** - Follow checklists above
5. **Monitor and iterate** - Track metrics and improve

**Estimated Timeline to Launch**: 2-4 weeks
- Week 1: Asset creation, account setup
- Week 2: iOS build and submission
- Week 3: Android build and submission  
- Week 4: Reviews, fixes, launch!

Good luck with your app launch! 🎉🌱
