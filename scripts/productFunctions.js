
export function delete1(i){
  
 const container0= document.querySelector(`.item-container-${i}`);

container0.remove();

}

 export function updateProduct(i){
  
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