# Wallet Pass API Documentation

Generate Apple Wallet (.pkpass) and Google Pay pass boarding tickets.

## Endpoints

### 1. Generate Both Passes
**POST** `/wallet-pass/generate`

Generate both Apple Wallet and Google Pay passes at once.

**Request Body:**
```json
{
  "flight": {
    "id": "SK001",
    "flightNumber": "FL-1234",
    "origin": "ATL",
    "destination": "LON",
    "departureTime": "2024-04-15T14:30:00Z",
    "baseCost": 450
  },
  "seat": {
    "seatNumber": "A1",
    "seatType": "FIRST_CLASS",
    "price": 675
  },
  "user": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "apple": {
    "filename": "Boarding_Pass_SK001_A1.pkpass",
    "passData": { ... }
  },
  "google": {
    "filename": "Boarding_Pass_SK001_A1.json",
    "passData": { ... }
  },
  "message": "Passes generated successfully"
}
```

---

### 2. Get Pass Information
**POST** `/wallet-pass/info`

Get pass metadata without generating files.

**Response:**
```json
{
  "success": true,
  "passes": {
    "apple": {
      "type": "application/vnd.apple.pkpass",
      "filename": "Boarding_Pass_SK001_A1.pkpass",
      "description": "Apple Wallet Pass"
    },
    "google": {
      "type": "application/json",
      "filename": "Boarding_Pass_SK001_A1.json",
      "description": "Google Pay Pass"
    }
  },
  "bookingDetails": {
    "flight": "FL-1234",
    "origin": "ATL",
    "destination": "LON",
    "seat": "A1",
    "seatType": "FIRST_CLASS",
    "passenger": "John Doe",
    "price": 675,
    "departureTime": "2024-04-15T14:30:00Z"
  }
}
```

---

### 3. Download Apple Wallet Pass
**POST** `/wallet-pass/download/apple`

Download Apple Wallet pass (.pkpass format).

**Response:** Binary file (application/vnd.apple.pkpass)

**Example:**
```bash
curl -X POST http://localhost:3001/wallet-pass/download/apple \
  -H "Content-Type: application/json" \
  -d '{
    "flight": {
      "id": "SK001",
      "flightNumber": "FL-1234",
      "origin": "ATL",
      "destination": "LON",
      "departureTime": "2024-04-15T14:30:00Z"
    },
    "seat": {
      "seatNumber": "A1",
      "seatType": "FIRST_CLASS",
      "price": 675
    },
    "user": "John Doe"
  }' \
  --output boarding.pkpass
```

---

### 4. Download Google Pay Pass
**POST** `/wallet-pass/download/google`

Download Google Pay pass (JSON format).

**Response:** JSON file (application/json)

**Example:**
```bash
curl -X POST http://localhost:3001/wallet-pass/download/google \
  -H "Content-Type: application/json" \
  -d '{...}' \
  --output boarding.json
```

---

## Frontend Integration

### Using the API

```javascript
import { api } from '@/services/api';
import { useDownload } from '@/hooks';

const { download, isLoading } = useDownload();

// Download Apple Wallet pass
const downloadApple = async (bookingData) => {
  await download(
    () => api.downloadAppleWalletPass(bookingData),
    'boarding.pkpass'
  );
};

// Download Google Pay pass
const downloadGoogle = async (bookingData) => {
  await download(
    () => api.downloadGooglePayPass(bookingData),
    'boarding.json'
  );
};
```

### Using Components

```jsx
import { TicketDownloadButtons } from '@/components';
import { generateTicketPDF } from '@/utils/pdfGenerator';

<TicketDownloadButtons 
  bookingData={booking}
  onPDF={() => generateTicketPDF(booking)}
  onAppleWallet={() => downloadApple(booking)}
  onGooglePay={() => downloadGoogle(booking)}
  isLoading={isLoading}
/>
```

---

## Pass Contents

### Apple Wallet Pass (.pkpass)
Contains:
- Flight number and route
- Departure date and time
- Passenger name
- Seat number and class
- Ticket price
- Barcode (128-bit)

### Google Pay Pass (JSON)
Contains:
- Event details (flight info)
- Venue (airports)
- Ticket number
- Passenger information
- Barcode
- Hero image
- Text modules

---

## Technical Details

### Apple Wallet (.pkpass)
- **Format:** ZIP archive with specific structure
- **Mime Type:** `application/vnd.apple.pkpass`
- **Compatibility:** iOS 6+, macOS 10.8+
- **Key ID:** `pass.com.skynet.boarding`

### Google Pay (JSON)
- **Format:** JSON web format
- **Mime Type:** `application/json`
- **Compatibility:** Android 5.0+
- **Class ID:** `com.skynet.boarding.pass`

---

## Error Handling

```json
{
  "success": false,
  "error": "Missing required fields: flight and seat"
}
```

Possible errors:
- 400: Missing or invalid request data
- 500: Server error during pass generation

---

## Features Completed

✅ Apple Wallet (.pkpass) generation
✅ Google Pay (JSON) pass generation
✅ Download endpoints
✅ Pass information retrieval
✅ Frontend components (TicketDownloadButtons)
✅ API integration
✅ Error handling
