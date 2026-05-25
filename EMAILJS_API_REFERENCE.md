# EmailJS API Reference

## Overview

This document provides detailed API reference for the EmailJS integration utilities.

---

## Module: `emailjs.js`

### Functions

#### `initializeEmailJS()`

Initialize EmailJS on application startup.

**Signature:**
```javascript
function initializeEmailJS(): boolean
```

**Returns:**
- `true` - Initialization successful
- `false` - Missing public key or initialization failed

**Usage:**
```javascript
import { initializeEmailJS } from './services/emailjs'

// Call once on app startup
if (initializeEmailJS()) {
  console.log('✅ EmailJS ready to send emails')
} else {
  console.warn('⚠️ EmailJS not configured')
}
```

**Called automatically in:**
- `src/main.jsx` - App startup

---

#### `sendEmail(templateId, variables)`

Send an email using EmailJS.

**Signature:**
```javascript
function sendEmail(
  templateId: string,
  variables: object
): Promise<object>
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| templateId | string | ✅ Yes | EmailJS template ID |
| variables | object | ✅ Yes | Template variables to interpolate |

**Returns:**
- Promise resolving to EmailJS response object

**Throws:**
- Error if template ID missing or email fails

**Example:**
```javascript
import { sendEmail } from './services/emailjs'

try {
  const response = await sendEmail('template_abc123', {
    to_email: 'customer@example.com',
    customer_name: 'John Doe',
    order_id: 'ORDER-12345',
    total_amount: '₹5000'
  })
  console.log('✅ Email sent:', response)
} catch (error) {
  console.error('❌ Email failed:', error)
}
```

---

#### `validateEmailJSConfig()`

Check if all required environment variables are set.

**Signature:**
```javascript
function validateEmailJSConfig(): boolean
```

**Returns:**
- `true` - All variables configured
- `false` - Missing variables

**Example:**
```javascript
import { validateEmailJSConfig } from './services/emailjs'

if (validateEmailJSConfig()) {
  console.log('✅ EmailJS fully configured')
} else {
  console.warn('⚠️ Missing EmailJS variables')
}
```

---

## Module: `emailTemplates.js`

### Functions

#### `generateAdminOrderHTML(orderData)`

Generate HTML email for admin order notification.

**Signature:**
```javascript
function generateAdminOrderHTML(orderData: object): string
```

**Parameters:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| customerName | string | ✅ | Customer full name |
| customerEmail | string | ✅ | Customer email address |
| customerPhone | string | ✅ | Customer phone number |
| productName | string | ✅ | Product name(s) |
| quantity | number | ✅ | Total quantity |
| totalAmount | number | ✅ | Total order amount |
| shippingAddress | string | ✅ | Street address |
| shippingCity | string | ✅ | City |
| shippingState | string | ✅ | State/Province |
| shippingPincode | string | ✅ | Postal code |
| paymentMethod | string | ✅ | Payment method (razorpay/cod) |
| orderDate | string or Date | ✅ | Order date/time |
| orderId | string | ✅ | Unique order ID |
| items | array | ❌ | Array of order items |

**Returns:**
- HTML string for email body

**Example:**
```javascript
import { generateAdminOrderHTML } from './services/emailTemplates'

const html = generateAdminOrderHTML({
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  customerPhone: '+91-9876543210',
  productName: 'Gold Necklace',
  quantity: 1,
  totalAmount: 5000,
  shippingAddress: '123 Main St',
  shippingCity: 'Mumbai',
  shippingState: 'Maharashtra',
  shippingPincode: '400001',
  paymentMethod: 'razorpay',
  orderDate: new Date(),
  orderId: 'ORDER-12345',
  items: [
    { name: 'Gold Necklace', quantity: 1, price: 5000 }
  ]
})

console.log(html) // Beautiful HTML email
```

---

#### `generateCustomerOrderHTML(orderData)`

Generate HTML email for customer order confirmation.

**Signature:**
```javascript
function generateCustomerOrderHTML(orderData: object): string
```

**Parameters:** Same as `generateAdminOrderHTML()`

**Returns:**
- HTML string for email body

**Example:**
```javascript
import { generateCustomerOrderHTML } from './services/emailTemplates'

const html = generateCustomerOrderHTML({
  customerName: 'John Doe',
  // ... other order data
})
```

---

#### `formatPrice(amount)`

Format amount as Indian Rupees.

**Signature:**
```javascript
function formatPrice(amount: number): string
```

**Returns:**
- Formatted price string (e.g., "₹5,000.00")

**Example:**
```javascript
import { formatPrice } from './services/emailTemplates'

console.log(formatPrice(5000))    // ₹5,000.00
console.log(formatPrice(1500.50)) // ₹1,500.50
```

---

#### `formatDate(date)`

Format date in Indian locale.

**Signature:**
```javascript
function formatDate(date: Date | string): string
```

**Returns:**
- Formatted date string

**Example:**
```javascript
import { formatDate } from './services/emailTemplates'

console.log(formatDate(new Date()))
// "25 May 2024, 02:30 PM"
```

---

## Module: `orderNotifications.js`

### Functions

#### `sendCustomerOrderConfirmation(orderData)`

Send order confirmation email to customer.

**Signature:**
```javascript
function sendCustomerOrderConfirmation(
  orderData: object
): Promise<object>
```

**Parameters:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| orderId | string | ✅ | Unique order ID |
| customerName | string | ✅ | Customer name |
| customerEmail | string | ✅ | Customer email |
| customerPhone | string | ✅ | Customer phone |
| paymentMethod | string | ✅ | Payment method |
| shippingAddress | string | ✅ | Delivery address |
| shippingCity | string | ✅ | City |
| shippingState | string | ✅ | State |
| shippingPincode | string | ✅ | Postal code |
| items | array | ✅ | Order items |
| totalAmount | number | ✅ | Total amount |
| orderDate | Date | ✅ | Order timestamp |

**Returns:**
- Promise resolving to EmailJS response

**Throws:**
- Error if email sending fails

**Example:**
```javascript
import { sendCustomerOrderConfirmation } from './services/orderNotifications'

try {
  await sendCustomerOrderConfirmation({
    orderId: 'ORDER-12345',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '+91-9876543210',
    paymentMethod: 'razorpay',
    shippingAddress: '123 Main St',
    shippingCity: 'Mumbai',
    shippingState: 'Maharashtra',
    shippingPincode: '400001',
    items: [{ name: 'Gold Necklace', quantity: 1, price: 5000 }],
    totalAmount: 5000,
    orderDate: new Date()
  })
  console.log('✅ Customer email sent')
} catch (error) {
  console.error('❌ Failed:', error)
}
```

---

#### `sendAdminOrderNotification(orderData, adminEmail)`

Send order notification email to admin.

**Signature:**
```javascript
function sendAdminOrderNotification(
  orderData: object,
  adminEmail: string
): Promise<object>
```

**Parameters:**
- `orderData` - Same as sendCustomerOrderConfirmation
- `adminEmail` - Admin email address (string, required)

**Returns:**
- Promise resolving to EmailJS response

**Example:**
```javascript
import { sendAdminOrderNotification } from './services/orderNotifications'

await sendAdminOrderNotification(
  orderData,
  'admin@panstellia.com'
)
```

---

#### `sendOrderNotifications(orderData, adminEmail)`

Send both customer and admin emails.

**Signature:**
```javascript
function sendOrderNotifications(
  orderData: object,
  adminEmail: string
): Promise<{
  customerEmail: { sent: boolean, error?: string },
  adminEmail: { sent: boolean, error?: string }
}>
```

**Parameters:**
- `orderData` - Order information object
- `adminEmail` - Admin email address

**Returns:**
```javascript
{
  customerEmail: { sent: true, error: null },
  adminEmail: { sent: true, error: null }
}
```

**Example:**
```javascript
import { sendOrderNotifications } from './services/orderNotifications'

const results = await sendOrderNotifications(
  orderData,
  'admin@panstellia.com'
)

if (results.customerEmail.sent) {
  console.log('✅ Customer email sent')
} else {
  console.error('❌ Customer email failed:', results.customerEmail.error)
}

if (results.adminEmail.sent) {
  console.log('✅ Admin email sent')
} else {
  console.error('❌ Admin email failed:', results.adminEmail.error)
}
```

---

#### `formatOrderDataForEmail(orderInfo)`

Transform raw order data into email-ready format.

**Signature:**
```javascript
function formatOrderDataForEmail(orderInfo: object): object
```

**Input Parameters:**
```javascript
{
  orderId: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  paymentMethod: string,
  shippingAddress: string,
  shippingCity: string,
  shippingState: string,
  shippingPincode: string,
  cartItems: array,
  total: number,
  tax?: number,
  shipping?: number
}
```

**Returns:**
```javascript
{
  orderId: string,
  orderDate: ISO string,
  orderDateFormatted: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  paymentMethod: string,
  shippingAddress: string,
  shippingCity: string,
  shippingState: string,
  shippingPincode: string,
  items: array,
  subtotal: number,
  tax: number,
  shipping: number,
  totalAmount: number,
  productName: string,
  quantity: number
}
```

**Example:**
```javascript
import { formatOrderDataForEmail } from './services/orderNotifications'

const emailData = formatOrderDataForEmail({
  orderId: 'ORDER-12345',
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  customerPhone: '+91-9876543210',
  paymentMethod: 'razorpay',
  shippingAddress: '123 Main St',
  shippingCity: 'Mumbai',
  shippingState: 'Maharashtra',
  shippingPincode: '400001',
  cartItems: [
    { name: 'Gold Necklace', quantity: 1, price: 5000, image: 'url' }
  ],
  total: 5000,
  tax: 0,
  shipping: 0
})

// Ready to use with sendOrderNotifications()
```

---

## Environment Variables

### Required for EmailJS

```env
VITE_EMAILJS_SERVICE_ID=service_abc123xyz
VITE_EMAILJS_TEMPLATE_ID_ORDER=template_abc123xyz
VITE_EMAILJS_TEMPLATE_ID_CUSTOMER=template_abc123xyz
VITE_EMAILJS_PUBLIC_KEY=public_abc123xyz
VITE_ADMIN_EMAIL=admin@panstellia.com
```

---

## Error Handling Examples

### Try-Catch Pattern

```javascript
try {
  const results = await sendOrderNotifications(orderData, adminEmail)
  
  if (results.customerEmail.sent) {
    toast.success('Order confirmed! Check your email.')
  }
} catch (error) {
  console.error('Email error:', error)
  toast.error('Email notification failed, but order placed.')
}
```

### Graceful Degradation

```javascript
// Order completes even if email fails
try {
  await sendOrderNotifications(orderData, adminEmail)
} catch (emailError) {
  // Log error but don't fail order
  console.error('⚠️ Email error:', emailError)
}

// Order still completes
await clearCart()
navigate('/order-success')
```

---

## Type Definitions (TypeScript)

```typescript
interface OrderData {
  orderId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  paymentMethod: 'razorpay' | 'cod'
  shippingAddress: string
  shippingCity: string
  shippingState: string
  shippingPincode: string
  items: OrderItem[]
  totalAmount: number
  orderDate: Date | string
  tax?: number
  shipping?: number
}

interface OrderItem {
  name: string
  quantity: number
  price: number
  image?: string
}

interface EmailResults {
  customerEmail: {
    sent: boolean
    error?: string
  }
  adminEmail: {
    sent: boolean
    error?: string
  }
}
```

---

## Performance Considerations

### Email Sending Speed
- **Typical delay**: 2-5 seconds
- **Network dependent**: Can be slower on poor connections
- **Non-blocking**: Doesn't prevent order completion

### Best Practices
1. Send emails **after** order is saved
2. Don't block on email response
3. Log errors for debugging
4. Monitor email delivery rate

---

## Testing

### Unit Test Example (Jest)

```javascript
import { formatOrderDataForEmail } from './services/orderNotifications'

describe('formatOrderDataForEmail', () => {
  it('should format order data correctly', () => {
    const data = formatOrderDataForEmail({
      orderId: 'ORDER-123',
      customerName: 'John Doe',
      // ... other fields
    })

    expect(data.orderId).toBe('ORDER-123')
    expect(data.customerName).toBe('John Doe')
    expect(data.totalAmount).toBeDefined()
  })
})
```

---

## Common Patterns

### Pattern 1: Send After Firestore Save

```javascript
// Save to Firestore
await addDoc(collection(db, 'orders'), orderData)

// Then send emails
await sendOrderNotifications(formattedData, adminEmail)
```

### Pattern 2: Error Recovery

```javascript
try {
  await sendOrderNotifications(data, adminEmail)
} catch (error) {
  // Email failed, but order is saved
  logErrorForSupport(error)
  notifyUserOfEmailIssue()
}
```

### Pattern 3: Async Email Sending

```javascript
// Start email but don't wait
sendOrderNotifications(data, adminEmail)
  .then(() => console.log('✅ Emails sent'))
  .catch(err => console.error('❌ Email error:', err))

// Order completes immediately
navigate('/order-success')
```

---

## Debugging

### Enable Verbose Logging

```javascript
// In emailjs.js or service file
console.log('📧 Sending email to:', emailVariables.to_email)
console.log('🎯 Using template:', templateId)
console.log('📝 Email variables:', emailVariables)
```

### Check Browser Console

Press **F12** → **Console** tab to see:
- ✅ Initialization messages
- ✅ Email sent confirmations
- ❌ Error messages with details

### EmailJS Dashboard

Monitor email delivery:
1. Go to EmailJS Dashboard
2. Check "Statistics"
3. View email logs
4. Check bounce/delivery rates

---

## Support & Resources

- **EmailJS Docs**: https://www.emailjs.com/docs/
- **GitHub Repository**: Your project repo
- **Email Support**: support@emailjs.com

---

**Last Updated:** May 2024
**Version:** 1.0
**Status:** Production Ready ✅
