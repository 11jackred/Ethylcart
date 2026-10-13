export function getProduct(productId,products){
  let matchingProduct;
  products.forEach((product)=>{if(product.id===productId){matchingProduct=product;}


})
return matchingProduct;
}

export const products= [
{id: 1, name: 'umbrella', quantity: '1', price: 100}

,
{id: 4, name: 't-shirt', quantity: '1', price: 100}

,
{id: 3, name: 'ball', quantity: '1', price: 100}

,
{id: 2, name: 'cube', quantity: '1', price: 100}]