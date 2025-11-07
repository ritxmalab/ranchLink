# 🎨 View All Dashboards & Frames

## Quick Access

Run: `pnpm dev` then navigate to these URLs:

### 🏠 **Homepage**
- **URL**: `http://localhost:3000/`
- **What to see**: Hero, pricing, how it works

### ➕ **Claim Flow**
- **URL**: `http://localhost:3000/start`
- **What to see**: Step-by-step claim wizard

### 🐄 **Animal Card**
- **URL**: `http://localhost:3000/a?id=AUS0001`
- **What to see**: Public animal profile

### 📊 **Dashboard**
- **URL**: `http://localhost:3000/dashboard`
- **What to see**: Owner dashboard with animals grid

### 🛒 **Marketplace**
- **URL**: `http://localhost:3000/market`
- **What to see**: Product cards

### 🏭 **Super Admin Factory** ⭐ NEW!
- **URL**: `http://localhost:3000/superadmin`
- **What to see**: 
  - Dashboard with stats
  - Batch creation
  - Inventory management
  - **QR Code Generator**

### 🏭 **QR Generator** ⭐ NEW!
- **URL**: `http://localhost:3000/superadmin/qr-generator`
- **What to see**:
  - Generate batch of QR codes
  - Preview overlay QR (instructions)
  - Preview base QR (30mm × 30mm claimable)
  - Download individual QR codes
  - Print all QR codes
  - Export for production

## 🎯 What You'll See in Super Admin

### Dashboard Tab
- Total tags count
- Claimed count
- Available count
- Pending count

### Batches Tab
- Create new batch form
- Batch name, model, color, count
- Generate QR codes button

### Inventory Tab
- Table of all tags
- Tag ID, Public ID, Status
- Preview QR button

### QR Generator Tab ⭐
- **Batch size input** (default: 57)
- **Generate button**
- **Grid of QR codes** showing:
  - **Overlay QR** (instructions/claim setup)
  - **Base QR** (30mm × 30mm claimable)
- **Download buttons** for each QR
- **Print all** button
- **Export PDF** button

## 🏷️ Two QR System Preview

Each tag shows:
1. **Overlay QR** (top)
   - Blue border
   - "Instructions" label
   - URL: `/start?token=xxx`
   
2. **Base QR** (bottom)
   - Orange border (30mm × 30mm)
   - "Claimable NFT" label
   - URL: `/a?id=AUS0001`

## 📋 QR Generator Features

✅ **Generate 57 tags at once**
✅ **Preview both QR codes**
✅ **Download individual QR images**
✅ **Print all QR codes**
✅ **Export to PDF** (coming soon)
✅ **30mm × 30mm base QR** (exact dimensions)
✅ **Production-ready** output

## 🚀 Try It Now

1. **Start dev server**: `pnpm dev`
2. **Go to**: `http://localhost:3000/superadmin/qr-generator`
3. **Enter batch size**: 57
4. **Click**: "Generate QR Codes"
5. **See**: All 57 tags with overlay + base QR codes
6. **Download**: Individual QR codes
7. **Print**: All QR codes for production

## 📐 QR Code Specifications

- **Base QR**: 30mm × 30mm (exact)
- **Overlay QR**: Flexible size (instructions)
- **High contrast**: Black on white
- **Scannable**: All QR readers
- **Print-ready**: 300 DPI recommended

## 🎨 Design Highlights

- **Clean grid layout**
- **Color-coded borders** (blue = overlay, orange = base)
- **Clear labels** for each QR type
- **Download buttons** for each QR
- **Print-optimized** layout
- **Production-ready** output

## 🔄 Next Steps

After viewing QR generator:
1. **Generate your 57 tags**
2. **Download QR codes**
3. **Print overlay stickers** (peelable)
4. **Print base QR** (30mm × 30mm on tag)
5. **Test the flow** (scan both QR codes)
6. **Connect crypto** (NFT claiming, Coinbase wallet)

Everything is ready! Navigate to `/superadmin/qr-generator` to see it! 🚀

