
// Retrieve the saved cart
const productsInCart = JSON.parse(
    localStorage.getItem("ethylcart") || "[]"
);

// Calculate totals
let totalItems = 0;
let totalPrice = 0;

// Calculate cart totals
productsInCart.forEach(product => {

    const quantity = Number(product.quantity);

    const price = Number(
        String(product.price).replace(/[^0-9.-]/g, '')
    );

    totalItems += quantity;
    totalPrice += price * quantity;

});

// Display final totals
document.querySelector("#checkoutTotalItems").textContent =
    `Total items: ${totalItems}`;

document.querySelector("#checkoutTotalPrice").textContent =
    `Total: ₹${totalPrice.toFixed(2)}`;


// Confirmation button
document.querySelector("#confirmOrder").addEventListener("click", async () => {

    if (productsInCart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const button = document.querySelector("#confirmOrder");

    button.disabled = true;
    button.textContent = "Processing...";

    try {

        const response = await fetch(
            "https://ethylcart-backend.jack11cards.workers.dev/orders",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    items: productsInCart.map(product => ({
                        productId: Number(product.id),
                        quantity: Number(product.quantity)
                    }))
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Order failed");
        }

        alert(
            `Order confirmed! Your order ID is ${result.order.id}`
        );

    } catch (error) {

        console.error(error);
        alert("Could not process your order: " + error.message);

    } finally {

        button.disabled = false;
        button.textContent = "Confirm Order";

    }

});
