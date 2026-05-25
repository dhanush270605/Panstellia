# EmailJS Integration - Installation & Deployment Guide

## 🚀 Complete Installation Steps

### Prerequisites
- Node.js 14 or higher (installed)
- npm 6 or higher (comes with Node.js)
- A code editor (VS Code recommended)
- Gmail account or other email service
- EmailJS free account (created in EMAILJS_SETUP.md)

---

## 📦 Step 1: Install Dependencies

**Run this command in your project directory:**

```bash
npm install
```

This will install the EmailJS package (@emailjs/browser) that's already added to package.json.

**Expected output:**
```
added X packages in Ys
```

---

## 🔐 Step 2: Configure Environment Variables

### Create `.env.local` File

1. In your project root directory, create a new file named `.env.local`
2. Add the following variables (replace with your EmailJS credentials):

```env
# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=service_your_service_id_here
VITE_EMAILJS_TEMPLATE_ID_ORDER=template_admin_order_notification
VITE_EMAILJS_TEMPLATE_ID_CUSTOMER=template_customer_confirmation
VITE_EMAILJS_PUBLIC_KEY=public_your_public_key_here
VITE_ADMIN_EMAIL=admin@panstellia.com

# Keep your existing variables
VITE_RAZORPAY_KEY_ID=your_razorpay_key
VITE_FIREBASE_CREATE_ORDER_URL=your_firebase_url
VITE_FIREBASE_VERIFY_PAYMENT_URL=your_firebase_url
```

### Where to Get Your Credentials?

**Service ID:**
- Login to EmailJS Dashboard
- Go to Services section
- Copy the Service ID

**Template IDs:**
- Go to Email Templates
- Click on each template
- Copy the Template ID from settings

**Public Key:**
- Go to Account → API Keys
- Copy the Public Key (starts with "public_")

**Admin Email:**
- Use your business email or admin email
- This is where new order notifications will be sent

### ⚠️ Important: .env.local is in .gitignore

Your `.env.local` file:
- **Won't be committed** to GitHub
- **Won't be exposed** publicly
- **Is safe** to contain local variables
- **Must be created locally** on each machine

---

## ✅ Step 3: Verify Installation

### Check Console Messages

1. Start your development server:
```bash
npm run dev
```

2. Open your browser's Developer Console (F12 → Console tab)

3. You should see:
```
✅ EmailJS initialized successfully
```

**If you see this message, EmailJS is properly configured!**

### If You Don't See the Message

**Causes:**
1. Missing environment variables
2. `.env.local` file not created
3. Server not restarted after creating `.env.local`
4. Browser cache issue

**Solutions:**
1. Verify `.env.local` exists in project root
2. Check all required variables are present
3. Stop server and run `npm run dev` again
4. Clear browser cache (Ctrl+Shift+Delete)

---

## 🧪 Step 4: Test Email Sending

### Manual Test (Optional)

1. Go to your checkout page
2. Fill in the order form:
   - Name: Your Name
   - Email: your-email@gmail.com
   - Phone: 9876543210
   - Address: Test Address
   - City: Mumbai
   - State: Maharashtra
   - Pincode: 400001

3. Add an item to cart
4. Click "Place COD Order"

5. Check your email inbox (including spam folder)

**Expected Results:**
- ✅ Order success page appears
- 📧 Customer confirmation email received (2-3 seconds)
- 📧 Admin email received (if admin email is configured)
- ✅ Console shows email sent messages

### Troubleshooting Test

| Issue | Solution |
|-------|----------|
| Emails not received | Check spam folder, verify email credentials |
| "Email sending failed" toast | Check browser console for detailed error |
| No console messages | Reload page, check .env.local is saved |
| Emails arrive with formatting issues | Check EmailJS template HTML syntax |

---

## 🌐 Step 5: Deploy to Vercel

### Prerequisites for Vercel
- GitHub account (free)
- Vercel account (free)
- Code pushed to GitHub

### Deployment Steps

1. **Push Code to GitHub**

```bash
git add .
git commit -m "Add EmailJS integration"
git push origin main
```

2. **Connect to Vercel**

- Go to [vercel.com](https://vercel.com)
- Click "Import Project"
- Select your GitHub repository
- Click "Import"

3. **Add Environment Variables**

In Vercel Dashboard:
- Go to your project settings
- Click "Environment Variables"
- Add each variable:

```
VITE_EMAILJS_SERVICE_ID = service_abc...
VITE_EMAILJS_TEMPLATE_ID_ORDER = template_abc...
VITE_EMAILJS_TEMPLATE_ID_CUSTOMER = template_abc...
VITE_EMAILJS_PUBLIC_KEY = public_abc...
VITE_ADMIN_EMAIL = admin@panstellia.com
VITE_RAZORPAY_KEY_ID = rzp_...
VITE_FIREBASE_CREATE_ORDER_URL = https://...
VITE_FIREBASE_VERIFY_PAYMENT_URL = https://...
```

4. **Deploy**

- Click "Deploy"
- Wait for deployment to complete (usually 1-2 minutes)
- Get your live URL

5. **Test on Production**

- Go to your live URL
- Place a test order
- Verify emails are received

### ✅ Congratulations!

Your eCommerce site is now live with email notifications! 🎉

---

## 🔄 Updating Code

### After Making Changes

1. **Locally test first:**
```bash
npm run dev
```

2. **Commit and push:**
```bash
git add .
git commit -m "Description of changes"
git push origin main
```

3. **Vercel auto-deploys** - No manual action needed!

---

## 📊 Monitoring & Maintenance

### EmailJS Dashboard

1. Go to EmailJS Dashboard
2. Check "Emails Sent" statistics
3. Monitor delivery success rate

### Common Issues & Fixes

**Issue: Emails not sending in production**
- Verify all env variables in Vercel
- Check EmailJS Service status
- Review error logs in browser console

**Issue: High bounce rate**
- Check sender email in templates
- Verify customer emails are valid
- Review spam filter settings

**Issue: Slow email delivery**
- Normal delay is 2-5 seconds
- Check internet connection
- Verify EmailJS status page

---

## 🎓 Best Practices

### 1. Always Test Before Deployment
```bash
npm run dev
# Test on localhost:5173
```

### 2. Monitor Email Delivery
- Check EmailJS dashboard regularly
- Track bounce rates
- Monitor customer feedback

### 3. Keep Secrets Secure
- Never commit `.env.local`
- Use Vercel's environment variables
- Don't share public keys publicly (well, they're public, but still secure)

### 4. Update Email Templates
- Keep branding consistent
- Update with company info
- Test template changes

### 5. Handle Errors Gracefully
- Errors are logged to console
- Orders complete even if email fails
- User sees friendly error messages

---

## 🚨 Production Checklist

Before going live:

- [ ] All environment variables set in .env.local
- [ ] EmailJS account created and verified
- [ ] Email templates created and tested
- [ ] Admin email configured
- [ ] Checkout page tested with real order
- [ ] Emails received and formatted correctly
- [ ] Error handling tested
- [ ] Code pushed to GitHub
- [ ] Deployed to Vercel
- [ ] Production email sending verified
- [ ] Admin notified of live deployment
- [ ] Support team trained on email system

---

## 📞 Support & Troubleshooting

### Check These First

1. **Browser Console Errors** (F12 → Console)
   - Most issues show detailed error messages
   - Copy error and search online

2. **EmailJS Dashboard**
   - Check service status
   - Verify template settings
   - Review email logs

3. **Environment Variables**
   - Verify all variables are set
   - Check for typos in variable names
   - Ensure no spaces around `=`

### Common Error Messages

**"EmailJS Public Key not found"**
- Add VITE_EMAILJS_PUBLIC_KEY to .env.local

**"EmailJS Service ID not configured"**
- Add VITE_EMAILJS_SERVICE_ID to .env.local

**"Template ID is required"**
- Add VITE_EMAILJS_TEMPLATE_ID_CUSTOMER to .env.local
- Add VITE_EMAILJS_TEMPLATE_ID_ORDER to .env.local

**"Email sending failed"**
- Check internet connection
- Verify EmailJS service is active
- Check template variables match

---

## 🎉 You're All Set!

Your EmailJS integration is complete and ready for production! 

### Next Steps:
1. Test locally
2. Deploy to Vercel
3. Monitor email delivery
4. Update email templates as needed
5. Provide feedback and improvements

**Questions?** Check EMAILJS_SETUP.md or EmailJS documentation at https://www.emailjs.com/docs/

---

**Made with ❤️ for Panstellia**
