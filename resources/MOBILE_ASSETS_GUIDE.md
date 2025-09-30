# VirtusGreen Mobile App Assets Guide

This guide explains how to prepare and add icons and splash screens for your iOS and Android apps.

## Quick Start - Automated Icon Generation

The easiest way to generate all required icons is using Capacitor's official asset generator:

```bash
# 1. Install the assets package
npm install @capacitor/assets --save-dev

# 2. Place your source files in the resources folder:
#    - resources/icon.png (1024x1024px, PNG with transparency)
#    - resources/splash.png (2732x2732px, PNG)

# 3. Generate all assets automatically
npx capacitor-assets generate
```

## Required Assets

### App Icon (icon.png)
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Location**: `resources/icon.png`
- **Purpose**: Main app icon shown on home screen
- **Design Tips**:
  - Use VirtusGreen brand green (#22c55e)
  - Keep design simple and recognizable at small sizes
  - Avoid text (hard to read on small icons)
  - Use earth/leaf/eco imagery

### Splash Screen (splash.png)
- **Size**: 2732x2732 pixels (safe area: 1600x1600 center)
- **Format**: PNG
- **Location**: `resources/splash.png`
- **Background**: #22c55e (VirtusGreen green)
- **Purpose**: Shown while app loads
- **Design Tips**:
  - Center important content in middle 1600x1600px
  - Use white logo/text for contrast on green background
  - Keep it simple - users only see it for 1-2 seconds

## Manual Asset Generation (Alternative)

If you prefer to create assets manually or need specific customization:

### iOS Icon Sizes Needed
Place in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`:
- 20x20, 29x29, 40x40, 58x58, 60x60, 76x76, 80x80, 87x87, 120x120, 152x152, 167x167, 180x180, 1024x1024

### Android Icon Sizes Needed
Place in respective `android/app/src/main/res/` folders:
- mipmap-ldpi (36x36)
- mipmap-mdpi (48x48)
- mipmap-hdpi (72x72)
- mipmap-xhdpi (96x96)
- mipmap-xxhdpi (144x144)
- mipmap-xxxhdpi (192x192)

### Android Splash Screens
Place in respective `android/app/src/main/res/drawable-` folders:
- drawable-land-ldpi through drawable-land-xxxhdpi
- drawable-port-ldpi through drawable-port-xxxhdpi

## Current Configuration

The app is already configured with splash screen settings in `capacitor.config.ts`:

```typescript
SplashScreen: {
  launchShowDuration: 2000,
  backgroundColor: "#22c55e",
  // ... other settings
}
```

## Next Steps

1. **Create or obtain your source icon** (1024x1024px PNG)
2. **Create or obtain your splash screen** (2732x2732px PNG)
3. **Place them in the resources folder**
4. **Run the generator**: `npx capacitor-assets generate`
5. **Rebuild your mobile apps**: `npm run build && npx cap sync`

## Design Resources

- **Figma Template**: [Capacitor App Icon Template](https://www.figma.com/community/file/1283065628092651273)
- **Icon Generator**: [AppIcon.co](https://appicon.co/)
- **Splash Generator**: [AppSplash.co](https://appsplash.co/)

## Pro Tips

- **Use vector graphics** when possible for crisp icons at all sizes
- **Test icons** on both light and dark home screen backgrounds
- **Optimize file sizes** to keep app download size small
- **Follow platform guidelines**:
  - [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)
  - [Android Material Design Icons](https://m3.material.io/styles/icons/overview)
