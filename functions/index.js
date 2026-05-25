const cors = require("cors");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// Firebase Functions v2
const { onRequest } = require("firebase-functions/v2/https");

// Initialize Firebase Admin (if you later need Firestore; harmless otherwise)
try {
  admin.initializeApp();
} catch (e) {
  // ignore if already initialized
}

const allowedOrigins = [
  "http://localhost:5173",
  "https://panstellia.vercel.app",
  "https://panstellia.com",
];

const corsMiddleware = cors({
  // Reflect only explicitly allowed origins
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },

  methods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],

  // Keep false so browsers don't require credentials/withCredentials.
  credentials: false,
});

function setExplicitCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (!origin) return;
  if (!allowedOrigins.includes(origin)) return;

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

/**
 * Wraps an onRequest handler with CORS.
 * Important: handle OPTIONS preflight without invoking the main handler.
 */
function withCors(handler) {
  return onRequest(async (req, res) => {
    // Log minimal request info for debugging CORS/preflight
    console.log("[functions] incoming request", {
      method: req.method,
      path: req.path,
      origin: req.headers.origin,
      host: req.headers.host,
    });

    // Ensure we always set the CORS headers before responding.
    setExplicitCorsHeaders(req, res);

    // Run CORS middleware to apply its headers as well.
    corsMiddleware(req, res, (err) => {
      // If origin isn't allowed, respond with 403 but still avoid missing headers.
      if (err) {
        console.error("[functions] CORS error:", err?.message || err);
        // If origin not allowed, browsers will treat as blocked anyway.
        return res.status(403).json({ error: "CORS blocked" });
      }

      // Preflight: respond immediately.
      if (req.method === "OPTIONS") {
        console.log("[functions] OPTIONS preflight ok -> 204");
        return res.status(204).send("");
      }

      // Only allow POST after preflight
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
      }

      return handler(req, res);
    });
  });
}


function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) return null;

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

function getMissingRazorpayEnv() {
  const missing = [];
  if (!process.env.RAZORPAY_KEY_ID) missing.push("RAZORPAY_KEY_ID");
  if (!process.env.RAZORPAY_KEY_SECRET) missing.push("RAZORPAY_KEY_SECRET");
  return missing;
}

async function getAuthenticatedUser(req) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer (.+)$/);
  if (!match) {
    const error = new Error("Authentication required");
    error.statusCode = 401;
    throw error;
  }

  try {
    return await admin.auth().verifyIdToken(match[1]);
  } catch (authError) {
    console.error("[functions] Firebase auth token verification failed:", authError?.message || authError);
    const error = new Error("Invalid authentication token");
    error.statusCode = 401;
    throw error;
  }
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function sanitizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) return [];

  return items.slice(0, 50).map((item) => ({
    id: String(item?.id || ""),
    name: String(item?.name || "Jewellery Item").slice(0, 160),
    price: toNumber(item?.price),
    quantity: Math.max(1, Math.min(99, Math.floor(toNumber(item?.quantity, 1)))),
    image: String(item?.image || ""),
    category: String(item?.category || ""),
  }));
}

function sanitizeCustomer(customer, token) {
  return {
    name: String(customer?.name || token.name || "").slice(0, 120),
    email: String(customer?.email || token.email || "").slice(0, 160),
    phone: String(customer?.phone || "").slice(0, 32),
  };
}

function sanitizeAddress(address) {
  return {
    address: String(address?.address || "").slice(0, 500),
    city: String(address?.city || "").slice(0, 120),
    state: String(address?.state || "").slice(0, 120),
    pincode: String(address?.pincode || "").slice(0, 20),
  };
}

function buildOrderNumber(prefix = "PAN") {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${Date.now()}-${random}`;
}

async function findPendingPaymentByRazorpayOrderId(razorpayOrderId, userId) {
  const snapshot = await admin
    .firestore()
    .collection("payments")
    .where("razorpayOrderId", "==", razorpayOrderId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return snapshot.docs[0];
}

async function createOrderHandler(req, res) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const razorpay = getRazorpayClient();
    const missing = getMissingRazorpayEnv();

    if (missing.length) {
      console.error("[functions] Missing Razorpay env vars:", missing);
      return res
        .status(500)
        .json({ error: `Razorpay configuration error: missing ${missing.join(", ")}` });
    }

    const {
      amount,
      currency = "INR",
      receipt,
      notes = {},
      customer,
      items,
      totals = {},
      shippingAddress,
    } = req.body ?? {};

    if (!currency || typeof currency !== "string") {
      return res.status(400).json({ error: "Invalid currency" });
    }

    if (receipt && typeof receipt !== "string") {
      return res.status(400).json({ error: "Invalid receipt" });
    }

    if (notes && typeof notes !== "object") {
      return res.status(400).json({ error: "Invalid notes" });
    }

    const amountNum = Number(amount);
    if (!amountNum || !Number.isFinite(amountNum) || amountNum < 100) {
      return res.status(400).json({
        error: "Invalid amount. Minimum amount is 100 paise (Rs. 1)",
      });
    }

    const orderItems = sanitizeItems(items);
    if (!orderItems.length) {
      return res.status(400).json({ error: "Order must include at least one item" });
    }

    const customerInfo = sanitizeCustomer(customer, authUser);
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      return res.status(400).json({ error: "Missing customer name, email, or phone" });
    }

    const addressInfo = sanitizeAddress(shippingAddress);
    if (!addressInfo.address) {
      return res.status(400).json({ error: "Missing shipping address" });
    }

    const orderNumber = buildOrderNumber();

    console.log("[functions] Creating Razorpay order", {
      amount: amountNum,
      currency,
      receipt,
      orderNumber,
    });

    const order = await razorpay.orders.create({
      amount: amountNum,
      currency,
      receipt,
      notes: {
        ...notes,
        order_number: orderNumber,
        user_id: authUser.uid,
        platform: "panstellia",
        created_at: new Date().toISOString(),
      },
    });

    const db = admin.firestore();
    const commonOrderData = {
      userId: authUser.uid,
      orderId: orderNumber,
      razorpayOrderId: order.id,
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      phone: customerInfo.phone,
      items: orderItems,
      subtotal: toNumber(totals.subtotal),
      shipping: toNumber(totals.shipping),
      tax: toNumber(totals.tax),
      total: amountNum / 100,
      amount: amountNum,
      currency,
      paymentMethod: "razorpay",
      paymentStatus: "Pending",
      status: "pending_payment",
      address: addressInfo.address,
      city: addressInfo.city,
      state: addressInfo.state,
      pincode: addressInfo.pincode,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const orderRef = await db.collection("orders").add(commonOrderData);
    const paymentRef = await db.collection("payments").add({
      ...commonOrderData,
      orderDocId: orderRef.id,
    });

    return res.status(200).json({
      order_id: order.id,
      local_order_id: orderRef.id,
      payment_record_id: paymentRef.id,
      order_number: orderNumber,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("[functions] Error creating order:", error);

    const statusCode = error?.statusCode || 500;
    const code = error?.error?.code;

    if (statusCode === 401 || code === "AUTHENTICATION_FAILURE") {
      return res.status(401).json({
        error:
          "Razorpay authentication failed. Check that RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are from the same Razorpay key pair, then redeploy functions.",
      });
    }

    if (statusCode && statusCode !== 500) {
      return res.status(statusCode).json({
        error: error?.error?.description || error?.message || "Failed to create order",
      });
    }

    return res.status(500).json({ error: error?.message || "Internal server error" });
  }
}

async function verifyPaymentHandler(req, res) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body ?? {};

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        error: "Missing required fields: razorpay_payment_id, razorpay_order_id, razorpay_signature",
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const keyId = process.env.RAZORPAY_KEY_ID;

    if (!keySecret) {
      console.error("[functions] RAZORPAY_KEY_SECRET not configured");
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Signature verification
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(payload)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("[functions] Payment signature verification failed");
      const pendingPayment = await findPendingPaymentByRazorpayOrderId(razorpay_order_id, authUser.uid);
      if (pendingPayment) {
        const failedUpdate = {
          paymentStatus: "Failed",
          status: "payment_failed",
          razorpayPaymentId: razorpay_payment_id,
          failureReason: "Signature mismatch",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await pendingPayment.ref.update(failedUpdate);

        const orderDocId = pendingPayment.data()?.orderDocId;
        if (orderDocId) {
          await admin.firestore().collection("orders").doc(orderDocId).update(failedUpdate);
        }
      }
      return res.status(400).json({ error: "Payment verification failed. Signature mismatch." });
    }

    // Optional extra guard: verify payment status against Razorpay API
    // (Do NOT fail hard if Razorpay API fetch fails; signature is the main guard)
    try {
      if (keyId) {
        const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const payment = await razorpay.payments.fetch(razorpay_payment_id);

        const allowedStatuses = new Set([
          "authorized",
          "captured",
          "paid",
          "settled",
        ]);

        if (payment?.status && !allowedStatuses.has(payment.status)) {
          return res.status(400).json({
            error: `Payment not authorized or completed. status=${payment.status}`,
          });
        }
      }
    } catch (razorpayError) {
      console.warn(
        "[functions] Razorpay API verification failed, continuing with signature verification:",
        razorpayError?.message || razorpayError
      );
    }

    console.log("[functions] Payment verified", {
      razorpay_payment_id,
      razorpay_order_id,
    });

    const pendingPayment = await findPendingPaymentByRazorpayOrderId(razorpay_order_id, authUser.uid);
    if (!pendingPayment) {
      return res.status(404).json({ error: "Pending payment order not found" });
    }

    const paymentData = pendingPayment.data();
    const paidUpdate = {
      paymentStatus: "Paid",
      status: "processing",
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await pendingPayment.ref.update(paidUpdate);

    if (paymentData?.orderDocId) {
      await admin.firestore().collection("orders").doc(paymentData.orderDocId).update(paidUpdate);
    }

    return res.status(200).json({
      verified: true,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      local_order_id: paymentData?.orderDocId || null,
      order_number: paymentData?.orderId || razorpay_order_id,
    });
  } catch (error) {
    console.error("[functions] Error verifying payment:", error);
    return res.status(error?.statusCode || 500).json({ error: error?.message || "Internal server error" });
  }
}

async function markPaymentFailedHandler(req, res) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const { razorpay_order_id, razorpay_payment_id, reason = "Payment was not completed" } = req.body ?? {};

    if (!razorpay_order_id) {
      return res.status(400).json({ error: "Missing required field: razorpay_order_id" });
    }

    const pendingPayment = await findPendingPaymentByRazorpayOrderId(razorpay_order_id, authUser.uid);
    if (!pendingPayment) {
      return res.status(404).json({ error: "Pending payment order not found" });
    }

    const failedUpdate = {
      paymentStatus: "Failed",
      status: "payment_failed",
      razorpayPaymentId: razorpay_payment_id || null,
      failureReason: String(reason).slice(0, 300),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await pendingPayment.ref.update(failedUpdate);

    const orderDocId = pendingPayment.data()?.orderDocId;
    if (orderDocId) {
      await admin.firestore().collection("orders").doc(orderDocId).update(failedUpdate);
    }

    return res.status(200).json({
      ok: true,
      paymentStatus: "Failed",
      local_order_id: orderDocId || null,
      order_number: pendingPayment.data()?.orderId || razorpay_order_id,
    });
  } catch (error) {
    console.error("[functions] Error marking payment failed:", error);
    return res.status(error?.statusCode || 500).json({ error: error?.message || "Internal server error" });
  }
}

exports.createOrder = withCors(createOrderHandler);
exports.verifyPayment = withCors(verifyPaymentHandler);
exports.markPaymentFailed = withCors(markPaymentFailedHandler);


