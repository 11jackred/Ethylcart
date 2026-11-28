
const API_URL =
    "https://ethylcart-backend.jack11cards.workers.dev";

const loginForm = document.querySelector("#adminLogin");
const passwordInput = document.querySelector("#adminPassword");
const loginMessage = document.querySelector("#loginMessage");
const dashboard = document.querySelector("#dashboard");
const ordersContainer = document.querySelector("#ordersContainer");

const refreshButton = document.querySelector("#refreshOrders");
const logoutButton = document.querySelector("#logoutButton");

const startScannerButton = document.querySelector("#startScanner");
const scannerMessage = document.querySelector("#scannerMessage");
const scannedOrderSection = document.querySelector("#scannedOrder");
const confirmPaymentButton = document.querySelector("#confirmPayment");

let latestOrders = [];
let currentScannedOrder = null;
let html5QrCode = null;
let scannerRunning = false;


// Admin login.
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    loginMessage.textContent = "Checking password...";

    await loadOrders(passwordInput.value, true);
});


// Refresh orders.
refreshButton.addEventListener("click", async () => {
    await loadOrders(passwordInput.value, false);
});


// Load orders from backend.
async function loadOrders(password, isLogin) {

    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${password}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Request failed");
        }

        if (isLogin) {
            loginForm.hidden = true;
            dashboard.hidden = false;
        }

        latestOrders = result.orders;

        displayOrders(latestOrders);

    } catch (error) {
        console.error(error);

        if (isLogin) {
            loginMessage.textContent =
                "Incorrect password or server error.";
        } else {
            alert("Could not refresh orders.");
        }
    }
}


// Display orders.
function displayOrders(orders) {

    const totalOrders = orders.length;

    const totalRevenue = orders.reduce(
        (total, order) => total + Number(order.total_price),
        0
    );

    document.querySelector("#totalOrders").textContent =
        totalOrders;

    document.querySelector("#totalRevenue").textContent =
        `₹${totalRevenue.toFixed(2)}`;

    if (orders.length === 0) {
        ordersContainer.textContent = "No orders found.";
        return;
    }

    ordersContainer.innerHTML = "";

    orders.forEach(order => {

        const orderCard = document.createElement("div");
        orderCard.className = "summary-card";

        const heading = document.createElement("h3");
        heading.textContent = `Order #${order.id}`;

        const date = document.createElement("p");
        date.textContent =
            new Date(order.created_at).toLocaleString();

        const total = document.createElement("p");
        total.textContent =
            `Total: ₹${Number(order.total_price).toFixed(2)}`;

        const paymentStatus = document.createElement("p");
        paymentStatus.textContent =
            `Payment: ${order.payment_status || "Unknown"}`;

        const status = document.createElement("select");

        const statuses = [
            "confirmed",
            "processing",
            "completed",
            "cancelled"
        ];

        statuses.forEach(value => {
            const option = document.createElement("option");

            option.value = value;
            option.textContent =
                value.charAt(0).toUpperCase() + value.slice(1);

            if (value === order.status) {
                option.selected = true;
            }

            status.appendChild(option);
        });

        const products = document.createElement("div");

        (order.items || []).forEach(item => {
            const product = document.createElement("p");

            product.textContent =
                `${item.productName} × ${item.quantity}`;

            products.appendChild(product);
        });

        // Update normal order status.
        status.addEventListener("change", async () => {

            try {
                const response = await fetch(
                    `${API_URL}/orders/${order.id}`,
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization":
                                `Bearer ${passwordInput.value}`
                        },
                        body: JSON.stringify({
                            status: status.value
                        })
                    }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.error || "Status update failed"
                    );
                }

                alert(`Order #${order.id} status updated!`);

                order.status = status.value;

            } catch (error) {
                console.error(error);
                alert("Could not update order status.");
                status.value = order.status;
            }
        });

        orderCard.append(
            heading,
            date,
            total,
            paymentStatus,
            status,
            products
        );

        ordersContainer.appendChild(orderCard);
    });
}


// Start QR scanner.
startScannerButton.addEventListener("click", async () => {

    if (scannerRunning) return;

    try {
        if (!html5QrCode) {
            html5QrCode = new Html5Qrcode("qrReader");
        }

        scannerMessage.textContent = "Starting camera...";

        await html5QrCode.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: { width: 250, height: 250 }
            },
            handleQRScan,
            () => {}
        );

        scannerRunning = true;
        startScannerButton.disabled = true;

        scannerMessage.textContent =
            "Camera ready. Scan the customer's QR code.";

    } catch (error) {
        console.error(error);

        scannerMessage.textContent =
            "Could not access camera. Check camera permission and HTTPS.";
    }
});


// Handle scanned QR code.
async function handleQRScan(decodedText) {

    if (currentScannedOrder) return;

    let qrData;

    try {
        qrData = JSON.parse(decodedText);
    } catch {
        scannerMessage.textContent =
            "Invalid QR code. Please scan an EthylCart checkout QR.";
        return;
    }

    if (
        !qrData.orderId ||
        typeof qrData.token !== "string" ||
        !qrData.token
    ) {
        scannerMessage.textContent =
            "Invalid EthylCart QR code.";
        return;
    }

    const order = latestOrders.find(
        item => String(item.id) === String(qrData.orderId)
    );

    await stopScanner();

    if (!order) {
        scannerMessage.textContent =
            "Order not found. Refresh orders and scan again.";
        return;
    }

    if (order.payment_status !== "pending") {
        scannerMessage.textContent =
            `Order #${order.id} is already ${order.payment_status}.`;
        return;
    }

    currentScannedOrder = {
        id: order.id,
        total: order.total_price,
        token: qrData.token
    };

    document.querySelector("#scannedOrderId").textContent =
        `Checkout ID: ${order.id}`;

    document.querySelector("#scannedOrderTotal").textContent =
        `Total: ₹${Number(order.total_price).toFixed(2)}`;

    document.querySelector("#scannedPaymentStatus").textContent =
        "Payment status: Pending";

    scannedOrderSection.hidden = false;

    scannerMessage.textContent =
        "QR verified. Check the amount and confirm only after receiving payment.";
}


// Confirm that payment was actually received.
confirmPaymentButton.addEventListener("click", async () => {

    if (!currentScannedOrder) return;

    const confirmed = window.confirm(
        `Have you received ₹${Number(currentScannedOrder.total).toFixed(2)} for checkout #${currentScannedOrder.id}?`
    );

    if (!confirmed) return;

    confirmPaymentButton.disabled = true;
    confirmPaymentButton.textContent = "Verifying...";

    try {
        const response = await fetch(
            `${API_URL}/orders/${currentScannedOrder.id}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization":
                        `Bearer ${passwordInput.value}`
                },
                body: JSON.stringify({
                    paymentStatus: "paid",
                    verificationToken: currentScannedOrder.token
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error || "Payment verification failed"
            );
        }

       scannerMessage.textContent =
    `Payment successfully verified for checkout #${currentScannedOrder.id}.`;

const paidOrderId = currentScannedOrder.id;

const order = latestOrders.find(
    item => String(item.id) === String(paidOrderId)
);

if (order) {
    order.payment_status = "paid";
}

displayOrders(latestOrders);

scannedOrderSection.hidden = true;
currentScannedOrder = null;

    } catch (error) {
        console.error(error);

        scannerMessage.textContent =
            error.message || "Could not verify payment.";

    } finally {
        confirmPaymentButton.disabled = false;
        confirmPaymentButton.textContent =
            "Confirm Payment Received";
    }
});


// Stop camera.
async function stopScanner() {

    if (html5QrCode && scannerRunning) {
        try {
            await html5QrCode.stop();
            scannerRunning = false;
            startScannerButton.disabled = false;
        } catch (error) {
            console.error("Could not stop scanner:", error);
        }
    }
}


// Admin logout.
logoutButton.addEventListener("click", async () => {

    await stopScanner();

    dashboard.hidden = true;
    loginForm.hidden = false;

    passwordInput.value = "";
    loginMessage.textContent = "";

    latestOrders = [];
    currentScannedOrder = null;
    scannedOrderSection.hidden = true;
    scannerMessage.textContent = "Scan a customer's checkout QR code.";
});
