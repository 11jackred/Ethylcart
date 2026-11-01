export function delete1(i) {
    const container = document.querySelector(`.item-container-${i}`);

    if (container) {
        container.remove();
    }
}

export function updateProduct(i) {

    const quantityElement = document.querySelector(
        `.js-product-quantity-${i}`
    );

    const input = document.querySelector(
        `.js-input-quantity-${i}`
    );

    const updateSpan = document.querySelector(
        `.js-update-quantity-span-${i}`
    );

    if (!quantityElement || !input || !updateSpan) return;

    if (updateSpan.innerText === "Update") {
        input.style.display = "inline-block";
        input.value = quantityElement.dataset.quantity;
        updateSpan.innerText = "Save";
    } else {
        const newQuantity = Number(input.value);

        if (!Number.isInteger(newQuantity) || newQuantity < 0) {
            alert("Enter a valid quantity.");
            return;
        }

        if (newQuantity === 0) {
            delete1(i);
            return;
        }

        quantityElement.dataset.quantity = newQuantity;
        quantityElement.textContent = `Product quantity: ${newQuantity}`;

        input.style.display = "none";
        updateSpan.innerText = "Update";
    }
}