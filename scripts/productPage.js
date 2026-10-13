import {getProduct,products} from '../data/products.js';
import {delete1,updateProduct} from './productFunctions.js';
const addButton=document.querySelector('.js-add-button')
const itemList=document.querySelector('.item-list-container')


window.delete1 = delete1;
window.updateProduct = updateProduct;

let i=1;

addButton.addEventListener('click',()=>{
const product=getProduct(i,products);
  

let html;

html=
`
 <div class="item-container-${i}">

<div class="item-container css-item-container">
  
<img class="product-image" src="images/umbrella.jpg">


<div class="product-info">
  
  <div class="product-name">Product name:${product.name}</div>
  
   <div class="product-price">Product price:${product.price}</div>
    
   <div class="product-quantity js-product-quantity-${i}">Product-quantity:${product.quantity}
   
   <div class="product-quantity-input-${i} beInvis"><input class="input-quantity js-input-quantity-${i}" type="text"></div>
   
   </div>


</div>



<div class="buttons-container">

<div> <span onclick="delete1(${i})"  class="js-delete-button-${i} css-delete-button">

  <img class="delete-image" src="images/trash-can-icon.jpg">

</span>
</div>
<div><span onclick="updateProduct(${i})" class="js-update-quantity-span-${i}">Update</span></div>

</div>

</div>

  </div>


`;

  itemList.innerHTML+=html
i++;

  
})
