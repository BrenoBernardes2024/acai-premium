/* ========================================
   AÇAÍ PREMIUM - configurator.js
   Lógica do Configurador de Açaí
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    initConfigurator();
});

// Configuration
const config = {
    sizes: {
        300: { price: 12, limit: { fruit: 3, granola: 2, syrup: 2, complement: 4 } },
        500: { price: 18, limit: { fruit: 4, granola: 2, syrup: 2, complement: 5 } },
        700: { price: 25, limit: { fruit: 5, granola: 3, syrup: 3, complement: 6 } }
    },
    flavors: {
        tradicional: { name: 'Tradicional', color: '#4B0082' },
        guarana: { name: 'Guaraná', color: '#6B238E' },
        zero: { name: 'Zero', color: '#8B00FF' }
    },
    coatingColors: {
        // Fruits
        'Banana': 'coating-fruit-banana',
        'Morango': 'coating-fruit-morango',
        'Kiwi': 'coating-fruit-kiwi',
        'Abacaxi': 'coating-fruit-abacaxi',
        'Uva': 'coating-fruit-uva',
        'Manga': 'coating-fruit-manga',
        // Granolas
        'Tradicional': 'coating-granola-tradicional',
        'Crocante': 'coating-granola-crocante',
        'Leite em Pó': 'coating-granola-leite-po',
        // Syrups
        'Leite Condensado': 'coating-syrup-leite',
        'Chocolate': 'coating-syrup-chocolate',
        'Morango': 'coating-syrup-morango',
        'Caramelo': 'coating-syrup-caramelo',
        // Complements
        'Paçoca': 'coating-complement-pacoca',
        'Farinha Láctea': 'coating-complement-farinha',
        'Coco Ralado': 'coating-complement-coco',
        'Chocoball': 'coating-complement-chocoball',
        'Nutella': 'coating-complement-nutella',
        'Amendoim': 'coating-complement-amendoim'
    }
};

// State
let currentState = {
    size: 300,
    flavor: 'tradicional',
    coatings: {
        fruit: [],
        granola: [],
        syrup: [],
        complement: []
    }
};

// DOM Elements
let sizeButtons, flavorButtons, coatingButtons, addToCartBtn;

function initConfigurator() {
    // Get elements
    sizeButtons = document.querySelectorAll('.size-btn');
    flavorButtons = document.querySelectorAll('.flavor-btn');
    coatingButtons = document.querySelectorAll('.coating-btn');
    addToCartBtn = document.getElementById('addToCartBtn');
    
    if (!sizeButtons.length) return;
    
    // Event listeners
    sizeButtons.forEach(btn => {
        btn.addEventListener('click', () => selectSize(btn));
    });
    
    flavorButtons.forEach(btn => {
        btn.addEventListener('click', () => selectFlavor(btn));
    });
    
    coatingButtons.forEach(btn => {
        btn.addEventListener('click', () => toggleCoating(btn));
    });
    
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', addToCart);
    }
    
    // Initial update
    updatePreview();
    updateSummary();
}

function selectSize(btn) {
    sizeButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    currentState.size = parseInt(btn.dataset.size);
    
    // Adjust coatings if exceeding new limit
    const limits = config.sizes[currentState.size].limit;
    
    Object.keys(currentState.coatings).forEach(type => {
        const limit = limits[type];
        if (currentState.coatings[type].length > limit) {
            currentState.coatings[type] = currentState.coatings[type].slice(0, limit);
        }
    });
    
    updateCoatingButtons();
    updatePreview();
    updateSummary();
}

function selectFlavor(btn) {
    flavorButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    currentState.flavor = btn.dataset.flavor;
    
    updatePreview();
    updateSummary();
}

function toggleCoating(btn) {
    const type = btn.dataset.type;
    const name = btn.dataset.name;
    const price = parseFloat(btn.dataset.price);
    const limits = config.sizes[currentState.size].limit;
    
    const currentList = currentState.coatings[type];
    const limit = limits[type];
    
    // Check if already selected
    const index = currentList.findIndex(c => c.name === name);
    
    if (index > -1) {
        // Remove
        currentList.splice(index, 1);
        btn.classList.remove('active');
    } else {
        // Check limit
        if (currentList.length >= limit) {
            // Show limit warning
            showLimitWarning(type);
            return;
        }
        
        // Add
        currentList.push({ name, price });
        btn.classList.add('active');
    }
    
    updateCoatingButtons();
    updatePreview();
    updateSummary();
}

function showLimitWarning(type) {
    const limitElement = document.getElementById(`${type}Limit`);
    if (limitElement) {
        limitElement.classList.add('warning');
        setTimeout(() => {
            limitElement.classList.remove('warning');
        }, 1000);
    }
}

function updateCoatingButtons() {
    const limits = config.sizes[currentState.size].limit;
    
    Object.keys(currentState.coatings).forEach(type => {
        const currentList = currentState.coatings[type];
        const limit = limits[type];
        
        // Update limit display
        const limitElement = document.getElementById(`${type}Limit`);
        if (limitElement) {
            limitElement.textContent = `${currentList.length}/${limit}`;
        }
        
        // Disable buttons if at limit
        coatingButtons.forEach(btn => {
            if (btn.dataset.type === type) {
                const isSelected = currentList.some(c => c.name === btn.dataset.name);
                if (!isSelected && currentList.length >= limit) {
                    btn.classList.add('disabled');
                } else {
                    btn.classList.remove('disabled');
                }
            }
        });
    });
}

function updatePreview() {
    // Update cup size
    const cup = document.getElementById('cupPreview');
    if (cup) {
        const sizes = { 300: '140px', 500: '160px', 700: '180px' };
        cup.style.height = sizes[currentState.size];
    }
    
    // Update flavor color
    const acaiBase = document.getElementById('acaiBase');
    if (acaiBase) {
        acaiBase.className = 'acai-base';
        if (currentState.flavor === 'guarana') {
            acaiBase.classList.add('sabor-guarana');
        } else if (currentState.flavor === 'zero') {
            acaiBase.classList.add('sabor-zero');
        }
    }
    
    // Update preview info
    const previewSize = document.getElementById('previewSize');
    const previewFlavor = document.getElementById('previewFlavor');
    
    if (previewSize) previewSize.textContent = `${currentState.size}ml`;
    if (previewFlavor) previewFlavor.textContent = config.flavors[currentState.flavor].name;
    
    // Update coatings preview
    const coatingsPreview = document.getElementById('coatingsPreview');
    if (coatingsPreview) {
        const allCoatings = [
            ...currentState.coatings.fruit,
            ...currentState.coatings.granola,
            ...currentState.coatings.syrup,
            ...currentState.coatings.complement
        ];
        
        coatingsPreview.innerHTML = allCoatings.map(c => `
            <div class="coating-item ${config.coatingColors[c.name] || ''}"></div>
        `).join('');
    }
}

function updateSummary() {
    // Update size and flavor
    const summarySize = document.getElementById('summarySize');
    const summaryFlavor = document.getElementById('summaryFlavor');
    
    if (summarySize) summarySize.textContent = `${currentState.size}ml`;
    if (summaryFlavor) summaryFlavor.textContent = config.flavors[currentState.flavor].name;
    
    // Update coatings list
    const coatingsList = document.getElementById('coatingsList');
    if (coatingsList) {
        const allCoatings = [
            ...currentState.coatings.fruit,
            ...currentState.coatings.granola,
            ...currentState.coatings.syrup,
            ...currentState.coatings.complement
        ];
        
        if (allCoatings.length === 0) {
            coatingsList.innerHTML = '<span class="coating-tag">Nenhuma cobertura selecionada</span>';
        } else {
            coatingsList.innerHTML = allCoatings.map(c => `
                <span class="coating-tag">${c.name}</span>
            `).join('');
        }
    }
    
    // Calculate total price
    const basePrice = config.sizes[currentState.size].price;
    const coatingsPrice = [
        ...currentState.coatings.fruit,
        ...currentState.coatings.granola,
        ...currentState.coatings.syrup,
        ...currentState.coatings.complement
    ].reduce((sum, c) => sum + c.price, 0);
    
    const totalPrice = basePrice + coatingsPrice;
    
    const totalPriceElement = document.getElementById('totalPrice');
    if (totalPriceElement) {
        totalPriceElement.textContent = `R$ ${totalPrice.toFixed(2).replace('.', ',')}`;
    }
}

function addToCart() {
    const allCoatings = [
        ...currentState.coatings.fruit,
        ...currentState.coatings.granola,
        ...currentState.coatings.syrup,
        ...currentState.coatings.complement
    ];
    
    const basePrice = config.sizes[currentState.size].price;
    const coatingsPrice = allCoatings.reduce((sum, c) => sum + c.price, 0);
    const totalPrice = basePrice + coatingsPrice;
    
    const product = {
        id: Date.now(),
        name: `Açaí ${currentState.size}ml`,
        flavor: config.flavors[currentState.flavor].name,
        size: currentState.size,
        coatings: allCoatings.map(c => c.name),
        basePrice: basePrice,
        coatingsPrice: coatingsPrice,
        totalPrice: totalPrice,
        quantity: 1
    };
    
    // Add to cart (stored in localStorage)
    addToCartStorage(product);
    
    // Show success
    addToCartBtn.innerHTML = '<i class="fas fa-check"></i> Adicionado!';
    addToCartBtn.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
    
    setTimeout(() => {
        addToCartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Adicionar ao Carrinho';
        addToCartBtn.style.background = '';
    }, 2000);
    
    // Update cart count
    updateCartDisplay();
}

function addToCartStorage(product) {
    let cart = JSON.parse(localStorage.getItem('acaiCart') || '[]');
    cart.push(product);
    localStorage.setItem('acaiCart', JSON.stringify(cart));
}

function updateCartDisplay() {
    const cart = JSON.parse(localStorage.getItem('acaiCart') || '[]');
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = cart.length;
    }
}

