
// Retrieve the saved cart
const productsInCart = JSON.parse(
    localStorage.getItem("ethylcart") || "[]"
);

// Calculate totals
let totalItems = 0;
let totalPrice = 0;

// Calculate cart totals
productsInCart.forEach(product => {

    const quantity = Number(product.quantity);

    const price = Number(
        String(product.price).replace(/[^0-9.-]/g, '')
    );

    totalItems += quantity;
    totalPrice += price * quantity;

});

// Display final totals
document.querySelector("#checkoutTotalItems").textContent =
    `Total items: ${totalItems}`;

document.querySelector("#checkoutTotalPrice").textContent =
    `Total: ₹${totalPrice.toFixed(2)}`;

// Confirmation button
document.querySelector("#confirmOrder").addEventListener("click", () => {

    if (productsInCart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    alert("Order summary confirmed!");

});
