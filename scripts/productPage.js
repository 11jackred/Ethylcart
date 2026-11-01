import { delete1, updateProduct } from './productFunctions.js';

const itemList = document.querySelector('.item-list-container');

window.delete1 = delete1;
window.updateProduct = updateProduct;

let productsInCart = [];
let nextId = 1;

// Receive products from mainPage.js
window.addEventListener("message", (event) => {

    if (event.data.type === "PRODUCT_FOUND") {
        addScannedProduct(event.data.product);
    }

});

// Add scanned product to cart
function addScannedProduct(product) {

    // Check whether product already exists
    const existingProduct = productsInCart.find(
        item => item.barcode === product.barcode
    );

    if (existingProduct) {

        existingProduct.quantity++;

        const quantityElement = document.querySelector(
            `.js-product-quantity-${existingProduct.cartId}`
        );

        quantityElement.textContent =
            `Product quantity: ${existingProduct.quantity}`;

        return;
    }

    // First scan of this product
    product.quantity = 1;
    product.cartId = nextId++;

    productsInCart.push(product);

    displayProduct(product);
}

// Display product
function displayProduct(product) {

    const id = product.cartId;

    const html = `
        <div class="item-container-${id}">
            <div class="item-container css-item-container">

                <img class="product-image" src="${product.img}" alt="${product.name}">

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

                    <div class="product-quantity js-product-quantity-${id}">
                        Product quantity: ${product.quantity}
                    </div>

                </div>

                <div class="buttons-container">
                    <span onclick="delete1(${id})"
                        class="css-delete-button">
                        Delete
                    </span>

                    <span onclick="updateProduct(${id})">
                        Update
                    </span>
                </div>

            </div>
        </div>
    `;

    itemList.innerHTML += html;
}