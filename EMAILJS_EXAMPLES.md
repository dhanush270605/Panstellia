# EmailJS - Examples & Advanced Use Cases

## 📚 Table of Contents

1. [Basic Usage Examples](#basic-usage-examples)
2. [Advanced Use Cases](#advanced-use-cases)
3. [Real-World Scenarios](#real-world-scenarios)
4. [Troubleshooting Examples](#troubleshooting-examples)

---

## Basic Usage Examples

### Example 1: Simple Order Notification

**Scenario:** Place an order and send emails

```javascript
import { sendOrderNotifications, formatOrderDataForEmail } from './services/orderNotifications'
import { toast } from 'react-toastify'

async function handleOrderPlacement(orderInfo) {
  try {
    // Format data for email
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
        { name: 'Gold Necklace', quantity: 1, price: 5000 }
      ],
      total: 5000
    })

    // Send emails
    const results = await sendOrderNotifications(
      emailData,
      'admin@panstellia.com'
    )

    // Show success
    if (results.customerEmail.sent) {
      toast.success('Order placed! Confirmation email sent.')
    }

  } catch (error) {
    console.error('Order error:', error)
    toast.error('Failed to place order')
  }
}
```

---

### Example 2: Custom Email with Template Variables

**Scenario:** Send email with custom styling

```javascript
import { sendEmail } from './services/emailjs'

async function sendCustomWelcomeEmail(customerName, customerEmail) {
  try {
    const templateVariables = {
      to_email: customerEmail,
      customer_name: customerName,
      welcome_message: 'Welcome to Panstellia!',
      store_url: 'https://panstellia.com'
    }

    await sendEmail('template_welcome_email_id', templateVariables)
    console.log('✅ Welcome email sent')

  } catch (error) {
    console.error('❌ Failed to send welcome email:', error)
  }
}

// Usage
sendCustomWelcomeEmail('John Doe', 'john@example.com')
```

---

### Example 3: Check Configuration Before Sending

**Scenario:** Validate setup before attempting to send emails

```javascript
import { validateEmailJSConfig, sendOrderNotifications } from './services/orderNotifications'

async function placeOrderWithValidation(orderData) {
  // Validate configuration first
  if (!validateEmailJSConfig()) {
    console.warn('⚠️ EmailJS not properly configured')
    console.warn('Setup: https://www.emailjs.com')
    
    // Still allow order but skip emails
    saveOrderToDatabase(orderData)
    return
  }

  // Send emails
  const results = await sendOrderNotifications(orderData, 'admin@panstellia.com')
  
  // Save order
  saveOrderToDatabase(orderData)
  
  console.log('Results:', results)
}
```

---

## Advanced Use Cases

### Example 1: Batch Email Sending with Retry Logic

**Scenario:** Send multiple emails with automatic retry

```javascript
import { sendCustomerOrderConfirmation, sendAdminOrderNotification } from './services/orderNotifications'

async function sendEmailsWithRetry(orderData, adminEmail, maxRetries = 3) {
  const results = {
    customer: null,
    admin: null
  }

  // Send customer email with retry
  for (let i = 0; i < maxRetries; i++) {
    try {
      results.customer = await sendCustomerOrderConfirmation(orderData)
      console.log(`✅ Customer email sent (attempt ${i + 1})`)
      break
    } catch (error) {
      console.warn(`⚠️ Attempt ${i + 1} failed:`, error)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
      }
    }
  }

  // Send admin email with retry
  for (let i = 0; i < maxRetries; i++) {
    try {
      results.admin = await sendAdminOrderNotification(orderData, adminEmail)
      console.log(`✅ Admin email sent (attempt ${i + 1})`)
      break
    } catch (error) {
      console.warn(`⚠️ Attempt ${i + 1} failed:`, error)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }

  return results
}

// Usage
const results = await sendEmailsWithRetry(orderData, 'admin@panstellia.com', 3)
```

---

### Example 2: Queue Email Sending with Status Tracking

**Scenario:** Queue emails for asynchronous sending

```javascript
// services/emailQueue.js
class EmailQueue {
  constructor() {
    this.queue = []
    this.isProcessing = false
  }

  async add(emailTask) {
    this.queue.push({
      ...emailTask,
      status: 'pending',
      createdAt: new Date()
    })
    this.process()
  }

  async process() {
    if (this.isProcessing) return
    this.isProcessing = true

    while (this.queue.length > 0) {
      const task = this.queue[0]

      try {
        await task.send()
        task.status = 'sent'
        this.queue.shift()
      } catch (error) {
        task.status = 'failed'
        task.error = error.message
        task.retries = (task.retries || 0) + 1

        if (task.retries >= 3) {
          // Give up after 3 retries
          this.queue.shift()
        } else {
          // Retry after 5 seconds
          await new Promise(resolve => setTimeout(resolve, 5000))
        }
      }
    }

    this.isProcessing = false
  }

  getStatus() {
    return {
      pending: this.queue.filter(t => t.status === 'pending').length,
      failed: this.queue.filter(t => t.status === 'failed').length,
      total: this.queue.length
    }
  }
}

// Export singleton
export const emailQueue = new EmailQueue()

// Usage
import { emailQueue } from './services/emailQueue'
import { sendOrderNotifications, formatOrderDataForEmail } from './services/orderNotifications'

emailQueue.add({
  send: async () => {
    const emailData = formatOrderDataForEmail(orderInfo)
    return await sendOrderNotifications(emailData, 'admin@panstellia.com')
  }
})

// Check queue status
console.log(emailQueue.getStatus())
// { pending: 2, failed: 1, total: 3 }
```

---

### Example 3: Send Email with Custom HTML Template

**Scenario:** Send promotional email with custom design

```javascript
import { sendEmail } from './services/emailjs'

async function sendPromotionalEmail(customerEmail, discount) {
  const htmlContent = `
    <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #db912d 0%, #c67f24 100%); 
                  color: white; padding: 30px; text-align: center;">
        <h1>Special Offer - ${discount}% Off!</h1>
      </div>
      <div style="padding: 20px; background: #f9f9f9;">
        <p>Dear Customer,</p>
        <p>We have a special offer for you this week!</p>
        <a href="https://panstellia.com/products" 
           style="display: inline-block; background: #db912d; color: white; 
                  padding: 12px 30px; text-decoration: none; border-radius: 4px;">
          Shop Now
        </a>
      </div>
    </div>
  `

  try {
    await sendEmail('template_promo_email_id', {
      to_email: customerEmail,
      discount_percent: discount,
      html_content: htmlContent
    })
    console.log('✅ Promotional email sent')
  } catch (error) {
    console.error('❌ Failed:', error)
  }
}
```

---

### Example 4: Conditional Email Sending Based on Order Type

**Scenario:** Different emails for different order types

```javascript
async function sendConditionalEmails(orderData) {
  const { paymentMethod, cartItems, totalAmount } = orderData

  // Send thank you email to all
  await sendCustomerOrderConfirmation(orderData)

  // Send special email for high-value orders
  if (totalAmount > 50000) {
    await sendVIPOrderEmail(orderData)
  }

  // Send payment reminder for COD
  if (paymentMethod === 'cod') {
    await scheduleCODPaymentReminder(orderData, 3 * 60 * 60 * 1000) // After 3 hours
  }

  // Send bundle discount email if multiple items
  if (cartItems.length > 3) {
    await sendBundleDiscountEmail(orderData)
  }
}
```

---

## Real-World Scenarios

### Scenario 1: Complete Order Workflow

**Full checkout to email completion**

```javascript
// In Checkout.jsx

const handleOrderCompletion = async (formData, cartItems, total) => {
  try {
    setLoading(true)

    // 1. Validate form
    if (!formData.email || !formData.address) {
      throw new Error('Please fill all required fields')
    }

    // 2. Create order in database
    const orderId = `ORDER-${Date.now()}`
    const orderRef = await addDoc(collection(db, 'orders'), {
      orderId,
      userId: user.uid,
      customerName: formData.name,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      items: cartItems,
      total,
      status: 'processing',
      createdAt: serverTimestamp()
    })

    console.log('✅ Order saved to database')

    // 3. Format data for email
    const emailData = formatOrderDataForEmail({
      orderId,
      customerName: formData.name,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      paymentMethod: 'cod',
      shippingAddress: formData.address,
      shippingCity: formData.city,
      shippingState: formData.state,
      shippingPincode: formData.pincode,
      cartItems,
      total
    })

    // 4. Send emails (but don't fail if they don't work)
    try {
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL
      const emailResults = await sendOrderNotifications(emailData, adminEmail)
      
      if (emailResults.customerEmail.sent) {
        console.log('✅ Confirmation email sent to customer')
      }
      if (emailResults.adminEmail.sent) {
        console.log('✅ Notification email sent to admin')
      }
    } catch (emailError) {
      console.error('⚠️ Email error (order still placed):', emailError)
      // Don't throw - order is already saved
    }

    // 5. Clear cart and show success
    await clearCart()
    toast.success('Order placed successfully!')
    
    // 6. Navigate to success page
    navigate('/order-success', {
      state: { orderId, items: cartItems, total }
    })

  } catch (error) {
    console.error('❌ Order error:', error)
    toast.error(error.message || 'Failed to place order')
  } finally {
    setLoading(false)
  }
}
```

---

### Scenario 2: Email Notification with Admin Dashboard

**Track emails in admin panel**

```javascript
// services/emailLog.js
class EmailLogger {
  static async logEmailSent(orderId, emailType, result) {
    await addDoc(collection(db, 'email_logs'), {
      orderId,
      emailType, // 'customer' | 'admin'
      status: 'sent',
      timestamp: serverTimestamp(),
      messageId: result.status
    })
  }

  static async getEmailHistory(orderId) {
    const q = query(
      collection(db, 'email_logs'),
      where('orderId', '==', orderId)
    )
    return getDocs(q)
  }
}

// Usage in order notification
const results = await sendOrderNotifications(emailData, adminEmail)

if (results.customerEmail.sent) {
  await EmailLogger.logEmailSent(orderId, 'customer', results.customerEmail)
}
if (results.adminEmail.sent) {
  await EmailLogger.logEmailSent(orderId, 'admin', results.adminEmail)
}
```

---

### Scenario 3: Email With Image Attachments (Advanced)

**Note: EmailJS free tier doesn't support attachments directly. Use workarounds:**

```javascript
// Option 1: Link to images in email
const emailData = {
  to_email: customerEmail,
  product_image_url: 'https://cdn.example.com/product.jpg',
  order_confirmation_pdf: 'https://example.com/orders/123.pdf'
}

// Option 2: Use image URLs in HTML
const htmlContent = `
  <img src="https://cdn.example.com/product-image.jpg" 
       alt="Product" style="max-width: 100%; height: auto;">
`
```

---

## Troubleshooting Examples

### Problem: "Email sending failed" Error

```javascript
// ❌ Problem
try {
  await sendOrderNotifications(orderData, 'invalid-email@')
} catch (error) {
  console.log(error) // "Email sending failed"
}

// ✅ Solution
const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)

if (!isValidEmail) {
  toast.error('Please enter a valid email address')
  return
}

await sendOrderNotifications(orderData, adminEmail)
```

---

### Problem: Environment Variables Not Found

```javascript
// ❌ Problem
const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
console.log(publicKey) // undefined

// ✅ Solution
// 1. Create .env.local in project root
// 2. Add: VITE_EMAILJS_PUBLIC_KEY=public_xxx
// 3. Restart dev server (npm run dev)
// 4. Now import.meta.env.VITE_EMAILJS_PUBLIC_KEY works
```

---

### Problem: Emails Not Received

```javascript
// ✅ Debugging checklist
async function debugEmailIssue(orderData, adminEmail) {
  // 1. Check configuration
  console.log('Service ID:', import.meta.env.VITE_EMAILJS_SERVICE_ID)
  console.log('Template ID:', import.meta.env.VITE_EMAILJS_TEMPLATE_ID_CUSTOMER)
  console.log('Public Key:', import.meta.env.VITE_EMAILJS_PUBLIC_KEY)

  // 2. Validate config
  if (!validateEmailJSConfig()) {
    console.error('❌ Configuration incomplete')
    return
  }

  // 3. Try sending test email
  try {
    const testResult = await sendOrderNotifications(orderData, adminEmail)
    console.log('Email Results:', testResult)
  } catch (error) {
    console.error('Send error:', error)
  }

  // 4. Check EmailJS dashboard for delivery status
  console.log('Check: https://www.emailjs.com -> Dashboard -> Statistics')
}
```

---

### Problem: Order Completes But Email Doesn't Send

```javascript
// ✅ Expected behavior - this is OK!
async function handleCheckout() {
  try {
    // Order is saved
    await saveOrderToDatabase(orderData)
    console.log('✅ Order saved')

    // Email is sent (but might fail)
    try {
      await sendOrderNotifications(orderData, adminEmail)
      console.log('✅ Email sent')
    } catch (emailError) {
      // This is OK - order is already saved
      console.error('⚠️ Email failed (order still placed):', emailError)
    }

    // Show success to user
    toast.success('Order placed!')
    navigate('/order-success')

  } catch (orderError) {
    // This is a problem - order failed
    toast.error('Failed to place order')
  }
}
```

---

## Testing Checklist

```javascript
// ✅ Complete testing workflow

// 1. Test initialization
test('EmailJS initializes correctly', () => {
  const initialized = initializeEmailJS()
  expect(initialized).toBe(true)
})

// 2. Test email validation
test('Validates required fields', () => {
  const data = {
    orderId: '',
    customerEmail: 'invalid'
  }
  expect(() => sendCustomerOrderConfirmation(data)).toThrow()
})

// 3. Test formatting
test('Formats order data correctly', () => {
  const result = formatOrderDataForEmail({
    orderId: 'TEST-123',
    customerName: 'John'
    // ... other fields
  })
  expect(result.orderId).toBe('TEST-123')
  expect(result.orderDate).toBeDefined()
})

// 4. Test email sending
test('Sends customer email', async () => {
  const result = await sendCustomerOrderConfirmation(testData)
  expect(result.status).toBe(200)
})

// 5. Integration test
test('Complete order flow', async () => {
  // Create order
  const orderId = await createOrder(orderData)
  expect(orderId).toBeDefined()

  // Send emails
  const results = await sendOrderNotifications(orderData, adminEmail)
  expect(results.customerEmail.sent).toBe(true)
  expect(results.adminEmail.sent).toBe(true)
})
```

---

## Performance Tips

```javascript
// ✅ Best practices for optimal performance

// 1. Send emails asynchronously (don't await)
// ❌ Slow - blocks order completion
await sendOrderNotifications(data, adminEmail)
navigate('/success')

// ✅ Fast - email sends in background
sendOrderNotifications(data, adminEmail)
  .catch(err => console.error('Email error:', err))
navigate('/success')

// 2. Batch email operations
// ❌ Slow - sends 10 emails sequentially
for (let i = 0; i < 10; i++) {
  await sendEmail(template, data)
}

// ✅ Fast - sends 10 emails in parallel
Promise.all(
  orders.map(order => sendOrderNotifications(order, adminEmail))
)

// 3. Cache formatted data
// ❌ Slow - formats on every send
const sendEmail = () => {
  const formatted = formatOrderDataForEmail(raw)
  return sendOrderNotifications(formatted, adminEmail)
}

// ✅ Fast - format once, reuse
const formatted = formatOrderDataForEmail(raw)
await sendOrderNotifications(formatted, adminEmail)
```

---

**Made with ❤️ for Panstellia**
