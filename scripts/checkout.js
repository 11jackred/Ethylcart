
// Retrieve the saved cart
const productsInCart = JSON.parse(
    localStorage.getItem("ethylcart") || "[]"
);

const checkoutItems = document.querySelector("#checkoutItems");

// Calculate totals
let totalItems = 0;
let totalPrice = 0;

// Display products
productsInCart.forEach(product => {

    const quantity = Number(product.quantity);

    const price = Number(
        String(product.price).replace(/[^0-9.-]/g, '')
    );

    totalItems += quantity;
    totalPrice += price * quantity;

    const html = `
        <div class="css-item-container">

            <img class="product-image"
                 src="${product.img}"
                 alt="${product.name}">

            <div class="product-info">

                <div class="product-name">
                    ${product.name}
                </div>

                <div>
                    Price: ₹${price.toFixed(2)}
                </div>

                <div>
                    Quantity: ${quantity}
                </div>

                <div>
                    Subtotal: ₹${(price * quantity).toFixed(2)}
                </div>

            </div>

        </div>
    `;

    checkoutItems.insertAdjacentHTML("beforeend", html);
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
