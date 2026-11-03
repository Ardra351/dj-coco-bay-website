const ORDERS_STORAGE_KEY = "dj-coco-bay-orders-v1";
const ADMIN_AUTH_KEY = "dj-coco-bay-admin-auth-v1";
const ADMIN_SESSION_KEY = "dj-coco-bay-admin-unlocked-v1";
const PASSWORD_ITERATIONS = 150000;
const ORDER_STATUSES = ["New", "Confirmed", "Preparing", "Ready for pickup", "Completed", "Cancelled"];
let orders = [];
const ordersRoot = document.getElementById("orders-list");
const searchInput = document.getElementById("order-search");
const statusFilter = document.getElementById("order-filter");
const loginScreen = document.getElementById("admin-login");
const dashboard = document.getElementById("admin-dashboard");
const authForm = document.getElementById("admin-auth-form");
const passwordInput = document.getElementById("admin-password");
const confirmPasswordWrap = document.getElementById("confirm-password-wrap");
const confirmPasswordInput = document.getElementById("confirm-password");
const authError = document.getElementById("auth-error");

function readAuthConfig(){
  try {
    const config = JSON.parse(localStorage.getItem(ADMIN_AUTH_KEY));
    if (config && typeof config.salt === "string" && typeof config.hash === "string" && Number.isInteger(config.iterations)) return config;
  } catch(e) {}
  return null;
}
function bytesToHex(bytes){ return Array.from(bytes,byte=>byte.toString(16).padStart(2,"0")).join(""); }
function hexToBytes(hex){ return new Uint8Array(hex.match(/.{2}/g).map(byte=>parseInt(byte,16))); }
async function passwordHash(password,salt,iterations){
  const key = await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({name:"PBKDF2",salt:hexToBytes(salt),iterations,hash:"SHA-256"},key,256);
  return bytesToHex(new Uint8Array(bits));
}
function configureAuthScreen(){
  const setup = !readAuthConfig();
  document.getElementById("auth-title").textContent = setup ? "Set admin password" : "Admin sign in";
  document.getElementById("auth-instructions").textContent = setup ? "Create the password for this browser’s business admin dashboard." : "Enter the business admin password to view customer orders.";
  document.getElementById("auth-submit").textContent = setup ? "Set password" : "Sign in";
  confirmPasswordWrap.hidden = !setup;
  confirmPasswordInput.required = setup;
  confirmPasswordInput.minLength = setup ? 12 : 0;
  passwordInput.autocomplete = setup ? "new-password" : "current-password";
  passwordInput.minLength = setup ? 12 : 1;
  authError.hidden = true;
}
async function authenticate(event){
  event.preventDefault();
  const button = document.getElementById("auth-submit");
  button.disabled = true;
  authError.hidden = true;
  try {
    const password = passwordInput.value;
    let config = readAuthConfig();
    if (!config) {
      if (password !== confirmPasswordInput.value) throw new Error("Passwords do not match.");
      const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
      config = {salt,iterations:PASSWORD_ITERATIONS,hash:await passwordHash(password,salt,PASSWORD_ITERATIONS)};
      localStorage.setItem(ADMIN_AUTH_KEY,JSON.stringify(config));
    } else {
      const candidate = await passwordHash(password,config.salt,config.iterations);
      if (candidate !== config.hash) throw new Error("Incorrect password.");
    }
    sessionStorage.setItem(ADMIN_SESSION_KEY,"unlocked");
    passwordInput.value = "";
    confirmPasswordInput.value = "";
    unlockDashboard();
  } catch(error) {
    authError.textContent = error instanceof Error ? error.message : "Unable to verify password in this browser.";
    authError.hidden = false;
  } finally {
    button.disabled = false;
  }
}
function unlockDashboard(){
  loginScreen.hidden = true;
  dashboard.hidden = false;
  orders = loadOrders();
  renderOrders();
}
function lockDashboard(){
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  dashboard.hidden = true;
  loginScreen.hidden = false;
  authForm.reset();
  configureAuthScreen();
}

function loadOrders(){
  try {
    const saved = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY));
    if (Array.isArray(saved)) return saved.filter(order => order && typeof order.id === "string" && Array.isArray(order.items));
  } catch(e) {}
  return [];
}
function money(value){ return "₹" + Number(value || 0).toLocaleString("en-IN"); }
function saveOrders(){ localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders)); }
function formatDate(value){
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString("en-IN", {dateStyle:"medium",timeStyle:"short"});
}
function updateStats(){
  document.getElementById("stat-all").textContent = orders.length;
  document.getElementById("stat-new").textContent = orders.filter(order => order.status === "New").length;
  document.getElementById("stat-progress").textContent = orders.filter(order => ["Confirmed","Preparing"].includes(order.status)).length;
  document.getElementById("stat-ready").textContent = orders.filter(order => order.status === "Ready for pickup").length;
}
function createDetail(label, value){
  const wrapper = document.createElement("div");
  wrapper.className = "order-detail";
  const caption = document.createElement("span"); caption.textContent = label;
  const content = document.createElement("strong"); content.textContent = value || "Not provided";
  wrapper.append(caption, content);
  return wrapper;
}
function renderOrders(){
  updateStats();
  const query = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;
  const visibleOrders = orders.filter(order => {
    const matchesStatus = selectedStatus === "All" || order.status === selectedStatus;
    const searchable = `${order.id} ${order.customerName} ${order.customerPhone}`.toLowerCase();
    return matchesStatus && searchable.includes(query);
  });
  ordersRoot.innerHTML = "";
  if (!visibleOrders.length) {
    const empty = document.createElement("div");
    empty.className = "orders-empty";
    empty.textContent = orders.length ? "No orders match these filters." : "No orders yet. New customer orders will appear here in this browser.";
    ordersRoot.append(empty);
    return;
  }
  visibleOrders.forEach(order => {
    const card = document.createElement("article");
    card.className = "order-card";
    const header = document.createElement("header");
    header.className = "order-card-header";
    const identity = document.createElement("div");
    const id = document.createElement("h2"); id.textContent = order.id;
    const created = document.createElement("time"); created.dateTime = order.createdAt || ""; created.textContent = formatDate(order.createdAt);
    identity.append(id, created);
    const status = document.createElement("select");
    status.className = "order-status";
    status.setAttribute("aria-label", `Status for ${order.id}`);
    const currentStatus = ORDER_STATUSES.includes(order.status) ? order.status : "New";
    ORDER_STATUSES.forEach(value=>{
      const option = document.createElement("option"); option.value = value; option.textContent = value;
      option.selected = value === currentStatus;
      status.append(option);
    });
    status.addEventListener("change",()=>{
      const storedOrder = orders.find(item=>item.id === order.id);
      if (!storedOrder) return;
      storedOrder.status = status.value;
      saveOrders();
      renderOrders();
    });
    header.append(identity,status);

    const details = document.createElement("div");
    details.className = "order-details-grid";
    details.append(createDetail("Customer", order.customerName), createDetail("Mobile", order.customerPhone), createDetail("Pickup", order.pickupTime), createDetail("Payment", order.paymentMethod));
    const phone = details.querySelectorAll(".order-detail")[1];
    if (order.customerPhone) {
      const phoneLink = document.createElement("a");
      phoneLink.href = `tel:${String(order.customerPhone).replace(/[^0-9+]/g, "")}`;
      phoneLink.textContent = order.customerPhone;
      phone.replaceChildren(phone.firstChild, phoneLink);
    }

    const itemList = document.createElement("ul");
    itemList.className = "order-lines";
    order.items.forEach(item=>{
      const line = document.createElement("li");
      const name = document.createElement("span"); name.textContent = `${Number(item.quantity) || 0} × ${item.name || "Item"}`;
      const price = document.createElement("strong"); price.textContent = money(Number(item.price) * Number(item.quantity));
      line.append(name,price); itemList.append(line);
    });
    const total = document.createElement("p");
    total.className = "order-total";
    total.append(document.createTextNode("Order total"));
    const amount = document.createElement("strong"); amount.textContent = money(order.total); total.append(amount);
    card.append(header,details,itemList,total);
    ordersRoot.append(card);
  });
}
function exportOrders(){
  const columns = ["Order ID","Created","Customer","Mobile","Pickup","Payment","Status","Items","Total"];
  const escapeCsv = value => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const rows = orders.map(order=>[
    order.id,formatDate(order.createdAt),order.customerName,order.customerPhone,order.pickupTime,order.paymentMethod,order.status,
    order.items.map(item=>`${item.quantity} x ${item.name}`).join("; "),order.total
  ]);
  const csv = [columns,...rows].map(row=>row.map(escapeCsv).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  const link = document.createElement("a"); link.href = url; link.download = "dj-coco-bay-orders.csv"; link.click();
  URL.revokeObjectURL(url);
}

searchInput.addEventListener("input",renderOrders);
statusFilter.addEventListener("change",renderOrders);
authForm.addEventListener("submit",authenticate);
document.getElementById("admin-logout").addEventListener("click",lockDashboard);
document.getElementById("refresh-orders").addEventListener("click",()=>{orders=loadOrders();renderOrders();});
document.getElementById("export-orders").addEventListener("click",exportOrders);
window.addEventListener("storage",event=>{
  if (event.key === ORDERS_STORAGE_KEY && !dashboard.hidden) { orders=loadOrders(); renderOrders(); }
});
configureAuthScreen();
if (readAuthConfig() && sessionStorage.getItem(ADMIN_SESSION_KEY) === "unlocked") unlockDashboard();
else loginScreen.hidden = false;