
const API_URL =
    "https://ethylcart-backend.jack11cards.workers.dev";

const loginForm = document.querySelector("#adminLogin");
const passwordInput = document.querySelector("#adminPassword");
const loginMessage = document.querySelector("#loginMessage");
const dashboard = document.querySelector("#dashboard");
const ordersContainer = document.querySelector("#ordersContainer");

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const password = passwordInput.value;

    loginMessage.textContent = "Checking password...";

    try {

        const response = await fetch(`${API_URL}/orders`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${password}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Login failed");
        }

        loginForm.hidden = true;
        dashboard.hidden = false;

        displayOrders(result.orders);

    } catch (error) {

        console.error(error);
        loginMessage.textContent = "Incorrect password or server error.";

    }

});

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
        date.textContent = new Date(order.created_at).toLocaleString();

        const total = document.createElement("p");
        total.textContent = `Total: ₹${Number(order.total_price).toFixed(2)}`;

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
    option.textContent = value.charAt(0).toUpperCase() + value.slice(1);

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


        // Listen for changes to the order status.
status.addEventListener("change", async () => {

    try {

        // Send the new status to the backend.
        const response = await fetch(`${API_URL}/orders/${order.id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${passwordInput.value}`
            },
            body: JSON.stringify({
                status: status.value
            })
        });

        const result = await response.json();

        // Show an error if the backend rejects the update.
        if (!response.ok) {
            throw new Error(result.error || "Status update failed");
        }

        // Confirm that the status was updated.
        alert(`Order #${order.id} status updated!`);

    } catch (error) {

        // Display the error and restore the previous status.
        console.error(error);
        alert("Could not update order status.");

        status.value = order.status;
    }

});




        orderCard.append(
            heading,
            date,
            total,
            status,
            products
        );

        ordersContainer.appendChild(orderCard);

    });

}
