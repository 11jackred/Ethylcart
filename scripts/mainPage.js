
// UUID of the BLE service running on the ESP32.
const SERVICE_UUID = "12345678-1234-1234-1234-123456789000";

// UUID of the barcode characteristic.
const CHARACTERISTIC_UUID = "12345678-1234-1234-1234-123456789001";

// Get the HTML elements.
const connectButton = document.querySelector(".js-connectCart");
const connectionStatus = document.querySelector("#connectionStatus");
const connectionPage = document.querySelector("#connectionPage");
const cartFrame = document.querySelector("#cartFrame");

// Keep references to the Bluetooth connection.
let cartDevice;
let cartServer;
let barcodeCharacteristic;

// Run when the customer clicks Connect Cart.
connectButton.addEventListener("click", async () => {

    try {
        connectionStatus.textContent = "Searching for cart...";

        // Ask the customer to select the ESP32.
        cartDevice = await navigator.bluetooth.requestDevice({
            filters: [
                { services: [SERVICE_UUID] }
            ]
        });

        connectionStatus.textContent = "Connecting...";

        // Connect to the selected ESP32.
        cartServer = await cartDevice.gatt.connect();
        // Listen for unexpected Bluetooth disconnections.
setupDisconnectionListener();
        // Find the BLE service.
        const service = await cartServer.getPrimaryService(SERVICE_UUID);

        // Find the barcode characteristic.
        barcodeCharacteristic =
            await service.getCharacteristic(CHARACTERISTIC_UUID);

        console.log("Connected to Ethylcart cart!");

        // Show the cart page without leaving index.html.
        connectionPage.style.display = "none";
        cartFrame.style.display = "block";

    } catch (error) {

        console.error("Bluetooth connection failed:", error);

        connectionStatus.textContent = "Connection failed. Try again.";

        alert("Could not connect to cart: " + error.message);
    }
});

// Detect if the ESP32 disconnects.
function handleDisconnection() {
    console.log("Cart disconnected!");
    connectionPage.style.display = "block";
    cartFrame.style.display = "none";
    connectionStatus.textContent = "Cart disconnected. Please reconnect.";
}

// Listen for disconnection events.
function setupDisconnectionListener() {
    if (cartDevice) {
        cartDevice.addEventListener(
            "gattserverdisconnected",
            handleDisconnection
        );
    }
}
