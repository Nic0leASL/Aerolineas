# Frontend Components & Validation

## 🎨 Components

Todos los componentes están en `src/components/`:

### DashboardCard
```jsx
import { DashboardCard } from '@/components';
import { Users } from 'lucide-react';

<DashboardCard 
  title="Total Passengers" 
  value="1,234" 
  icon={Users}
  color="blue"
/>
```

### SearchInput
```jsx
import { SearchInput } from '@/components';

<SearchInput 
  placeholder="Search flights..." 
  value={search}
  onChange={(value) => setSearch(value)}
  onSearch={handleSearch}
/>
```

### FlightCard
```jsx
import { FlightCard } from '@/components';

<FlightCard 
  flight={flightData}
  onSelect={handleSelectFlight}
  isSelected={selectedId === flight.id}
  showPrice={true}
/>
```

### FilterControl
```jsx
import { FilterControl } from '@/components';

<FilterControl 
  label="Origin"
  type="text"
  value={origin}
  onChange={setOrigin}
  placeholder="ATL"
  required
/>
```

### Alert
```jsx
import { Alert } from '@/components';

<Alert 
  type="success" 
  title="Success!" 
  message="Booking completed"
  onClose={handleClose}
  autoClose={5000}
/>
```

### TicketDownloadButtons
```jsx
import { TicketDownloadButtons } from '@/components';

<TicketDownloadButtons 
  bookingData={booking}
  onPDF={downloadPDF}
  onAppleWallet={downloadApplePass}
  onGooglePay={downloadGooglePass}
  isLoading={isLoading}
/>
```

## ✅ Validation

### Using Validation Schemas
```jsx
import { validationRules } from '@/utils/validationSchemas';
import { useForm } from 'react-hook-form';

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: (data) => {
    // Apply validation rules
    return { values: data, errors: {} };
  }
});
```

### Custom Hooks

#### useFormAsync
```jsx
import { useFormAsync } from '@/hooks';

const { isLoading, error, success, handleSubmit } = useFormAsync(
  async (data) => {
    const result = await api.bookSeat(data);
    return result;
  }
);
```

#### useDownload
```jsx
import { useDownload } from '@/hooks';

const { download, isLoading, error } = useDownload();

const handleDownloadPDF = async () => {
  await download(() => generateTicketPDF(booking), 'ticket.pdf');
};
```

## 📱 API Integration

### Wallet Pass Downloads

```jsx
import { api } from '@/services/api';
import { useDownload } from '@/hooks';

const { download, isLoading } = useDownload();

// Download Apple Wallet Pass
const downloadApple = async (bookingData) => {
  await download(
    () => api.downloadAppleWalletPass(bookingData),
    'boarding.pkpass'
  );
};

// Download Google Pay Pass
const downloadGoogle = async (bookingData) => {
  await download(
    () => api.downloadGooglePayPass(bookingData),
    'boarding.json'
  );
};
```

## 🎯 Best Practices

1. **Always use provided components** - Don't create inline JSX
2. **Use hooks for async operations** - useFormAsync, useDownload
3. **Validate with validationRules** - Located in utils/validationSchemas
4. **Import from component index** - `import { Component } from '@/components'`
5. **Handle errors gracefully** - Display Alert component

## 📦 Export Structure

```
components/
  ├── DashboardCard.jsx
  ├── SearchInput.jsx
  ├── FlightCard.jsx
  ├── FilterControl.jsx
  ├── Alert.jsx
  ├── EmptyState.jsx
  ├── TicketDownloadButtons.jsx
  ├── LoadingButton.jsx
  └── index.js

hooks/
  ├── useFormAsync.js
  ├── useDownload.js
  └── index.js

utils/
  └── validationSchemas.js
```
