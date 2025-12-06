// routes/checkout.js
import express from "express";
import Stripe from"stripe";
import nodemailer from "nodemailer";
import Order from "../models/Order.js";
import dotenv from "dotenv";
dotenv.config();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const router = express.Router();


// ========== EMAIL SETUP ==========

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function buildOrderItemsHtml(items = []) {
  if (!items.length) return "<p>No items.</p>";

  const rows = items
    .map((item) => {
      const name = item.name || "Item";
      const color = item.colorName ? ` (${item.colorName})` : "";
      const quantity = item.quantity || 1;
      const lineTotal = item.lineTotal ?? 0;

      return `
        <tr>
          <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">
            ${name}${color}
          </td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align:center;">
            ${quantity}
          </td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align:right;">
            ${lineTotal.toFixed(2)}
          </td>
        </tr>
      `;
    })
    .join("");

  const subtotal = items.reduce((acc, item) => acc + (item.lineTotal || 0), 0);

  return `
    <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; font-size: 13px;">
      <thead>
        <tr>
          <th align="left" style="padding: 6px 8px; border-bottom: 2px solid #ddd;">Item</th>
          <th align="center" style="padding: 6px 8px; border-bottom: 2px solid #ddd;">Qty</th>
          <th align="right" style="padding: 6px 8px; border-bottom: 2px solid #ddd;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr>
          <td colspan="2" style="padding: 8px; text-align:right; font-weight:bold;">Subtotal</td>
          <td style="padding: 8px; text-align:right; font-weight:bold;">${subtotal.toFixed(
            2
          )}</td>
        </tr>
      </tbody>
    </table>
  `;
}

async function sendOrderConfirmationEmails({ customer, items, stripeSession }) {
  const brandName = process.env.BRAND_NAME || "Your Store";
  const clientEmail = process.env.CLIENT_EMAIL;

  if (!customer?.email) {
    console.warn("Customer email missing, not sending confirmation email.");
    return;
  }

  if (!clientEmail) {
    console.warn(
      "CLIENT_EMAIL env not set, not sending store-side confirmation email."
    );
  }

  const itemsHtml = buildOrderItemsHtml(items);

  const shippingAddressHtml = `
    <p style="margin:4px 0;"><strong>Name:</strong> ${customer.fullName}</p>
    <p style="margin:4px 0;"><strong>Email:</strong> ${customer.email}</p>
    <p style="margin:4px 0;"><strong>Phone:</strong> ${customer.phone}</p>
    <p style="margin:4px 0;">
      <strong>Address:</strong><br/>
      ${customer.addressLine1}<br/>
      ${customer.addressLine2 ? customer.addressLine2 + "<br/>" : ""}
      ${customer.city}, ${customer.state} - ${customer.postalCode}<br/>
      ${customer.country}
    </p>
    ${
      customer.notes
        ? `<p style="margin:4px 0;"><strong>Notes:</strong> ${customer.notes}</p>`
        : ""
    }
  `;

  const stripeRef = stripeSession?.id
    ? `<p style="margin:4px 0;"><strong>Stripe Session ID:</strong> ${stripeSession.id}</p>`
    : "";

  // customer email
  const customerMailOptions = {
    from: `"${brandName}" <${process.env.SMTP_USER}>`,
    to: customer.email,
    subject: `Your order with ${brandName}`,
    html: `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #333;">
        <h2 style="margin-bottom:8px;">Thank you for your order 👋</h2>
        <p style="margin:4px 0;">
          Hi ${customer.fullName || ""},<br/>
          We’ve received your payment and your order is now being processed.
        </p>

        ${stripeRef}

        <h3 style="margin-top:16px; margin-bottom:8px;">Order summary</h3>
        ${itemsHtml}

        <h3 style="margin-top:16px; margin-bottom:8px;">Shipping details</h3>
        ${shippingAddressHtml}

        <p style="margin-top:16px; font-size:12px; color:#777;">
          This is an automated email.
        </p>
      </div>
    `,
  };

  // client/store email
  const clientMailOptions = clientEmail
    ? {
        from: `"${brandName} Orders" <${process.env.SMTP_USER}>`,
        to: clientEmail,
        subject: `New paid order – ${customer.fullName || "Customer"}`,
        html: `
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #333;">
          <h2 style="margin-bottom:8px;">New paid order</h2>
          ${stripeRef}
          <h3 style="margin-top:16px; margin-bottom:8px;">Customer</h3>
          ${shippingAddressHtml}
          <h3 style="margin-top:16px; margin-bottom:8px;">Items</h3>
          ${itemsHtml}
        </div>
      `,
      }
    : null;

  try {
    await transporter.sendMail(customerMailOptions);
  } catch (err) {
    console.error("Error sending customer confirmation email:", err);
  }

  if (clientMailOptions) {
    try {
      await transporter.sendMail(clientMailOptions);
    } catch (err) {
      console.error("Error sending client/store email:", err);
    }
  }
}

// ========== 1) CREATE STRIPE CHECKOUT SESSION ==========

router.post("/create-stripe-session", async (req, res) => {
  try {
    const { items, customer } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items in cart" });
    }
    if (!customer?.email) {
      return res.status(400).json({ error: "Customer email is required" });
    }

    const lineItems = items.map((item) => ({
      price_data: {
        currency: "usd", // change to "inr" etc.
        unit_amount: Math.round(Number(item.price || 0) * 100), // cents/paise
        product_data: {
          name: item.name,
          metadata: {
            productId: item.id?.toString() ?? "",
            colorName: item.options?.colorName ?? "",
          },
        },
      },
      quantity: item.quantity,
    }));

    console.log(`${process.env.CLIENT_URL}/checkout-success?session_id={CHECKOUT_SESSION_ID}`);
    
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      customer_email: customer.email,
      metadata: {
        fullName: customer.fullName,
        phone: customer.phone,
        addressLine1: customer.addressLine1,
        addressLine2: customer.addressLine2,
        city: customer.city,
        state: customer.state,
        postalCode: customer.postalCode,
        country: customer.country,
        notes: customer.notes,
      },
      success_url: `${process.env.CLIENT_URL}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/checkout-cancel`,
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe session error:", err);
    return res.status(500).json({
      error: "Failed to create Stripe Checkout Session",
    });
  }
});

// ========== 2) CONFIRM ORDER AFTER SUCCESS ==========
// frontend sends sessionId (from success page) => we verify & save

router.post("/confirm-order", async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: "sessionId is required" });
  }

  try {
    // Avoid duplicate orders if user refreshes success page
    const existing = await Order.findOne({ stripeSessionId: sessionId });
    if (existing) {
      return res.json({ order: existing, alreadyExisted: true });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price.product"],
    });

    if (session.payment_status !== "paid") {
      return res.status(400).json({ error: "Payment not completed" });
    }

    const lineItems = session.line_items?.data || [];

    const items = lineItems.map((li) => {
      const price = li.price;
      const product = price.product;
      const metadata = product?.metadata || {};
      const name = product?.name || li.description;
      const quantity = li.quantity || 1;
      const unitAmount = (price.unit_amount || 0) / 100;

      const productId = metadata.productId || price.id;
      const colorName = metadata.colorName || null;

      return {
        productId,
        name,
        colorName,
        quantity,
        unitPrice: unitAmount,
        lineTotal: unitAmount * quantity,
      };
    });

    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);

    const customer = {
      fullName: session.metadata?.fullName,
      email: session.customer_details?.email || session.customer_email,
      phone: session.metadata?.phone,
      addressLine1: session.metadata?.addressLine1,
      addressLine2: session.metadata?.addressLine2,
      city: session.metadata?.city,
      state: session.metadata?.state,
      postalCode: session.metadata?.postalCode,
      country: session.metadata?.country,
    };

    const order = await Order.create({
      customer,
      items,
      subtotal,
      currency: session.currency,
      paymentStatus: "paid",
      orderStatus: "processing",
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent,
      stripeCustomerId: session.customer,
      notes: session.metadata?.notes,
    });

    // send confirmation emails (customer + you)
    sendOrderConfirmationEmails({
      customer: { ...customer, notes: session.metadata?.notes },
      items,
      stripeSession: session,
    }).catch((err) => {
      console.error("sendOrderConfirmationEmails failed:", err);
    });

    return res.json({ order });
  } catch (err) {
    console.error("Error confirming order:", err);
    return res.status(500).json({ error: "Failed to confirm order" });
  }
});

export default router

