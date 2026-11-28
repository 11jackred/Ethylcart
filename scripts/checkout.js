
// Retrieve the saved cart
const productsInCart = JSON.parse(
    localStorage.getItem("ethylcart") || "[]"
);

// Calculate cart totals
let totalItems = 0;
let totalPrice = 0;

productsInCart.forEach(product => {
    const quantity = Number(product.quantity);

    const price = Number(
        String(product.price).replace(/[^0-9.-]/g, "")
    );

    totalItems += quantity;
    totalPrice += price * quantity;
});

// Display final totals
document.querySelector("#checkoutTotalItems").textContent =
    `Total items: ${totalItems}`;

document.querySelector("#checkoutTotalPrice").textContent =
    `Total: ₹${totalPrice.toFixed(2)}`;


// Place order
document.querySelector("#confirmOrder").addEventListener("click", async () => {

    if (productsInCart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    // Read selected payment method
    const selectedPayment = document.querySelector(
        'input[name="paymentMethod"]:checked'
    );

    if (!selectedPayment) {
        alert("Please select a payment method.");
        return;
    }

    const paymentMethod = selectedPayment.value;

    const button = document.querySelector("#confirmOrder");

    button.disabled = true;
    button.textContent = "Placing order...";

    try {
        const response = await fetch(
            "https://ethylcart-backend.jack11cards.workers.dev/orders",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    paymentMethod: paymentMethod,

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

      
      
        // Save checkout information for confirmation page
        sessionStorage.setItem(
            "ethylcartCheckout",
            JSON.stringify({
                id: result.order.id,
                total: result.order.total_price,
                qrToken: result.order.qrToken,
                items: productsInCart.map(product => ({
                    name: product.name,
                    quantity: Number(product.quantity)
                }))
            })
        );


        // Clear cart after successful checkout recording
        localStorage.removeItem("ethylcart");

        // Open confirmation page
        window.location.href = "order-confirmation.html";


    } catch (error) {
        console.error(error);
        alert("Could not place your order: " + error.message);

    } finally {
        button.disabled = false;
        button.textContent = "Place Order";
    }

});
