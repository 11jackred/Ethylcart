
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
const refreshStatus = document.querySelector("#refreshStatus");


refreshButton.addEventListener("click", async () => {
    refreshButton.disabled = true;
    refreshStatus.textContent = "⏳ Refreshing...";
    refreshStatus.style.color = "#64748b";

    try {
        const success = await loadOrders(
            passwordInput.value,
            false
        );

        refreshStatus.textContent =
            success ? "✓ Updated!" : "✕ Failed!";

        refreshStatus.style.color =
            success ? "#16a34a" : "#dc2626";

    } finally {
        refreshButton.disabled = false;

        setTimeout(() => {
            refreshStatus.textContent = "";
        }, 3000);
    }
});


// Load orders from backend.
async function loadOrders(password, isLogin) {
    try {
        const response = await fetch(
            `${API_URL}/orders?t=${Date.now()}`,
            {
                method: "GET",
                cache: "no-store",
                headers: {
                    "Authorization": `Bearer ${password}`,
                    "Cache-Control": "no-cache"
                }
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Request failed");
        }

        if (!Array.isArray(result.orders)) {
            throw new Error("Invalid orders response");
        }

        latestOrders = result.orders;
        displayOrders(latestOrders);

        if (isLogin) {
            loginForm.hidden = true;
            dashboard.hidden = false;
        }

        return true;

    } catch (error) {
        console.error("Order refresh failed:", error);

        if (isLogin) {
            loginMessage.textContent =
                "Incorrect password or server error.";
        } else {
            console.error("Could not refresh orders.");
        }

        return false;
    }
}

// Display orders.

function displayOrders(orders) {
    const totalOrders = orders.length;

    const totalRevenue = orders.reduce(
        (total, order) => total + Number(order.total_price),
        0
    );

    document.querySelector("#totalOrders").textContent = totalOrders;
    document.querySelector("#totalRevenue").textContent =
        `₹${totalRevenue.toFixed(2)}`;

    if (orders.length === 0) {
        ordersContainer.textContent = "No orders found.";
        return;
    }

    ordersContainer.innerHTML = "";

    orders.forEach(order => {
        const orderCard = document.createElement("div");
        orderCard.className = "order-card";

        const heading = document.createElement("h3");
        heading.className = "order-title";
        heading.textContent = `Checkout #${order.id}`;

        const date = document.createElement("p");
        date.className = "order-date";
        date.textContent = new Date(order.created_at).toLocaleString();

        const total = document.createElement("p");
        total.className = "order-total";
        total.textContent =
            `Total: ₹${Number(order.total_price).toFixed(2)}`;

        const paymentStatus = document.createElement("span");
        const payment = (order.payment_status || "unknown").toLowerCase();

        paymentStatus.className = `status-badge payment-${payment}`;
        paymentStatus.textContent = `Payment: ${payment.toUpperCase()}`;

        const orderStatus = document.createElement("span");
        const status = (order.status || "unknown").toLowerCase();

        orderStatus.className = `status-badge order-${status}`;
        orderStatus.textContent = `Checkout: ${status.toUpperCase()}`;

        const products = document.createElement("div");
        products.className = "order-products";

        const productsHeading = document.createElement("h4");
        productsHeading.textContent = "Items";

        products.appendChild(productsHeading);

        (order.items || []).forEach(item => {
            const product = document.createElement("p");
            product.textContent =
                `${item.productName} × ${item.quantity}`;

            products.appendChild(product);
        });

        const statusContainer = document.createElement("div");
        statusContainer.className = "status-container";
        statusContainer.append(paymentStatus, orderStatus);

        orderCard.append(
            heading,
            date,
            total,
            statusContainer,
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
setInterval(() => {
    if (!dashboard.hidden) {
        loadOrders(passwordInput.value, false);
    }
}, 5000);