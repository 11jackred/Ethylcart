
import postgres from "postgres";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    const jsonResponse = (data, status = 200) => {
      return Response.json(data, {
        status,
        headers: corsHeaders
      });
    };

    const hashToken = async (token) => {
  const data = new TextEncoder().encode(token);
  const hash = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hash))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
};

    if (url.pathname === "/") {
      return jsonResponse({
        message: "Ethylcart backend is running!"
      });
    }

    const sql = postgres(env.HYPERDRIVE.connectionString, {
      max: 5,
      fetch_types: false,prepare: true
    });

    try {
            // Customer: check payment status using the private QR token.
      if (
        url.pathname === "/orders/payment-status" &&
        request.method === "POST"
      ) {
        const body = await request.json();

        if (
          !/^\d+$/.test(String(body.orderId)) ||
          typeof body.verificationToken !== "string" ||
          !body.verificationToken
        ) {
          return jsonResponse({ error: "Invalid request" }, 400);
        }

        const tokenHash = await hashToken(body.verificationToken);

        const [order] = await sql`
          SELECT payment_status
          FROM orders
          WHERE
            id = ${body.orderId}
            AND payment_qr_token_hash = ${tokenHash}
          LIMIT 1
        `;

        if (!order) {
          return jsonResponse({ error: "Invalid verification token" }, 404);
        }

        return jsonResponse({
          paymentStatus: order.payment_status
        });
      }

      // Retrieve orders (admin only).
      if (
        url.pathname === "/orders" &&
        request.method === "GET"
      ) {
        const authHeader = request.headers.get("Authorization");

        if (
          !env.ADMIN_PASSWORD ||
          authHeader !== `Bearer ${env.ADMIN_PASSWORD}`
        ) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }

        const orders = await sql`
          SELECT
            o.id,
            o.total_items,
            o.total_price,
            o.status,
            o.payment_method,
            o.payment_status,
            o.created_at,
            COALESCE(
              (
                SELECT json_agg(
                  json_build_object(
                    'productId', oi.product_id,
                    'productName', oi.product_name,
                    'quantity', oi.quantity,
                    'price', oi.price,
                    'subtotal', oi.subtotal
                  )
                  ORDER BY oi.id
                )
                FROM order_items oi
                WHERE oi.order_id = o.id
              ),
              '[]'::json
            ) AS items
          FROM orders o
          ORDER BY o.created_at DESC
          LIMIT 100
        `;

        return jsonResponse({ orders });
      }

      // Update order status (admin only).
    
      // Update order status or verify payment (admin only).
      if (
        url.pathname.startsWith("/orders/") &&
        request.method === "PATCH"
      ) {
        const authHeader = request.headers.get("Authorization");

        if (
          !env.ADMIN_PASSWORD ||
          authHeader !== `Bearer ${env.ADMIN_PASSWORD}`
        ) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }

        const orderId = url.pathname.split("/")[2];

        if (!/^\d+$/.test(orderId)) {
          return jsonResponse({ error: "Invalid order ID" }, 400);
        }

        const body = await request.json();

        // Verify payment using the customer's QR token.
        if (body.paymentStatus === "paid") {

          if (
            typeof body.verificationToken !== "string" ||
            !body.verificationToken
          ) {
            return jsonResponse(
              { error: "Verification token required" },
              400
            );
          }

          const tokenHash = await hashToken(
            body.verificationToken
          );

          const [order] = await sql`
            UPDATE orders
            SET
              payment_status = 'paid',
           
            WHERE
              id = ${orderId}
              AND payment_qr_token_hash = ${tokenHash}
              AND payment_status = 'pending'
            RETURNING id, payment_status
          `;

          if (!order) {
            return jsonResponse(
              {
                error: "Invalid QR code or payment already processed"
              },
              409
            );
          }

          return jsonResponse({
            message: "Payment verified successfully",
            order
          });
        }

        // Otherwise, update the normal order status.
        const allowedStatuses = [
          "confirmed",
          "processing",
          "completed",
          "cancelled"
        ];

        if (!allowedStatuses.includes(body.status)) {
          return jsonResponse(
            { error: "Invalid order status" },
            400
          );
        }

        const [order] = await sql`
          UPDATE orders
          SET status = ${body.status}
          WHERE id = ${orderId}
          RETURNING id, status
        `;

        if (!order) {
          return jsonResponse(
            { error: "Order not found" },
            404
          );
        }

        return jsonResponse({
          message: "Order status updated",
          order
        });
      }


      // Create a new order.
      if (
        url.pathname === "/orders" &&
        request.method === "POST"
      ) {
        const body = await request.json();

        if (
          !Array.isArray(body.items) ||
          body.items.length === 0 ||
          body.items.length > 100
        ) {
          return jsonResponse(
            { error: "Invalid or empty order" },
            400
          );
        }

        // Only offline payments are enabled for now.
        // Online payment methods can be added later.
        const paymentMethod = body.paymentMethod;

        if (paymentMethod !== "offline") {
          return jsonResponse(
            { error: "Unsupported payment method" },
            400
          );
        }

        const items = body.items.map(item => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity)
        }));

        if (items.some(item =>
          !Number.isSafeInteger(item.productId) ||
          item.productId <= 0 ||
          !Number.isSafeInteger(item.quantity) ||
          item.quantity <= 0
        )) {
          return jsonResponse(
            { error: "Invalid product ID or quantity" },
            400
          );
        }

        const productIds = items.map(item => item.productId);

        if (new Set(productIds).size !== productIds.length) {
          return jsonResponse(
            { error: "Duplicate products in order" },
            400
          );
        }

        const qrToken = crypto.randomUUID();
        const qrTokenHash = await hashToken(qrToken);
        const result = await sql.begin(async tx => {

          // Retrieve trusted product information from Neon.
          const products = await tx`
            SELECT id, name, price
            FROM products
            WHERE id IN ${tx(productIds)}
          `;

          if (products.length !== items.length) {
            return { notFound: true };
          }

          const productMap = new Map(
            products.map(product => [
              String(product.id),
              product
            ])
          );

          let totalItems = 0;
          let totalPrice = 0;

          for (const item of items) {
            const product = productMap.get(
              String(item.productId)
            );

            totalItems += item.quantity;
            totalPrice += Number(product.price) * item.quantity;
          }

          totalPrice = Number(totalPrice.toFixed(2));

          // Create order with pending offline payment.
          const [order] = await tx`
  INSERT INTO orders (
    total_items,
    total_price,
    status,
    payment_method,
    payment_status,
    payment_qr_token_hash
  )
  VALUES (
    ${totalItems},
    ${totalPrice},
    'confirmed',
    ${paymentMethod},
    'pending',
    ${qrTokenHash}
  )
  RETURNING
    id,
    total_items,
    total_price,
    status,
    payment_method,
    payment_status
`;

          // Save individual order items.
          for (const item of items) {
            const product = productMap.get(
              String(item.productId)
            );

            const price = Number(product.price);

            const subtotal = Number(
              (price * item.quantity).toFixed(2)
            );

            await tx`
              INSERT INTO order_items (
                order_id,
                product_id,
                product_name,
                quantity,
                price,
                subtotal
              )
              VALUES (
                ${order.id},
                ${product.id},
                ${product.name},
                ${item.quantity},
                ${price},
                ${subtotal}
              )
            `;
          }

          return { order };
        });

        if (result.notFound) {
          return jsonResponse(
            { error: "One or more products were not found" },
            404
          );
        }

          return jsonResponse({
          message: "Order created successfully",
          order: {
          ...result.order,
          qrToken
          }
          }, 201);
      }

      // Find one product by barcode.
      if (
        url.pathname.startsWith("/products/barcode/") &&
        request.method === "GET"
      ) {
        const barcode = url.pathname.slice(
          "/products/barcode/".length
        );

        if (!barcode || !/^\d+$/.test(barcode)) {
          return jsonResponse({ error: "Invalid barcode" }, 400);
        }

        const [product] = await sql`
          SELECT id, name, barcode, img, price, weight
          FROM products
          WHERE barcode = ${barcode}
          LIMIT 1
        `;

        if (!product) {
          return jsonResponse({ error: "Product not found" }, 404);
        }

        return jsonResponse(product);
      }

      // Add a product.
      if (
        url.pathname === "/products" &&
        request.method === "POST"
      ) {
        const body = await request.json();

        if (
          typeof body.name !== "string" ||
          !body.name.trim() ||
          !Number.isFinite(Number(body.price)) ||
          Number(body.price) < 0 ||
          typeof body.weight !== "string" ||
          !body.weight.trim() ||
          (body.barcode != null &&
            typeof body.barcode !== "string") ||
          (body.img != null && typeof body.img !== "string")
        ) {
          return jsonResponse({ error: "Invalid product data" }, 400);
        }

        const [product] = await sql`
          INSERT INTO products (name, barcode, img, price, weight)
          VALUES (
            ${body.name.trim()},
            ${body.barcode ?? null},
            ${body.img ?? ""},
            ${Number(body.price)},
            ${body.weight.trim()}
          )
          RETURNING id, name, barcode, img, price, weight
        `;

        return jsonResponse(product, 201);
      }

      // Delete a product by ID.
      if (
        url.pathname.startsWith("/products/") &&
        request.method === "DELETE"
      ) {
        const id = url.pathname.split("/")[2];

        if (!/^\d+$/.test(id)) {
          return jsonResponse({ error: "Invalid product ID" }, 400);
        }

        const [product] = await sql`
          DELETE FROM products
          WHERE id = ${id}
          RETURNING id, name
        `;

        if (!product) {
          return jsonResponse({ error: "Product not found" }, 404);
        }

        return jsonResponse({
          message: "Product deleted successfully",
          product
        });
      }

      return jsonResponse({ error: "Route not found" }, 404);

    } catch (error) {
      console.error("Request failed:", error.message);

      return jsonResponse(
        { error: "Request failed. Check Cloudflare logs." },
        500
      );

    } 
  }
};
