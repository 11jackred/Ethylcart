
const checkout = JSON.parse(
    sessionStorage.getItem("ethylcartCheckout") || "null"
);

if (!checkout) {
    document.querySelector(".checkout-summary").innerHTML =
        "<h1>Checkout information unavailable</h1><p>Please contact store staff.</p>";
} else {

    document.querySelector("#sessionId").textContent =
        `Checkout ID: ${checkout.id}`;

    document.querySelector("#confirmationTotal").textContent =
        `Total: ₹${Number(checkout.total).toFixed(2)}`;

    document.querySelector("#confirmationPayment").textContent =
        "Payment method: Pay Offline";

    document.querySelector("#confirmationStatus").textContent =
        "Payment status: Pending";

    const itemsContainer =
        document.querySelector("#confirmationItems");

    checkout.items.forEach(item => {

        const product = document.createElement("p");

        product.textContent =
            `${item.name} × ${item.quantity}`;

        itemsContainer.appendChild(product);

    });
}
