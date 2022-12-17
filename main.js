//variables
const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const clearCartBtn = document.querySelector(".clear-cart");
const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");
const cartContent = document.querySelector(".cart-content");
const productsDOM = document.querySelector(".products-center");
//cart
let cart = [];
//buttons
let buttonsDOM = [];


//getting products
class Products {
  async getProducts() {
    let resp = await fetch("./products.json");
    let data = await resp.json();
    let products = data.items;
    
    products = products.map(({sys, fields}) => {
      const {title, price, image: {fields: {file: {url}}}} = fields;
      const {id} = sys;
      return {id, title, price, url}
    });
    return products;
  }
}

//display products
class UI {
  renderProducts(products) {
    let render = "";
    products.forEach(({id, title, price, url}) => {
      render += `
      <!-- single product start -->
      <article class="product">
      <div class="img-container">
      <img src=${url} alt="" class="product-img">
      <button class="bag-btn" data-id=${id}>
      <i class="bi bi-cart"></i>
      add to cart
      </button>
      </div>
      <h3>${title}</h3>
      <h4>$${price}</h4>
      </article>
      <!-- single product end -->
      `
    });
    productsDOM.innerHTML = render
  };
  getBagButtons() {
    const buttons = [...document.querySelectorAll(".bag-btn")];
    buttonsDOM = buttons;
    buttons.forEach((button) => {
      let id = button.dataset.id;
      let inCart = cart.find(item => item.id === id);
      if (inCart) {
        button.innerText = "In Cart";
        button.disabled = true;
      };
      button.addEventListener("click", event => {
        event.target.innerText = "In Cart";
        event.target.disabled = true;
        // get product from products
        let cartItem = {...Storage.getProduct(id), amount:1};
        // add product to the cart
        cart = [...cart, cartItem];
        // save cart in LS
        Storage.saveCart(cart);
        // set cart values
        this.setCartValues(cart);
        // display cart items
        this.addCartItem(cartItem);
        // show cart
        this.showCart()
      });
    });
  };
  setCartValues(cart) {
    let tempTotal = 0;
    let itemsTotal = 0;
    cart.map(item => {
      tempTotal += item.price * item.amount;
      itemsTotal += item.amount;
    });
    cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
    cartItems.innerText = itemsTotal;
  };
  addCartItem(cartItem) {
    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `
          <img src=${cartItem.url} alt="">
          <div>
            <h4>${cartItem.title}</h4>
            <h5>$${cartItem.price}</h5>
            <span class="remove-item" data-id=${cartItem.id} >remove</span>
          </div>
          <div>
            <i class="bi bi-chevron-up" data-id=${cartItem.id}></i>
            <p class="item-amount">${cartItem.amount}</p>
            <i class="bi bi-chevron-down" data-id=${cartItem.id}></i>
          </div>
    `;
    cartContent.appendChild(div);
  };
  showCart() {
    cartOverlay.classList.toggle("transparentBcg");
    cartDOM.classList.toggle("showCart");
  };
  setupAPP() {
    cart = Storage.getCart();
    this.setCartValues(cart);
    this.populateCart(cart);
    cartBtn.addEventListener("click", this.showCart);
    closeCartBtn.addEventListener("click", this.showCart)
  };
  populateCart(cart) {
    cart.forEach(cartItem => this.addCartItem(cartItem))
  };
  cartLogic() {
    // clear cart button
    clearCartBtn.addEventListener("click", () => {
      this.clearCart();
    });
    cartContent.addEventListener("click", event => {
      if(event.target.classList.contains("remove-item")) {
        let removeItem = event.target;
        let id = removeItem.dataset.id;
        cartContent.removeChild(removeItem.parentElement.parentElement);
        this.removeItem(id)
      } 
      else if(event.target.classList.contains("bi-chevron-up")) {
        let addAmount = event.target;
        let id = addAmount.dataset.id;
        let tempItem = cart.find(item => item.id === id);
        tempItem.amount = tempItem.amount + 1;
        Storage.saveCart(cart);
        this.setCartValues(cart);
        addAmount.nextElementSibling.innerText = tempItem.amount;
      } 
      else if(event.target.classList.contains("bi-chevron-down")) {
        let subsAmount = event.target;
        let id = subsAmount.dataset.id;
        let tempItem = cart.find(item => item.id === id);
        tempItem.amount = tempItem.amount - 1;
        Storage.saveCart(cart);
        this.setCartValues(cart);
        subsAmount.previousElementSibling.innerText = tempItem.amount;
        if(tempItem.amount > 0) {
          Storage.saveCart(cart);
          this.setCartValues(cart);
          subsAmount.previousElementSibling.innerText = tempItem.amount;
        }
        else {
          cartContent.removeChild(subsAmount.parentElement.parentElement);
          this.removeItem(id)
        }
      }
    });
    // cart functionality
  };
  clearCart() {
    let cartItems = cart.map(item => item.id);
    cartItems.forEach(id => this.removeItem(id));
    while(cartContent.children.length > 0) {
      cartContent.removeChild(cartContent.children[0])
    };
    this.showCart();
  };
  removeItem(id) {
    cart = cart.filter(item => item.id !== id);
    this.setCartValues(cart);
    Storage.saveCart(cart);
    let button = this.getSingleButton(id);
    button.disabled = false;
    button.innerHTML = `
    <i class="bi bi-cart"></i>
      add to cart
    `;
  };
  getSingleButton(id) {
    return buttonsDOM.find(button => button.dataset.id === id);
  };
}

//LS
class Storage {
  static saveProducts(products) {
    localStorage.setItem("products", JSON.stringify(products))
  };
  static getProduct(id) {
    let products = JSON.parse(localStorage.getItem("products"));
    return products.find((item) => item.id === id)
  };
  static saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart))
  };
  static getCart() {
    return localStorage.getItem("cart") ? JSON.parse(localStorage.getItem("cart")) : []
  };
}

document.addEventListener("DOMContentLoaded", () => {
  const ui = new UI();
  const products = new Products();
  // setup app
  ui.setupAPP()
  // get all products

  products.getProducts().then((products) => {
    ui.renderProducts(products);
    Storage.saveProducts(products);
  }).then(() => {
    ui.getBagButtons();
    ui.cartLogic();
  })
})