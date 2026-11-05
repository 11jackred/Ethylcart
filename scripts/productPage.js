
import { delete1, updateProduct } from './productFunctions.js';

const itemList = document.querySelector('.item-list-container');

let productsInCart = [];
let nextId = 1;

// Update the cart summary
function updateCartSummary() {

    const totalItemsElement = document.querySelector('#totalItems');
    const totalPriceElement = document.querySelector('#totalPrice');

    const totalItems = productsInCart.reduce(
        (total, product) => total + product.quantity, 0
    );

    const totalPrice = productsInCart.reduce(
        (total, product) => {
            const price = Number(
                String(product.price).replace(/[^0-9.-]/g, '')
            );

            return total + price * product.quantity;
        },
        0
    );

    totalItemsElement.textContent = `Total items: ${totalItems}`;

    totalPriceElement.textContent =
        `Total price: ₹${totalPrice.toFixed(2)}`;
}

window.updateProductQuantityInCart = function(id, quantity) {

    const product = productsInCart.find(
        item => item.cartId === Number(id)
    );

    if (product) {
        product.quantity = quantity;
    }

    updateCartSummary();
};




// Make summary updater available to productFunctions.js
window.updateCartSummary = updateCartSummary;

// Delete product from cart
function removeFromCart(id) {

    const index = productsInCart.findIndex(
        product => product.cartId === Number(id)
    );

    if (index !== -1) {
        productsInCart.splice(index, 1);
    }

    delete1(id);
    updateCartSummary();
}

window.delete1 = removeFromCart;
window.updateProduct = updateProduct;

// Receive products from mainPage.js
window.addEventListener("message", (event) => {

    if (event.data.type === "PRODUCT_FOUND") {
        addScannedProduct(event.data.product);
    }

});

// Add scanned product to cart
function addScannedProduct(product) {

    const existingProduct = productsInCart.find(
        item => item.barcode === product.barcode
    );

    if (existingProduct) {

        existingProduct.quantity++;

        const quantityElement = document.querySelector(
            `.js-product-quantity-${existingProduct.cartId}`
        );

        quantityElement.dataset.quantity = existingProduct.quantity;

        quantityElement.textContent =
            `Product quantity: ${existingProduct.quantity}`;

        updateCartSummary();
        return;
    }

    // First scan of this product
    product.quantity = 1;
    product.cartId = nextId++;

    productsInCart.push(product);

    displayProduct(product);
    updateCartSummary();


}

// Display product
function displayProduct(product) {

    const id = product.cartId;

    const html = `
        <div class="item-container-${id}">
            <div class="item-container css-item-container">

                <img class="product-image"
                     src="${product.img}"
                     alt="${product.name}">

                <div class="product-info">

                    <div class="product-name">
                        Product name: ${product.name}
                    </div>

                    <div class="product-price">
                        Product price: ${product.price}
                    </div>

                    <div class="product-weight">
                        Product weight: ${product.weight}
                    </div>

                    <div class="product-quantity js-product-quantity-${id}"
                         data-quantity="${product.quantity}">
                        Product quantity: ${product.quantity}
                    </div>

                    <input
                        class="js-input-quantity-${id}"
                        type="number"
                        min="0"
                        style="display:none;"
                    >

                </div>

                <div class="buttons-container">

                    <span onclick="delete1(${id})"
                          class="js-delete-button-${id} css-delete-button">
                        Delete
                    </span>

                    <span onclick="updateProduct(${id})"
                          class="js-update-quantity-span-${id}">
                        Update
                    </span>

                </div>

            </div>
        </div>
    `;

    itemList.insertAdjacentHTML("beforeend", html);
}
