
const API_URL =
    "https://ethylcart-backend.jack11cards.workers.dev";

const checkout = JSON.parse(
    sessionStorage.getItem("ethylcartCheckout") || "null"
);

const statusElement =
    document.querySelector("#confirmationStatus");

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

    statusElement.textContent = "Payment status: Pending";

    const itemsContainer =
        document.querySelector("#confirmationItems");

    checkout.items.forEach(item => {
        const product = document.createElement("p");

        product.textContent =
            `${item.name} × ${item.quantity}`;

        itemsContainer.appendChild(product);
    });

    // Generate customer payment QR.
    if (checkout.qrToken) {

        const qrContainer =
            document.querySelector("#paymentQR");

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

    // Automatically check payment status.
    let paymentCheckInterval = null;

    async function checkPaymentStatus() {
        try {
            const response = await fetch(
                `${API_URL}/orders/payment-status`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        orderId: checkout.id,
                        verificationToken: checkout.qrToken
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error || "Payment status check failed"
                );
            }

            if (result.paymentStatus === "paid") {
                statusElement.textContent =
                    "Payment Successful";

                if (paymentCheckInterval) {
                    clearInterval(paymentCheckInterval);
                    paymentCheckInterval = null;
                }

                const qrSection =
                    document.querySelector(".payment-qr-section");

                if (qrSection) {
                    qrSection.hidden = true;
                }
            }

        } catch (error) {
            console.error("Payment status check failed:", error);
        }
    }

    if (checkout.qrToken) {
        checkPaymentStatus();

        paymentCheckInterval = setInterval(
            checkPaymentStatus,
            1000
        );
    }
}
