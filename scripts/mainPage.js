
// UUID of the BLE service running on the ESP32.
const SERVICE_UUID = "12345678-1234-1234-1234-123456789000";

// UUID of the barcode characteristic.
const CHARACTERISTIC_UUID = "12345678-1234-1234-1234-123456789001";

// Cloudflare Worker backend URL.
const BACKEND_URL = "https://ethylcart-backend.jack11cards.workers.dev";


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


            // Listen for incoming barcode notifications from the ESP32.
barcodeCharacteristic.addEventListener(
    "characteristicvaluechanged",
    (event) => {
        // Convert the received BLE data into readable text.
        const barcode = new TextDecoder().decode(event.target.value);

        console.log("Barcode received:", barcode);

// Look up the scanned product in Neon.
findProduct(barcode);

// Send the received barcode to the main page.
window.parent.postMessage(
    { type: "BARCODE_RECEIVED", barcode: barcode },
    "*"
);
    }
);

// Subscribe to notifications from the ESP32.
await barcodeCharacteristic.startNotifications();

console.log("Listening for barcode notifications...");


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



// Find a product using its scanned barcode.
async function findProduct(barcode) {

    try {
        const response = await fetch(
            `${BACKEND_URL}/products/barcode/${encodeURIComponent(barcode)}`
        );

        if (!response.ok) {
            throw new Error("Product not found");
        }

        const product = await response.json();

        // Send product information to item.html.
     cartFrame.contentWindow.postMessage(
    {
        type: "PRODUCT_FOUND",
        product: product
    },
    "*"
);

    } catch (error) {

        // Display errors on the website.
        window.parent.postMessage(
            {
                type: "PRODUCT_ERROR",
                message: error.message
            },
            "*"
        );
    }
}



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
