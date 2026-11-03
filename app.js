const DEFAULT_MENU = [
  { name: "Tender Coconut Starters", icon: "🌿", items: [
    ["Tender Coconut",60],["TC. Water (300ML)",60],["TC. Water (500ML)",100],
    ["TC. Water (1L)",200],["TC. Juice",60],["TC. Lime",60],
    ["TC. Ice Cream",60],["TC. Pineapple Juice",80]
  ]},
  { name: "Tender Coconut Shakes", icon: "🥤", items: [
    ["TC. Shakes",70],["TC. Boost",80],["TC. Horlicks",80],
    ["TC. Kitkat",90],["TC. Chocolate",90],["TC. Oreo",90]
  ]},
  { name: "Tender Coconut Specials", icon: "🥥", items: [
    ["TC. Fruit Salad",110],["TC. Falooda",120],["TC. Pista",120],
    ["TC. Avocado",140],["TC. Nuts",140],["TC. Mango",100],
    ["TC. Kiwi",140],["TC. Dragon Fruit",110]
  ]},
  { name: "Tender Coconut Puddings", icon: "🍮", items: [] },
  { name: "Tender Coconut Cakes", icon: "🍰", items: [] },
  { name: "Tender Coconut Payasams", icon: "🥣", items: [] }
];
const STORAGE_KEY = "dj-coco-bay-menu-v1";
const CART_STORAGE_KEY = "dj-coco-bay-cart-v1";
const ORDERS_STORAGE_KEY = "dj-coco-bay-orders-v1";
const ADMIN_SESSION_KEY = "dj-coco-bay-admin-unlocked-v1";
let menu = loadMenu();
let cart = loadCart();
const menuRoot = document.getElementById("menu-sections");
const dialog = document.getElementById("editor-dialog");
document.getElementById("year").textContent = new Date().getFullYear();
const cartDialog = document.getElementById("cart-dialog");
const cartItemsRoot = document.getElementById("cart-items");
const checkoutForm = document.getElementById("checkout-form");
const orderConfirmation = document.getElementById("order-confirmation");
const adminToggle = document.getElementById("admin-toggle");

function hasAdminAccess(){ return sessionStorage.getItem(ADMIN_SESSION_KEY) === "unlocked"; }
function requireAdminAccess(){
  if (hasAdminAccess()) return true;
  dialog.close();
  window.location.href = "admin.html";
  return false;
}
function syncAdminToggle(){
  const isAdmin = hasAdminAccess();
  adminToggle.hidden = !isAdmin;
  if (!isAdmin && dialog.open) dialog.close();
}

function loadMenu(){
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) return saved;
  } catch(e) {}
  return structuredClone(DEFAULT_MENU);
}
function saveMenu(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(menu)); }
function loadCart(){
  try {
    const saved = JSON.parse(localStorage.getItem(CART_STORAGE_KEY));
    if (Array.isArray(saved)) return saved.filter(item => item && typeof item.name === "string" && Number(item.price) >= 0 && Number(item.quantity) > 0);
  } catch(e) {}
  return [];
}
function saveCart(){ localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart)); }
function money(value){ return "₹" + Number(value || 0).toLocaleString("en-IN"); }
function addToCart(name, price){
  const existing = cart.find(item => item.name === name);
  if (existing) existing.quantity += 1;
  else cart.push({name, price: Number(price), quantity: 1});
  saveCart();
  renderCart();
}
function renderCart(){
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  document.getElementById("cart-count").textContent = itemCount;
  cartItemsRoot.innerHTML = "";
  if (!cart.length) {
    const empty = document.createElement("p");
    empty.className = "cart-empty";
    empty.textContent = "Your cart is empty. Add something fresh from the menu.";
    cartItemsRoot.append(empty);
  }
  cart.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "cart-row";
    const details = document.createElement("div");
    details.className = "cart-product";
    const name = document.createElement("strong"); name.textContent = item.name;
    const price = document.createElement("span"); price.textContent = `${money(item.price)} each`;
    details.append(name, price);
    const controls = document.createElement("div");
    controls.className = "quantity-controls";
    const decrease = document.createElement("button"); decrease.type = "button"; decrease.dataset.cartAction = "decrease"; decrease.dataset.index = index; decrease.setAttribute("aria-label", `Remove one ${item.name}`); decrease.textContent = "−";
    const quantity = document.createElement("span"); quantity.textContent = item.quantity;
    const increase = document.createElement("button"); increase.type = "button"; increase.dataset.cartAction = "increase"; increase.dataset.index = index; increase.setAttribute("aria-label", `Add one ${item.name}`); increase.textContent = "+";
    const remove = document.createElement("button"); remove.type = "button"; remove.dataset.cartAction = "remove"; remove.dataset.index = index; remove.className = "cart-remove"; remove.setAttribute("aria-label", `Remove ${item.name} from cart`); remove.textContent = "Remove";
    controls.append(decrease, quantity, increase, remove);
    row.append(details, controls);
    cartItemsRoot.append(row);
  });
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  document.getElementById("cart-total").textContent = money(total);
  document.getElementById("place-order").disabled = cart.length === 0;
}
function renderMenu(){
  menuRoot.innerHTML = "";
  const categoryParam = new URLSearchParams(window.location.search).get("category");
  const selectedIndex = categoryParam === null ? -1 : Number(categoryParam);
  const selectedCategory = Number.isInteger(selectedIndex) && selectedIndex >= 0 ? menu[selectedIndex] : null;

  if (selectedCategory) {
    document.title = `${selectedCategory.name} | DJ Coco Bay`;
    document.querySelector(".menu-hero h1").textContent = selectedCategory.name;
    document.querySelector(".menu-hero .hero-note").textContent = "Tender coconut favorites, made fresh";
    document.querySelector(".menu-intro h2").textContent = selectedCategory.name;
    document.querySelector(".menu-intro p:last-child").textContent = "Explore the flavors and prices in this category.";

    const back = document.createElement("a");
    back.className = "back-link";
    back.href = "menu.html";
    back.textContent = "← All menu categories";

    const card = document.createElement("section");
    card.className = "menu-card menu-detail";
    const heading = document.createElement("div");
    heading.className = "card-heading";
    const icon = document.createElement("span"); icon.className="card-icon"; icon.textContent=selectedCategory.icon || "✦";
    const title = document.createElement("h2"); title.textContent=selectedCategory.name;
    heading.append(icon,title); card.append(heading);
    const list = document.createElement("ul"); list.className="menu-list";
    (selectedCategory.items || []).forEach(item => {
      const li=document.createElement("li"); li.className="menu-item";
      const name=document.createElement("span"); name.className="item-name"; name.textContent=item[0];
      const price=document.createElement("span"); price.className="item-price"; price.textContent=money(item[1]);
      const add=document.createElement("button"); add.type="button"; add.className="add-to-cart"; add.textContent="Add";
      add.addEventListener("click",()=>addToCart(item[0],item[1]));
      li.append(name,price,add); list.append(li);
    });
    if (!(selectedCategory.items || []).length) {
      const note = document.createElement("p");
      note.className = "empty-category";
      note.textContent = "Add your tender coconut varieties in the menu editor.";
      card.append(note);
    } else {
      card.append(list);
    }
    menuRoot.append(back, card);
    return;
  }

  menu.forEach((category, index) => {
    const card = document.createElement("a");
    card.className = "category-card";
    card.href = `menu.html?category=${index}`;
    const image = document.createElement("img");
    image.src = "assets/coco-bay-emblem.png";
    image.alt = "DJ Coco Bay coconut and drink emblem";
    image.loading = "lazy";
    const caption = document.createElement("span");
    caption.className = "category-caption";
    const icon = document.createElement("span"); icon.className = "card-icon"; icon.textContent = category.icon || "✦";
    const title = document.createElement("strong"); title.textContent = category.name;
    const open = document.createElement("span"); open.className = "category-open"; open.textContent = "View category →";
    caption.append(icon, title, open);
    card.append(image, caption);
    menuRoot.append(card);
  });
}
function renderEditor(){
  if (!requireAdminAccess()) return;
  const root=document.getElementById("editor-content"); root.innerHTML="";
  menu.forEach((category,ci)=>{
    const wrap=document.createElement("section"); wrap.className="edit-category";
    const top=document.createElement("div"); top.className="category-top";
    const name=document.createElement("input"); name.type="text"; name.value=category.name; name.setAttribute("aria-label","Category name");
    name.addEventListener("input",()=>{if(!requireAdminAccess())return;menu[ci].name=name.value; saveMenu(); renderMenu();});
    const icon=document.createElement("input"); icon.type="text"; icon.value=category.icon||""; icon.style.maxWidth="75px"; icon.setAttribute("aria-label","Category icon");
    icon.addEventListener("input",()=>{if(!requireAdminAccess())return;menu[ci].icon=icon.value; saveMenu(); renderMenu();});
    const del=document.createElement("button"); del.className="remove-button"; del.textContent="×"; del.title="Delete category";
    del.addEventListener("click",()=>{if(!requireAdminAccess())return;if(confirm("Delete the "+category.name+" category?")){menu.splice(ci,1);saveMenu();renderEditor();renderMenu();}});
    top.append(name,icon,del); wrap.append(top);
    (category.items||[]).forEach((item,ii)=>{
      const row=document.createElement("div"); row.className="edit-row";
      const itemName=document.createElement("input"); itemName.type="text"; itemName.value=item[0]; itemName.setAttribute("aria-label","Item name");
      itemName.addEventListener("input",()=>{if(!requireAdminAccess())return;menu[ci].items[ii][0]=itemName.value;saveMenu();renderMenu();});
      const price=document.createElement("input"); price.type="number"; price.min="0"; price.step="1"; price.value=item[1]; price.setAttribute("aria-label","Price in rupees");
      price.addEventListener("input",()=>{if(!requireAdminAccess())return;menu[ci].items[ii][1]=price.value===""?0:Number(price.value);saveMenu();renderMenu();});
      const remove=document.createElement("button"); remove.className="remove-button"; remove.textContent="×"; remove.title="Delete item";
      remove.addEventListener("click",()=>{if(!requireAdminAccess())return;menu[ci].items.splice(ii,1);saveMenu();renderEditor();renderMenu();});
      row.append(itemName,price,remove); wrap.append(row);
    });
    const add=document.createElement("button"); add.className="add-item"; add.textContent="＋ Add item";
    add.addEventListener("click",()=>{if(!requireAdminAccess())return;menu[ci].items.push(["New item",0]);saveMenu();renderEditor();renderMenu();});
    wrap.append(add); root.append(wrap);
  });
}
adminToggle.addEventListener("click",()=>{if(!requireAdminAccess())return;renderEditor();dialog.showModal();});
document.getElementById("close-editor").addEventListener("click",()=>dialog.close());
document.getElementById("done-editor").addEventListener("click",()=>dialog.close());
document.getElementById("add-category").addEventListener("click",()=>{if(!requireAdminAccess())return;menu.push({name:"New category",icon:"✦",items:[]});saveMenu();renderEditor();renderMenu();});
document.getElementById("reset-menu").addEventListener("click",()=>{
  if(!requireAdminAccess())return;
  if(confirm("Restore the original DJ Coco Bay menu? Your current browser edits will be replaced.")){
    menu=structuredClone(DEFAULT_MENU);saveMenu();renderEditor();renderMenu();
  }
});
document.getElementById("export-menu").addEventListener("click",()=>{
  if(!requireAdminAccess())return;
  const blob=new Blob([JSON.stringify(menu,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="dj-coco-bay-menu.json";a.click();URL.revokeObjectURL(url);
});
document.getElementById("import-menu").addEventListener("change",async e=>{
  if(!requireAdminAccess())return;
  const file=e.target.files[0];if(!file)return;
  try{
    const imported=JSON.parse(await file.text());
    if(!Array.isArray(imported)||!imported.every(c=>c&&typeof c.name==="string"&&Array.isArray(c.items)))throw new Error("Invalid menu file");
    menu=imported;saveMenu();renderEditor();renderMenu();alert("Menu imported successfully.");
  }catch(err){alert("Could not import this file. Please choose a valid DJ Coco Bay menu JSON export.");}
  e.target.value="";
});
renderMenu();
renderCart();
syncAdminToggle();
window.addEventListener("pageshow",syncAdminToggle);
window.addEventListener("focus",syncAdminToggle);
document.getElementById("cart-toggle").addEventListener("click",()=>cartDialog.showModal());
document.getElementById("close-cart").addEventListener("click",()=>cartDialog.close());
cartItemsRoot.addEventListener("click",event=>{
  const button = event.target.closest("button[data-cart-action]");
  if (!button) return;
  const index = Number(button.dataset.index);
  const item = cart[index];
  if (!item) return;
  if (button.dataset.cartAction === "increase") item.quantity += 1;
  if (button.dataset.cartAction === "decrease") item.quantity -= 1;
  if (button.dataset.cartAction === "remove" || item.quantity <= 0) cart.splice(index,1);
  saveCart();
  renderCart();
});
checkoutForm.addEventListener("submit",event=>{
  event.preventDefault();
  if (!cart.length) return;
  const details = new FormData(checkoutForm);
  const orderLines = cart.map(item=>`${item.quantity} × ${item.name} — ${money(item.price * item.quantity)}`);
  const total = cart.reduce((sum,item)=>sum + item.price * item.quantity,0);
  const order = {
    id: `CB-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    customerName: String(details.get("customerName") || "").trim(),
    customerPhone: String(details.get("customerPhone") || "").trim(),
    pickupTime: details.get("pickupTime"),
    paymentMethod: details.get("paymentMethod"),
    items: cart.map(item=>({name:item.name,price:item.price,quantity:item.quantity})),
    total,
    status: "New"
  };
  let orders = [];
  try {
    const savedOrders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY));
    if (Array.isArray(savedOrders)) orders = savedOrders;
  } catch(e) {}
  orders.unshift(order);
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  const summary = [
    `Order: ${order.id}`,
    `Name: ${details.get("customerName")}`,
    `Mobile: ${details.get("customerPhone")}`,
    `Pickup: ${details.get("pickupTime")}`,
    `Payment at pickup: ${details.get("paymentMethod")}`,
    "",
    ...orderLines,
    `Total: ${money(total)}`
  ].join("\n");
  document.getElementById("order-summary").textContent = summary;
  checkoutForm.hidden = true;
  orderConfirmation.hidden = false;
  cart = [];
  saveCart();
  renderCart();
});
document.getElementById("print-order").addEventListener("click",()=>window.print());
