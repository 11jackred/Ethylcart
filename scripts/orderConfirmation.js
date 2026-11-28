
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

    // Generate customer payment verification QR.
    if (checkout.qrToken) {

        const qrContainer = document.querySelector("#paymentQR");

        if (qrContainer) {
            qrContainer.innerHTML = "";

            const script = document.createElement("script");

            script.src =
                "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";

            script.onload = () => {
                new QRCode(qrContainer, {
                    text: JSON.stringify({
                        orderId: checkout.id,
                        token: checkout.qrToken
                    }),
                    width: 220,
                    height: 220,
                    correctLevel: QRCode.CorrectLevel.H
                });
            };

            script.onerror = () => {
                qrContainer.textContent =
                    "Could not load QR code. Please contact store staff.";
            };

            document.head.appendChild(script);

        }

    } else {
        console.error("QR verification token is missing.");
    }
}
