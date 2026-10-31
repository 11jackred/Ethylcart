
import postgres from "postgres";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return Response.json({
        message: "Ethylcart backend is running!"
      });
    }

    const sql = postgres(env.HYPERDRIVE.connectionString, {
      max: 5,
      fetch_types: false
    });

    try {
     
      // Find one product by barcode
      if (
        url.pathname.startsWith("/products/barcode/") &&
        request.method === "GET"
      ) {
        const barcode = url.pathname.slice(
          "/products/barcode/".length
        );

        if (!barcode || !/^\d+$/.test(barcode)) {
          return Response.json(
            { error: "Invalid barcode" },
            { status: 400 }
          );
        }

        const [product] = await sql`
          SELECT id, name, barcode, img, price, weight
          FROM products
          WHERE barcode = ${barcode}
          LIMIT 1
        `;

        if (!product) {
          return Response.json(
            { error: "Product not found" },
            { status: 404 }
          );
        }

        return Response.json(product);
      }

      // Add a product
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
          return Response.json(
            { error: "Invalid product data" },
            { status: 400 }
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

        return Response.json(product, { status: 201 });
      }

      // Delete a product by ID
      if (
        url.pathname.startsWith("/products/") &&
        request.method === "DELETE"
      ) {
        const id = url.pathname.split("/")[2];

        if (!/^\d+$/.test(id)) {
          return Response.json(
            { error: "Invalid product ID" },
            { status: 400 }
          );
        }

        const [product] = await sql`
          DELETE FROM products
          WHERE id = ${id}
          RETURNING id, name
        `;

        if (!product) {
          return Response.json(
            { error: "Product not found" },
            { status: 404 }
          );
        }

        return Response.json({
          message: "Product deleted successfully",
          product
        });
      }

      return Response.json({ error: "Route not found" }, { status: 404 });
    } catch (error) {
      console.error("Request failed:", error.message);
      return Response.json(
        { error: "Request failed. Check Cloudflare logs." },
        { status: 500 }
      );
    } finally {
      await sql.end();
    }
  }
};
