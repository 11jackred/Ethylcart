
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


// Pay Now button — simulated payment
document.querySelector("#confirmOrder").addEventListener("click", async () => {

    if (productsInCart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    // Simulate the customer's payment confirmation.
    const paymentSuccessful = confirm(
        "ETHYLCART TEST PAYMENT\n\n" +
        "This is a simulated payment. No real money will be charged.\n\n" +
        "Click OK to simulate successful payment."
    );

    if (!paymentSuccessful) {
        alert("Payment cancelled.");
        return;
    }

    const button = document.querySelector("#confirmOrder");

    button.disabled = true;
    button.textContent = "Processing...";

    try {

        // Create the order after simulated payment success.
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

        // Clear cart after successful order creation.
        localStorage.removeItem("ethylcart");

        alert(
            `Test payment successful!\nOrder ID: ${result.order.id}\n\nNo real money was charged.`
        );

        window.location.href = "item.html";

    } catch (error) {

        console.error(error);
        alert("Could not process your order: " + error.message);

    } finally {

        button.disabled = false;
        button.textContent = "Pay Now";

    }

});

