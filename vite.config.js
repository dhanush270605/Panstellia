import crypto from 'crypto'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => {
      if (!body) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(body))
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })

const sendJson = (res, statusCode, payload) => {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

const createRazorpayDevApi = (env) => ({
  name: 'razorpay-dev-api',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const url = req.url?.split('?')[0]

      if (
        url !== '/api/create-order' &&
        url !== '/api/verify-payment' &&
        url !== '/api/mark-payment-failed'
      ) {
        next()
        return
      }

      if (req.method === 'OPTIONS') {
        res.statusCode = 204
        res.end()
        return
      }

      if (req.method !== 'POST') {
        sendJson(res, 405, { error: 'Method Not Allowed' })
        return
      }

      try {
        const keyId = env.RAZORPAY_KEY_ID || env.VITE_RAZORPAY_KEY_ID
        const keySecret = env.RAZORPAY_KEY_SECRET

        if (!keyId || !keySecret) {
          sendJson(res, 500, {
            error: 'Razorpay configuration error: missing RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET',
          })
          return
        }

        const body = await readJsonBody(req)

        if (url === '/api/create-order') {
          const { amount, currency = 'INR', receipt, notes = {} } = body
          const amountNum = Number(amount)

          if (!amountNum || !Number.isFinite(amountNum) || amountNum < 100) {
            sendJson(res, 400, { error: 'Invalid amount. Minimum amount is 100 paise (Rs. 1)' })
            return
          }

          const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
          const response = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
              Authorization: `Basic ${credentials}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: amountNum,
              currency,
              receipt,
              notes: {
                ...notes,
                platform: 'panstellia',
                created_at: new Date().toISOString(),
              },
            }),
          })

          const data = await response.json().catch(() => ({}))
          if (!response.ok) {
            const gatewayMessage =
              data?.error?.description ||
              data?.error?.reason ||
              data?.error?.code ||
              'Failed to create payment order'
            const authFailed =
              response.status === 401 ||
              gatewayMessage.toLowerCase().includes('authentication failed')

            sendJson(res, response.status, {
              error: authFailed
                ? 'Razorpay authentication failed. Check that RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are from the same Razorpay key pair, then restart the dev server.'
                : gatewayMessage,
            })
            return
          }

          sendJson(res, 200, {
            order_id: data.id,
            local_order_id: data.id,
            order_number: receipt || data.id,
            amount: data.amount,
            currency: data.currency,
          })
          return
        }

        if (url === '/api/mark-payment-failed') {
          const { razorpay_order_id } = body
          if (!razorpay_order_id) {
            sendJson(res, 400, { error: 'Missing required field: razorpay_order_id' })
            return
          }

          sendJson(res, 200, {
            ok: true,
            paymentStatus: 'Failed',
            local_order_id: razorpay_order_id,
            order_number: razorpay_order_id,
          })
          return
        }

        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body
        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
          sendJson(res, 400, {
            error: 'Missing required fields: razorpay_payment_id, razorpay_order_id, razorpay_signature',
          })
          return
        }

        const payload = `${razorpay_order_id}|${razorpay_payment_id}`
        const expectedSignature = crypto
          .createHmac('sha256', keySecret)
          .update(payload)
          .digest('hex')

        if (expectedSignature !== razorpay_signature) {
          sendJson(res, 400, { error: 'Payment verification failed. Signature mismatch.' })
          return
        }

        sendJson(res, 200, {
          verified: true,
          payment_id: razorpay_payment_id,
          order_id: razorpay_order_id,
          local_order_id: razorpay_order_id,
          order_number: razorpay_order_id,
        })
      } catch (error) {
        console.error('[razorpay-dev-api]', error)
        sendJson(res, 500, { error: error?.message || 'Internal server error' })
      }
    })
  },
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), createRazorpayDevApi(env)],
    server: {
      port: 5173,
      host: true,
    },
  }
})
