# QR Code System - Two QR Design

## 🏷️ Two QR System Per Tag

Each RanchLink tag has **TWO QR codes**:

### 1. Overlay QR (Top - Peelable Sticker)
- **Size**: Flexible (instructions sticker)
- **Location**: Top of tag, peelable
- **URL**: `/start?token={claimToken}`
- **Purpose**: 
  - Instructions and claim setup
  - Guides user through setup wizard
  - Prepares them to claim NFT
  - Gateway to Coinbase ecosystem

### 2. Base QR (Bottom - Permanent)
- **Size**: 30mm × 30mm (exact)
- **Location**: Bottom of tag, permanent
- **URL**: `/a?id={publicId}`
- **Purpose**:
  - Direct link to public animal card
  - After claim → Shows NFT/Animal profile
  - Permanent identifier
  - Gateway to blockchain ecosystem

## 🔄 User Flow

```
1. User receives tag
   ↓
2. Scans Overlay QR (top sticker)
   → Opens: /start?token=xxx
   → Setup wizard appears
   → User enters info
   → Prepares for NFT claim
   ↓
3. User peels overlay sticker
   ↓
4. Scans Base QR (30mm × 30mm)
   → Opens: /a?id=AUS0001
   → Claims NFT (if not claimed)
   → Shows animal profile
   → Access to Coinbase ecosystem
   ↓
5. NFT Minted
   → User gets wallet
   → Token assigned
   → Public card live
```

## 🏭 Production Process

### Step 1: Generate QR Codes (Super Admin)
- Go to `/superadmin/qr-generator`
- Enter batch size (e.g., 57)
- Generate all QR codes
- Download overlay QR images
- Download base QR images

### Step 2: Print
- **Overlay QR**: Print on peelable sticker material
- **Base QR**: Print directly on tag (30mm × 30mm)

### Step 3: Apply
- Apply overlay sticker to top of tag
- Base QR is already on tag (permanent)

## 📐 Dimensions

- **Base QR**: Exactly 30mm × 30mm
- **Overlay QR**: Flexible (instructions sticker size)
- **Tag Size**: Standard cattle tag size
- **QR Code**: High contrast, scannable

## 🔐 Security

- **Claim Token**: Unique per tag, one-time use
- **Public ID**: Permanent identifier (AUS0001, etc.)
- **NFT Claim**: Links to blockchain
- **Wallet Creation**: Automatic via Coinbase Smart Wallet

## 🎯 Features

✅ **Two-QR System**: Instructions + Claimable
✅ **30mm Base QR**: Exact dimensions for production
✅ **Peelable Overlay**: Easy removal after setup
✅ **NFT Integration**: Direct claim to blockchain
✅ **Coinbase Ready**: Gateway to crypto ecosystem
✅ **Batch Generation**: Generate 57 tags at once
✅ **Print Ready**: Export for production

## 📊 QR Generator Features

- Generate batch of QR codes
- Preview overlay + base QR
- Download individual QR codes
- Print all QR codes
- Export to PDF
- CSV export for inventory

## 🚀 Next Steps

1. **Generate QR Codes** → Use super admin dashboard
2. **Print Overlay Stickers** → Apply to tags
3. **Print Base QR** → Direct on tag (30mm × 30mm)
4. **Test Flow** → Scan both QR codes
5. **Deploy** → Connect to blockchain

All QR codes are ready for production! 🎉

