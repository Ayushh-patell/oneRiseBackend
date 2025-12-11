// routes/checkout.js
import express from "express";
import paypal from "@paypal/checkout-server-sdk";
import nodemailer from "nodemailer";
import Order from "../models/Order.js";
import dotenv from "dotenv";
import Coupon from "../models/Coupon.js";
dotenv.config();

const router = express.Router();

/* ===========================
   PAYPAL SDK SETUP
=========================== */

function paypalClient() {
  const env =
    process.env.PAYPAL_MODE === "live"
      ? new paypal.core.LiveEnvironment(
          process.env.PAYPAL_CLIENT_ID,
          process.env.PAYPAL_CLIENT_SECRET
        )
      : new paypal.core.SandboxEnvironment(
          process.env.PAYPAL_CLIENT_ID,
          process.env.PAYPAL_CLIENT_SECRET
        );

  return new paypal.core.PayPalHttpClient(env);
}

console.log("PAYPAL_MODE:", process.env.PAYPAL_MODE);
console.log(
  "PAYPAL_CLIENT_ID(first 10):",
  process.env.PAYPAL_CLIENT_ID?.slice(0, 10)
);

/* ===========================
   EMAIL SETUP
=========================== */

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

      const attributesLine =
        Array.isArray(item.attributes) && item.attributes.length
          ? `<div style="font-size:12px;color:#555;">
              ${item.attributes
                .map((a) => `${a.name}: ${a.value}`)
                .join(", ")}
             </div>`
          : "";

      return `
        <tr>
          <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">
            ${name}${color}
            ${attributesLine}
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

async function sendOrderConfirmationEmails({ customer, items, payment }) {
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

  const paymentRef = payment?.paypalOrderId
    ? `<p style="margin:4px 0;">
        <strong>PayPal Order ID:</strong> ${payment.paypalOrderId}<br/>
        ${
          payment.paypalCaptureId
            ? `<strong>PayPal Capture ID:</strong> ${payment.paypalCaptureId}<br/>`
            : ""
        }
      </p>`
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

        ${paymentRef}

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
          ${paymentRef}
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

/* ===========================
   COUPON USAGE HELPER
=========================== */

async function markCouponUsed(couponCode) {
  if (!couponCode) return;

  const normalizedCode = couponCode.trim().toUpperCase();

  const coupon = await Coupon.findOne({ code: normalizedCode });
  if (!coupon) return;

  // optional: don't exceed usageLimit if set
  if (
    coupon.usageLimit !== null &&
    typeof coupon.usageLimit === "number" &&
    coupon.usedCount >= coupon.usageLimit
  ) {
    return;
  }

  coupon.usedCount += 1;
  await coupon.save();
}

/* ===========================
   1) CREATE PAYPAL ORDER
   (replaces create-stripe-session)
=========================== */

router.post("/create-paypal-order", async (req, res) => {
  try {
    const { items, customer } = req.body;
    console.log("create called");

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items in cart" });
    }
    if (!customer?.email) {
      return res.status(400).json({ error: "Customer email is required" });
    }

    // Calculate subtotal from cart
    const subtotal = items.reduce((sum, item) => {
      const price = Number(item.price || item.unitPrice || 0);
      const qty = Number(item.quantity || 1);
      return sum + price * qty;
    }, 0);

    // 👉 Tax 8.25%, shipping free
    const TAX_RATE = 0.0825;
    const shippingFee = 0;
    const tax = Number((subtotal * TAX_RATE).toFixed(2));
    const total = Number((subtotal + tax + shippingFee).toFixed(2));

    const currency = "USD";

    console.log("paypal", paypal);

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: total.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: currency,
                value: subtotal.toFixed(2),
              },
              tax_total: {
                currency_code: currency,
                value: tax.toFixed(2),
              },
              shipping: {
                currency_code: currency,
                value: shippingFee.toFixed(2),
              },
            },
          },
        },
      ],
      payer: {
        email_address: customer.email,
        name: {
          given_name: customer.fullName?.split(" ")[0] || "",
          surname:
            customer.fullName?.split(" ").slice(1).join(" ") ||
            customer.fullName ||
            "",
        },
      },
      application_context: {
        brand_name: process.env.BRAND_NAME || "Your Store",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
      },
    });

    const paypalResp = await paypalClient().execute(request);

    console.log("create done");

    return res.json({
      orderId: paypalResp.result.id,
    });
  } catch (err) {
    console.error("PayPal create order error:", err);
    return res.status(500).json({
      error: "Failed to create PayPal order",
    });
  }
});

/* ===========================
   2) CONFIRM ORDER (PAYPAL CAPTURE)
   Replaces Stripe confirm-order logic
   Body expected: { orderId, items, customer, couponCode? }
=========================== */

router.post("/confirm-order", async (req, res) => {
  const {
    orderId,
    items: clientItems,
    customer: clientCustomer,
    couponCode,
  } = req.body;

  console.log("confirm called");

  if (!orderId) {
    return res.status(400).json({ error: "orderId is required" });
  }

  try {
    // Avoid duplicate orders if user refreshes success page
    const existing = await Order.findOne({ paypalOrderId: orderId });
    if (existing) {
      return res.json({ order: existing, alreadyExisted: true });
    }
    console.log("found order");

    // Capture the PayPal order
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});
    const captureResp = await paypalClient().execute(request);

    const result = captureResp.result;

    if (result.status !== "COMPLETED") {
      return res.status(400).json({ error: "Payment not completed" });
    }
    console.log("confirm complete");

    const purchaseUnit = result.purchase_units?.[0];
    const paypalAmount = Number(purchaseUnit?.amount?.value || 0);
    const currency = purchaseUnit?.amount?.currency_code || "USD";

    const capture = purchaseUnit?.payments?.captures?.[0] || {};

    // Build items with attributes (from client)
    const items = (clientItems || []).map((item) => {
      const quantity = Number(item.quantity || 1);
      const unitPrice = Number(item.price || item.unitPrice || 0);

      const attributes = Array.isArray(item.attributes)
        ? item.attributes.map((a) => ({
            name: a.name,
            value: a.value,
          }))
        : [];

      return {
        productId: item.id?.toString() || item.productId || "",
        name: item.name,
        colorName: item.options?.colorName || item.colorName || null,
        attributes,
        quantity,
        unitPrice,
        lineTotal: unitPrice * quantity,
      };
    });

    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);

    // 👉 Recompute tax & total to check against PayPal
    const TAX_RATE = 0.0825;
    const tax = Number((subtotal * TAX_RATE).toFixed(2));
    const orderTotal = Number((subtotal + tax).toFixed(2));

    // Optional sanity check
    if (orderTotal > 0 && Math.abs(orderTotal - paypalAmount) > 0.01) {
      console.warn(
        "Warning: orderTotal and PayPal amount mismatch",
        orderTotal,
        paypalAmount
      );
    }

    // Prefer clientCustomer, but fallback to PayPal payer/shipping if needed
    const payer = result.payer || {};
    const shipping = purchaseUnit?.shipping || {};

    const customer = {
      fullName:
        clientCustomer?.fullName ||
        `${payer.name?.given_name || ""} ${payer.name?.surname || ""}`.trim(),
      email: clientCustomer?.email || payer.email_address,
      phone: clientCustomer?.phone || "",
      addressLine1:
        clientCustomer?.addressLine1 || shipping.address?.address_line_1 || "",
      addressLine2:
        clientCustomer?.addressLine2 || shipping.address?.address_line_2 || "",
      city: clientCustomer?.city || shipping.address?.admin_area_2 || "",
      state: clientCustomer?.state || shipping.address?.admin_area_1 || "",
      postalCode:
        clientCustomer?.postalCode || shipping.address?.postal_code || "",
      country: clientCustomer?.country || shipping.address?.country_code || "",
    };

    const normalizedCouponCode = couponCode
      ? couponCode.trim().toUpperCase()
      : null;

    const order = await Order.create({
      customer,
      items,
      subtotal,
      tax, // store tax if your schema has this
      total: orderTotal, // and the grand total if schema supports it
      currency,
      paymentStatus: "paid",
      orderStatus: "processing",
      paypalOrderId: orderId,
      paypalCaptureId: capture.id,
      paypalPayerId: payer.payer_id,
      notes: clientCustomer?.notes || "",
      // optional fields if your Order schema supports coupons:
      couponCode: normalizedCouponCode || undefined,
    });
    console.log("confirm done, with order");

    // Mark coupon as used only after successful order creation
    if (normalizedCouponCode) {
      try {
        await markCouponUsed(normalizedCouponCode);
      } catch (err) {
        console.error("Failed to mark coupon as used:", err);
      }
    }

    // send confirmation emails (customer + you)
    sendOrderConfirmationEmails({
      customer: { ...customer, notes: clientCustomer?.notes },
      items,
      payment: {
        paypalOrderId: orderId,
        paypalCaptureId: capture.id,
      },
    }).catch((err) => {
      console.error("sendOrderConfirmationEmails failed:", err);
    });

    return res.json({ order });
  } catch (err) {
    console.error("Error confirming PayPal order:", err);
    return res.status(500).json({ error: "Failed to confirm order" });
  }
});

export default router;
