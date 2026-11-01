
import postgres from "postgres";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Allow requests from your website.
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    // Handle browser preflight requests.
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // Helper to attach CORS headers to every API response.
    const jsonResponse = (data, status = 200) => {
      return Response.json(data, {
        status,
        headers: corsHeaders
      });
    };

    if (url.pathname === "/") {
      return jsonResponse({
        message: "Ethylcart backend is running!"
      });
    }

    const sql = postgres(env.HYPERDRIVE.connectionString, {
      max: 5,
      fetch_types: false
    });

    try {
      // Find one product by barcode.
      if (
        url.pathname.startsWith("/products/barcode/") &&
        request.method === "GET"
      ) {
        const barcode = url.pathname.slice(
          "/products/barcode/".length
        );

        if (!barcode || !/^\d+$/.test(barcode)) {
          return jsonResponse(
            { error: "Invalid barcode" },
            400
          );
        }

        const [product] = await sql`
          SELECT id, name, barcode, img, price, weight
          FROM products
          WHERE barcode = ${barcode}
          LIMIT 1
        `;

        if (!product) {
          return jsonResponse(
            { error: "Product not found" },
            404
          );
        }

        return jsonResponse(product);
      }

      // Add a product.
      if (url.pathname === "/products" && request.method === "POST") {
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
          return jsonResponse(
            { error: "Invalid product data" },
            400
          );
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
          return jsonResponse(
            { error: "Invalid product ID" },
            400
          );
        }

        const [product] = await sql`
          DELETE FROM products
          WHERE id = ${id}
          RETURNING id, name
        `;

        if (!product) {
          return jsonResponse(
            { error: "Product not found" },
            404
          );
        }

        return jsonResponse({
          message: "Product deleted successfully",
          product
        });
      }

      return jsonResponse(
        { error: "Route not found" },
        404
      );

    } catch (error) {
      console.error("Request failed:", error.message);

      return jsonResponse(
        { error: "Request failed. Check Cloudflare logs." },
        500
      );

    } finally {
      await sql.end();
    }
  }
};
