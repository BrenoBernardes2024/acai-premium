/* ========================================
   AÇAÍ PREMIUM - cart.js
   Lógica do Carrinho de Compras
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    initCart();
});

// Cart state
let cart = [];

function initCart() {
    // Load cart from localStorage
    loadCart();
    
    // Update cart display
    renderCartItems();
    updateCartTotal();
    updateCartCount();
    
    // Checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }
}

function loadCart() {
    const storedCart = localStorage.getItem('acaiCart');
    if (storedCart) {
        cart = JSON.parse(storedCart);
    }
}

function saveCart() {
    localStorage.setItem('acaiCart', JSON.stringify(cart));
}

function renderCartItems() {
    const cartItemsContainer = document.getElementById('cartItems');
    if (!cartItemsContainer) return;
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="cart-empty">
                <i class="fas fa-shopping-basket"></i>
                <h3>Carrinho Vazio</h3>
                <p>Adicione alguns açaís deliciosos!</p>
            </div>
        `;
        return;
    }
    
    cartItemsContainer.innerHTML = cart.map((item, index) => `
        <div class="cart-item" data-index="${index}">
            <div class="cart-item-image">
                <img src="https://images.unsplash.com/photo-1595855799984-7a9ae2809d43?w=100&h=100&fit=crop" alt="${item.name}">
            </div>
            <div class="cart-item-info">
                <h4 class="cart-item-title">${item.name}</h4>
                <p class="cart-item-details">
                    ${item.flavor ? item.flavor + ' | ' : ''}
                    ${item.size ? item.size + 'ml | ' : ''}
                    ${item.coatings ? item.coatings.slice(0, 2).join(', ') + (item.coatings.length > 2 ? '...' : '') : 'Sem coberturas'}
                </p>
                <div class="cart-item-price">R$ ${item.totalPrice.toFixed(2).replace('.', ',')}</div>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart(${index})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function updateCartTotal() {
    const cartTotal = document.getElementById('cartTotal');
    if (!cartTotal) return;
    
    const total = cart.reduce((sum, item) => sum + (item.totalPrice * item.quantity), 0);
    cartTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (!cartCount) return;
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
}

function addToCart(product) {
    cart.push(product);
    saveCart();
    renderCartItems();
    updateCartTotal();
    updateCartCount();
    
    // Show notification
    showNotification('Produto adicionado ao carrinho!');
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    renderCartItems();
    updateCartTotal();
    updateCartCount();
    
    showNotification('Produto removido do carrinho');
}

function clearCart() {
    cart = [];
    saveCart();
    renderCartItems();
    updateCartTotal();
    updateCartCount();
}

function handleCheckout() {
    if (cart.length === 0) {
        showNotification('Seu carrinho está vazio!', 'error');
        return;
    }
    
    // Open modal or redirect to checkout
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Pre-fill product info
        const modalProductDetails = document.getElementById('modalProductDetails');
        const total = cart.reduce((sum, item) => sum + (item.totalPrice * item.quantity), 0);
        
        if (modalProductDetails) {
            modalProductDetails.innerHTML = `
                <span>${cart.length} item(s) no carrinho</span>
                <span>Total: R$ ${total.toFixed(2).replace('.', ',')}</span>
            `;
        }
    }
}

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #28a745, #20c997)' : '#dc3545'};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        z-index: 4000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Global functions for HTML access
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;

