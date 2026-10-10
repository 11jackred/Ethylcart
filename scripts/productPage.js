const addButton=document.querySelector('.js-add-button')
const itemList=document.querySelector('.item-list-container')



let i=1;
let quantity=1;
addButton.addEventListener('click',()=>{

  

let html;

html=
`
 <div class="item-container-${i}">

<div class="item-container css-item-container">
  
<img class="product-image" src="images/umbrella.jpg">


<div class="product-info">
  
  <div class="product-name">product-name</div>
  
   <div class="product-price">product-price</div>
    
   <div class="product-quantity js-product-quantity-${i}">Product-quantity:1
   
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

function delete1(i){
  
 const container0= document.querySelector(`.item-container-${i}`);

container0.remove();

}

function updateProduct(i){
  
  const input=
  document.querySelector(`.product-quantity-input-${i}`); 

  const inputReal= document.querySelector(`.js-input-quantity-${i}`); 

  const updateSpan=document.querySelector(`.js-update-quantity-span-${i}`); 


  if( input.classList.contains('beInvis')
){

  updateSpan.innerText='Save'

  input.classList.remove('beInvis')
 
}

else{ 

  



  if(inputReal.value){ 
    
    if(inputReal.value==='0'){ document.querySelector(`.js-delete-button-${i}`).click(); }
    else{  document.querySelector(`.js-product-quantity-${i}`).innerHTML=`Product-quantity:${inputReal.value}
   
   <div class="product-quantity-input-${i} beInvis"><input class="input-quantity js-input-quantity-${i}" type="text"></div>`;
  


  input.classList.add('beInvis');

  updateSpan.innerText='Update'}
    
  }

  else{
  input.classList.add('beInvis');

  updateSpan.innerText='Update'}


  }

 

}