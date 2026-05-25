# 📋 EmailJS Quick Reference & Cheat Sheet

**Keep this handy for quick lookups!**

---

## 🚀 Quick Setup

### 1️⃣ Create .env.local

```env
VITE_EMAILJS_SERVICE_ID=service_xxx
VITE_EMAILJS_TEMPLATE_ID_ORDER=template_xxx
VITE_EMAILJS_TEMPLATE_ID_CUSTOMER=template_xxx
VITE_EMAILJS_PUBLIC_KEY=public_xxx
VITE_ADMIN_EMAIL=admin@panstellia.com
```

### 2️⃣ Restart Dev Server

```bash
npm run dev
```

### 3️⃣ Check Console

```
✅ EmailJS initialized successfully
```

---

## 📦 Core Functions

### Send Notification Emails

```javascript
import { sendOrderNotifications, formatOrderDataForEmail } from './services/orderNotifications'

const emailData = formatOrderDataForEmail({
  orderId: 'ORDER-123',
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  customerPhone: '9876543210',
  paymentMethod: 'razorpay',
  shippingAddress: '123 Main St',
  shippingCity: 'Mumbai',
  shippingState: 'Maharashtra',
  shippingPincode: '400001',
  cartItems: [{ name: 'Necklace', quantity: 1, price: 5000 }],
  total: 5000
})

const results = await sendOrderNotifications(emailData, 'admin@panstellia.com')
```

### Send Custom Email

```javascript
import { sendEmail } from './services/emailjs'

await sendEmail('template_id', {
  to_email: 'customer@example.com',
  customer_name: 'John Doe',
  order_id: 'ORDER-123'
})
```

### Validate Configuration

```javascript
import { validateEmailJSConfig } from './services/emailjs'

if (validateEmailJSConfig()) {
  console.log('✅ Ready to send emails')
}
```

---

## 🛠️ Common Tasks

### Task: Send Order Confirmation

```javascript
const emailData = formatOrderDataForEmail({
  orderId: orderId,
  customerName: formData.name,
  customerEmail: formData.email,
  customerPhone: formData.phone,
  paymentMethod: 'cod',
  shippingAddress: formData.address,
  shippingCity: formData.city,
  shippingState: formData.state,
  shippingPincode: formData.pincode,
  cartItems: cartItems,
  total: total
})

await sendOrderNotifications(emailData, 'admin@panstellia.com')
```

### Task: Send with Error Handling

```javascript
try {
  await sendOrderNotifications(emailData, adminEmail)
  console.log('✅ Emails sent')
} catch (error) {
  console.error('⚠️ Email error:', error)
  // Order still completes, email failed gracefully
}
```

### Task: Check Delivery Status

```javascript
const results = await sendOrderNotifications(data, adminEmail)

if (results.customerEmail.sent) {
  console.log('✅ Customer email delivered')
}
if (results.adminEmail.sent) {
  console.log('✅ Admin email delivered')
}
```

### Task: Send Promotional Email

```javascript
await sendEmail('template_promo_id', {
  to_email: 'customer@example.com',
  discount: '20%',
  offer_link: 'https://panstellia.com/sale'
})
```

### Task: Format Price

```javascript
import { formatPrice } from './services/emailTemplates'

formatPrice(5000)      // "₹5,000.00"
formatPrice(1500.50)   // "₹1,500.50"
```

### Task: Format Date

```javascript
import { formatDate } from './services/emailTemplates'

formatDate(new Date())  // "25 May 2024, 02:30 PM"
```

---

## 🔍 Import Statements

```javascript
// Individual functions
import { initializeEmailJS, sendEmail, validateEmailJSConfig } from './services/emailjs'

// Order notifications
import { 
  sendOrderNotifications, 
  sendCustomerOrderConfirmation,
  sendAdminOrderNotification,
  formatOrderDataForEmail 
} from './services/orderNotifications'

// Email templates
import { 
  generateAdminOrderHTML,
  generateCustomerOrderHTML,
  formatPrice,
  formatDate 
} from './services/emailTemplates'
```

---

## 🔧 Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_EMAILJS_SERVICE_ID` | EmailJS service | `service_abc123` |
| `VITE_EMAILJS_TEMPLATE_ID_ORDER` | Admin template | `template_abc123` |
| `VITE_EMAILJS_TEMPLATE_ID_CUSTOMER` | Customer template | `template_xyz789` |
| `VITE_EMAILJS_PUBLIC_KEY` | API public key | `public_abc123def456` |
| `VITE_ADMIN_EMAIL` | Receive notifications | `admin@panstellia.com` |

---

## 📧 Email Template Variables

### Both Templates Use

```javascript
{
  to_email,              // Recipient email
  order_id,             // Order ID
  order_date,           // Order date
  customer_name,        // Customer name
  customer_email,       // Customer email
  customer_phone,       // Customer phone
  product_name,         // Product name(s)
  quantity,             // Total quantity
  total_amount,         // Total price
  shipping_address,     // Street address
  shipping_city,        // City
  shipping_state,       // State
  shipping_pincode,     // Postal code
  payment_method,       // Payment method
  email_html           // HTML content
}
```

---

## ⚡ Performance Tips

### ✅ Do This

```javascript
// Non-blocking email sending
sendOrderNotifications(data, adminEmail)
  .catch(err => console.error(err))

navigate('/success')  // Don't wait for email
```

### ❌ Don't Do This

```javascript
// Blocking email sending
await sendOrderNotifications(data, adminEmail)  // Slow!
navigate('/success')
```

---

## 🚨 Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| "EmailJS not initialized" | Missing init call | Call `initializeEmailJS()` in main.jsx |
| "Public Key not found" | Missing env var | Add `VITE_EMAILJS_PUBLIC_KEY` to .env.local |
| "Template ID required" | Missing env var | Add template ID env variables |
| "Email sending failed" | Network/service error | Check internet, restart server |
| "Invalid email address" | Bad email format | Validate email before sending |

---

## 🧪 Testing Checklist

```javascript
// ✅ Verify Setup
console.log(import.meta.env.VITE_EMAILJS_SERVICE_ID)     // Not undefined
console.log(import.meta.env.VITE_EMAILJS_PUBLIC_KEY)     // Not undefined

// ✅ Test Initialization
import { validateEmailJSConfig } from './services/emailjs'
console.log(validateEmailJSConfig())  // Should be true

// ✅ Test Email Sending
await sendOrderNotifications(testData, 'admin@test.com')
// Check inbox for emails

// ✅ Check Console
// Should see: ✅ EmailJS initialized successfully
// Should see: ✅ Email sent successfully
```

---

## 📁 File Locations

```
src/services/
├── emailjs.js              # Core functions
├── emailTemplates.js       # HTML templates
└── orderNotifications.js   # Notification service

src/main.jsx               # Initialization
src/pages/Checkout.jsx     # Integration
.env.local                 # Configuration (create locally)
.env.example               # Template
```

---

## 🔗 Important Links

| Resource | URL |
|----------|-----|
| EmailJS Website | https://www.emailjs.com/ |
| EmailJS Docs | https://www.emailjs.com/docs/ |
| Dashboard | https://dashboard.emailjs.com/ |
| API Keys | https://dashboard.emailjs.com/account/api-keys |
| Email Templates | https://dashboard.emailjs.com/emails |
| Statistics | https://dashboard.emailjs.com/statistics |

---

## 🎯 Decision Tree

### Should I send emails asynchronously?

```
Is email critical for order completion?
├─ YES → Await and handle errors
└─ NO → Fire and forget (recommended)
```

### Which template should I use?

```
Who is the recipient?
├─ Customer → generateCustomerOrderHTML()
└─ Admin → generateAdminOrderHTML()
```

### What if email sending fails?

```
Can I retry?
├─ YES → Use sendEmailsWithRetry() (see examples)
└─ NO → Log error, don't block order
```

---

## 💰 Cost Reference

| Tier | Emails/Month | Price | Orders/Month* |
|------|--------------|-------|---------------|
| **Free** | 200 | $0 | ~100 |
| **Starter** | 1,000 | $30 | ~500 |
| **Professional** | 5,000 | $50 | ~2,500 |
| **Enterprise** | Unlimited | $200+ | Unlimited |

*Assumes 2 emails per order

---

## 🎓 Documentation Map

```
📍 START HERE
    ↓
EMAILJS_README.md ————→ Overview & Architecture
    ↓
EMAILJS_SETUP.md ————→ Complete Setup (5 steps)
    ↓
EMAILJS_INSTALLATION.md → Installation & Deployment
    ↓
EMAILJS_API_REFERENCE.md → Function Documentation
    ↓
EMAILJS_EXAMPLES.md ——→ Code Examples & Patterns
```

---

## 🐛 Debugging Commands

```javascript
// Check if initialized
console.log(import.meta.env.VITE_EMAILJS_PUBLIC_KEY)

// Validate config
import { validateEmailJSConfig } from './services/emailjs'
console.log(validateEmailJSConfig())

// Check environment
console.log('Environment:', import.meta.env.MODE)
console.log('All env vars:', import.meta.env)

// Test sending
const results = await sendOrderNotifications(testData, 'admin@test.com')
console.log('Results:', results)

// Check EmailJS status
fetch('https://api.emailjs.com/api/v1.0/status')
  .then(r => r.json())
  .then(console.log)
```

---

## ⏱️ Timing Reference

| Task | Duration |
|------|----------|
| EmailJS signup | 2 minutes |
| Setup service | 1 minute |
| Create templates | 1 minute |
| Get credentials | 30 seconds |
| Setup .env.local | 30 seconds |
| Install npm | 2 minutes |
| Test locally | 1 minute |
| Deploy to Vercel | 3 minutes |
| **Total** | **~11 minutes** |

---

## ✅ Deployment Checklist

- [ ] All .env variables set locally
- [ ] npm install completed
- [ ] Dev server running without errors
- [ ] Test order placed successfully
- [ ] Emails received in inbox
- [ ] Code pushed to GitHub
- [ ] Environment variables added to Vercel
- [ ] Deployment successful
- [ ] Production emails verified

---

## 🎁 Bonus Tips

### Tip 1: Monitor Emails in Real-Time
```javascript
// Add to Checkout.jsx after sending
const interval = setInterval(() => {
  console.log('Checking email status...')
  // Refresh EmailJS dashboard
}, 5000)
```

### Tip 2: Add Email Logging
```javascript
// Log every email sent
const logEmail = async (to, orderId) => {
  console.log(`📧 Email sent to ${to} for order ${orderId}`)
}
```

### Tip 3: Preview HTML Emails
```javascript
// Generate HTML to preview
import { generateAdminOrderHTML } from './services/emailTemplates'
const html = generateAdminOrderHTML(orderData)
console.log(html)  // View in browser console
```

### Tip 4: Batch Send Emails
```javascript
// Send multiple emails in parallel
await Promise.all([
  sendEmail(template1, data1),
  sendEmail(template2, data2),
  sendEmail(template3, data3)
])
```

### Tip 5: Email Preview
```html
<!-- Open in browser to preview HTML -->
<!-- Save generateAdminOrderHTML() output as .html file -->
<!-- Open in browser to see final result -->
```

---

## 📞 Support Resources

### Quick Help

- **Setup Issues?** → Read EMAILJS_SETUP.md
- **Code Questions?** → Check EMAILJS_API_REFERENCE.md
- **Usage Examples?** → See EMAILJS_EXAMPLES.md
- **Deployment?** → Follow EMAILJS_INSTALLATION.md

### External Help

- **EmailJS Support:** support@emailjs.com
- **Documentation:** https://www.emailjs.com/docs/
- **GitHub Issues:** Your repository

---

## 🎉 Common Success Messages

```
✅ EmailJS initialized successfully
✅ Customer confirmation email sent successfully
✅ Admin notification email sent successfully
✅ Order placed. Cash on Delivery selected!
✅ Payment successful!
```

---

## 🚀 You're Ready!

This cheat sheet has everything you need. Bookmark this file and refer back often!

**Made with ❤️ for Panstellia**

**Print this out or save as PDF!**
