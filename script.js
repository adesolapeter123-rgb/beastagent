const API_BASE = 'http://localhost:3000/api';
const cart = [];

const menuGrid = document.getElementById('menu-grid');
const cartItems = document.getElementById('cart-items');
const subtotalEl = document.getElementById('subtotal');
const deliveryFeeEl = document.getElementById('delivery-fee');
const totalEl = document.getElementById('total');
const itemCountEl = document.getElementById('item-count');
const orderMessageEl = document.getElementById('order-message');
const placeOrderBtn = document.getElementById('place-order');
const bestSellerSelect = document.getElementById('best-seller-select');
const bestSellerPriceEl = document.getElementById('best-seller-price');
const heroBestSellerBtn = document.querySelector('.hero-best-seller-btn');

const menuItems = [];

const snackVisuals = {
  meatpie: {
    icon: `<img src="./meatpie.jpg" alt="Meat pie" style="width:100%;height:100%;object-fit:cover;border-radius:12px;" />`,
    tag: 'Best seller',
    description: 'Flaky pastry filled with seasoned minced meat and vegetables.'
  },
  puffpuff: {
    icon: `<img src="./puffpuff.jpg" alt="Puff puff" style="width:100%;height:100%;object-fit:cover;border-radius:12px;" />`,
    tag: '6 pieces',
    description: 'Soft, airy dough balls fried until golden and fluffy.'
  },
  chinchin: {
    icon: `<img src="./chinchin.jpg" alt="Chin chin" style="width:100%;height:100%;object-fit:cover;border-radius:12px;" />`,
    tag: 'Crunchy',
    description: 'Crispy fried pastry cubes, lightly sweetened.'
  },
  samosa: {
    icon: `<img src="./samosa.jpg" alt="Samosa" style="width:100%;height:100%;object-fit:cover;border-radius:12px;" />`,
    tag: 'Savory',
    description: 'Crisp triangle pastry packed with spiced veg and meat.'
  },
  donut: {
    icon: `<img src="./donut.jpg" alt="Donut" style="width:100%;height:100%;object-fit:cover;border-radius:12px;" />`,
    tag: 'Sweet treat',
    description: 'Soft glazed donut with a classic sugar finish.'
  },
  fishroll: {
    icon: `<img src="./fishroll.jpg" alt="Fish roll" style="width:100%;height:100%;object-fit:cover;border-radius:12px;" />`,
    tag: 'Popular',
    description: 'Pastry roll wrapped around flaked, seasoned fish.'
  },
  eggroll: {
    icon: `<img src="./egg roll.jpg" alt="Egg roll" style="width:100%;height:100%;object-fit:cover;border-radius:12px;" />`,
    tag: 'Classic',
    description: 'Pastry-wrapped boiled egg, a tasty snack favorite.'
  },
};

function formatMoney(amount) {
  return `₦${amount.toLocaleString()}`;
}

function normalizeMenuItem(item) {
  const fallback = snackVisuals[item.id] || {
    icon: '🍽️',
    tag: 'Fresh',
    description: 'Freshly made Beastagent snack.',
  };

  return {
    ...item,
    icon: fallback.icon,
    tag: item.badge || fallback.tag,
    description: item.desc || fallback.description,
  };
}

async function loadMenu() {
  try {
    const response = await fetch(`${API_BASE}/snacks`);
    if (!response.ok) {
      throw new Error('Failed to load menu');
    }

    const data = await response.json();
    menuItems.length = 0;
    data.forEach((item) => menuItems.push(normalizeMenuItem(item)));
    renderMenu();
    populateBestSellerOptions();
  } catch (error) {
    console.error('Menu load failed:', error);
    const fallback = [
      { id: 'meatpie', name: 'Meat pie', price: 800 },
      { id: 'puffpuff', name: 'Puff puff', price: 500 },
      { id: 'chinchin', name: 'Chin chin', price: 700 },
      { id: 'samosa', name: 'Samosa', price: 600 },
      { id: 'donut', name: 'Donut', price: 450 },
      { id: 'fishroll', name: 'Fish roll', price: 700 },
      { id: 'eggroll', name: 'Egg roll', price: 600 },
    ];

    menuItems.length = 0;
    fallback.forEach((item) => menuItems.push(normalizeMenuItem(item)));
    renderMenu();
    populateBestSellerOptions();
  }
}

function renderMenu() {
  menuGrid.innerHTML = menuItems
    .map(
      (item) => `
        <article class="menu-card">
          <div class="card-visual">${item.icon}</div>
          <div class="menu-card-content">
            <div class="menu-card-top">
              <div>
                <h3>${item.name}</h3>
                <span class="tag">${item.tag}</span>
              </div>
              <span class="price">${formatMoney(item.price)}</span>
            </div>
            <p>${item.description}</p>
            <div class="card-actions">
              <button class="add-btn" data-id="${item.id}">Add to cart</button>
            </div>
          </div>
        </article>
      `
    )
    .join('');

  document.querySelectorAll('.add-btn').forEach((button) => {
    button.addEventListener('click', () => addToCart(button.dataset.id));
  });
}

function populateBestSellerOptions() {
  if (!bestSellerSelect) return;

  if (menuItems.length === 0) {
    bestSellerSelect.innerHTML = '<option value="">No snacks available</option>';
    return;
  }

  bestSellerSelect.innerHTML = menuItems
    .map(
      (item) => `<option value="${item.id}">${item.name}</option>`
    )
    .join('');

  const defaultItem = menuItems.find((item) => item.id === 'meatpie') || menuItems[0];
  bestSellerSelect.value = defaultItem.id;
  updateBestSellerPrice();
}

function updateBestSellerPrice() {
  if (!bestSellerSelect || !bestSellerPriceEl || !heroBestSellerBtn) return;

  const selectedItem = menuItems.find((item) => item.id === bestSellerSelect.value) || menuItems[0];

  if (!selectedItem) return;

  bestSellerPriceEl.textContent = formatMoney(selectedItem.price);
  heroBestSellerBtn.dataset.bestSeller = selectedItem.id;
}

function addToCart(itemId) {
  const item = menuItems.find((entry) => entry.id === itemId);
  if (!item) return;

  const existingItem = cart.find((entry) => entry.id === itemId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }

  renderCart();
}

async function placeBestSellerOrder() {
  const selectedItemId = heroBestSellerBtn?.dataset.bestSeller || bestSellerSelect?.value || 'meatpie';

  const payload = {
    items: [{ id: selectedItemId, qty: 1 }],
    customer: {
      name: 'Guest Customer',
      phone: '08000000000',
      address: 'Delivery address',
    },
  };

  try {
    const response = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unable to place order.');
    }

    window.location.href = `invoice.html?orderId=${data.id}`;
  } catch (error) {
    orderMessageEl.textContent = error.message || 'Something went wrong while placing the order.';
    orderMessageEl.style.color = '#d9485f';
  }
}

function updateQuantity(itemId, change) {
  const target = cart.find((entry) => entry.id === itemId);

  if (!target) return;

  target.quantity += change;

  if (target.quantity <= 0) {
    const index = cart.findIndex((entry) => entry.id === itemId);
    cart.splice(index, 1);
  }

  renderCart();
}

function renderCart() {
  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="empty-cart">
        <p>Your cart is empty.</p>
        <small>Add snacks from the menu.</small>
      </div>
    `;
  } else {
    cartItems.innerHTML = cart
      .map(
        (item) => `
          <div class="cart-item">
            <div class="cart-item-left">
              <div class="item-badge">${item.icon}</div>
              <div class="item-text">
                <p>${item.name}</p>
                <h4>${formatMoney(item.price)}</h4>
              </div>
            </div>
            <div class="cart-controls">
              <button class="qty-btn" data-action="decrease" data-id="${item.id}">-</button>
              <span class="quantity">${item.quantity}</span>
              <button class="qty-btn" data-action="increase" data-id="${item.id}">+</button>
              <span class="item-price">${formatMoney(item.price * item.quantity)}</span>
            </div>
          </div>
        `
      )
      .join('');
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = cart.length > 0 ? 700 : 0;
  const total = subtotal + deliveryFee;

  subtotalEl.textContent = formatMoney(subtotal);
  deliveryFeeEl.textContent = formatMoney(deliveryFee);
  totalEl.textContent = formatMoney(total);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  itemCountEl.textContent = `${totalItems} item${totalItems === 1 ? '' : 's'}`;

  document.querySelectorAll('.qty-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      const id = button.dataset.id;
      updateQuantity(id, action === 'increase' ? 1 : -1);
    });
  });
}

placeOrderBtn.addEventListener('click', async () => {
  if (cart.length === 0) {
    orderMessageEl.textContent = 'Please add at least one snack to place an order.';
    orderMessageEl.style.color = '#d9485f';
    return;
  }

  const payload = {
    items: cart.map((item) => ({ id: item.id, qty: item.quantity })),
    customer: {
      name: 'Guest Customer',
      phone: '08000000000',
      address: 'Delivery address',
    },
  };

  try {
    const response = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unable to place order.');
    }

    orderMessageEl.textContent = `Order placed successfully! Redirecting to invoice...`;
    orderMessageEl.style.color = '#1e9b67';

    cart.length = 0;
    renderCart();

    window.location.href = `invoice.html?orderId=${data.id}`;
  } catch (error) {
    orderMessageEl.textContent = error.message || 'Something went wrong while placing the order.';
    orderMessageEl.style.color = '#d9485f';
  }
});

if (bestSellerSelect) {
  bestSellerSelect.addEventListener('change', updateBestSellerPrice);
}

document.querySelectorAll('.hero-best-seller-btn').forEach((button) => {
  button.addEventListener('click', placeBestSellerOrder);
});

renderMenu();
renderCart();
loadMenu();
