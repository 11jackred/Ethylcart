
// UUID of the BLE service running on the ESP32
const SERVICE_UUID = "12345678-1234-1234-1234-123456789000";

// Get the Connect button
const connectButton = document.querySelector(".js-connectCart");

// Run this when the customer clicks Connect
connectButton.addEventListener("click", async (event) => {

    // Stop the link from immediately opening item.html
    event.preventDefault();

    try {
        // Ask the customer to select the ESP32
        const device = await navigator.bluetooth.requestDevice({
            filters: [
                { services: [SERVICE_UUID] }
            ]
        });

        console.log("Selected cart:", device.name);

        // Connect to the ESP32
        const server = await device.gatt.connect();

        console.log("Connected to cart!");

        // Open item.html after successful connection
        window.location.href = "item.html";

    } catch (error) {
        console.error("Bluetooth connection failed:", error);
        alert("Could not connect to cart: " + error.message);
    }
});



