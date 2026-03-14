/* ========================================
   AÇAÍ PREMIUM - modal.js
   Lógica do Modal de Cadastro
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    initModal();
});

// DOM Elements
let modal, modalClose, modalTabs, registerForm, currentTab = 'register';

function initModal() {
    modal = document.getElementById('registerModal');
    modalClose = document.getElementById('modalClose');
    modalTabs = document.querySelectorAll('.modal-tab');
    registerForm = document.getElementById('registerForm');
    
    if (!modal) return;
    
    // Close modal events
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Tab switching
    modalTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.tab);
        });
    });
    
    // Form submission
    if (registerForm) {
        registerForm.addEventListener('submit', handleFormSubmit);
    }
    
    // ESC key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

function closeModal() {
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Reset form
        if (registerForm) {
            registerForm.reset();
            registerForm.classList.remove('success');
        }
        
        // Reset to register tab
        switchTab('register');
    }
}

function switchTab(tab) {
    currentTab = tab;
    
    modalTabs.forEach(t => {
        t.classList.remove('active');
        if (t.dataset.tab === tab) {
            t.classList.add('active');
        }
    });
    
    // Toggle password field
    const passwordField = document.getElementById('passwordField');
    if (passwordField) {
        if (tab === 'login') {
            passwordField.style.display = 'none';
        } else {
            passwordField.style.display = 'grid';
        }
    }
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(registerForm);
    const data = Object.fromEntries(formData.entries());
    
    // Validate form
    if (!validateForm(data)) {
        return;
    }
    
    // Simulate API call
    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="loading"></span> Processando...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        // Show success
        showSuccessMessage();
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 2000);
}

function validateForm(data) {
    let isValid = true;
    
    // Clear previous errors
    document.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('has-error');
    });
    
    // Validate required fields
    const requiredFields = ['nome', 'email', 'telefone', 'cpf', 'cep', 'endereco', 'numero', 'bairro'];
    
    if (currentTab === 'register') {
        requiredFields.push('senha', 'confirmarSenha');
    }
    
    requiredFields.forEach(field => {
        const input = document.getElementById(field);
        if (input && !input.value.trim()) {
            markFieldError(field);
            isValid = false;
        }
    });
    
    // Validate email format
    const email = document.getElementById('email');
    if (email && email.value && !isValidEmail(email.value)) {
        markFieldError('email');
        isValid = false;
    }
    
    // Validate CPF
    const cpf = document.getElementById('cpf');
    if (cpf && cpf.value && !isValidCPF(cpf.value)) {
        markFieldError('cpf');
        isValid = false;
    }
    
    // Validate password match
    if (currentTab === 'register') {
        const senha = document.getElementById('senha');
        const confirmarSenha = document.getElementById('confirmarSenha');
        
        if (senha && confirmarSenha && senha.value !== confirmarSenha.value) {
            markFieldError('confirmarSenha');
            isValid = false;
        }
        
        // Validate password length
        if (senha && senha.value && senha.value.length < 6) {
            markFieldError('senha');
            isValid = false;
        }
    }
    
    return isValid;
}

function markFieldError(fieldId) {
    const input = document.getElementById(fieldId);
    if (input) {
        const group = input.closest('.form-group');
        if (group) {
            group.classList.add('has-error');
        }
    }
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
        return false;
    }
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    
    let digit = 11 - (sum % 11);
    if (digit > 9) digit = 0;
    
    if (parseInt(cpf.charAt(9)) !== digit) {
        return false;
    }
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    
    digit = 11 - (sum % 11);
    if (digit > 9) digit = 0;
    
    return parseInt(cpf.charAt(10)) === digit;
}

function showSuccessMessage() {
    registerForm.innerHTML = `
        <div class="success-icon">
            <i class="fas fa-check"></i>
        </div>
        <h3>Pedido Confirmado!</h3>
        <p>Obrigado! Seu pedido foi realizado com sucesso. Em breve você receberá uma confirmação.</p>
    `;
    
    setTimeout(() => {
        closeModal();
    }, 3000);
}

// CEP Lookup - ViaCEP API
const cepInput = document.getElementById('cep');
if (cepInput) {
    cepInput.addEventListener('blur', async (e) => {
        const cep = e.target.value.replace(/\D/g, '');
        
        if (cep.length !== 8) {
            return;
        }
        
        const cepGroup = e.target.closest('.form-group');
        cepGroup.classList.add('loading');
        
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            
            if (!data.erro) {
                document.getElementById('endereco').value = data.logradouro || '';
                document.getElementById('bairro').value = data.bairro || '';
                
                // Trigger input events for validation
                document.getElementById('endereco').dispatchEvent(new Event('input'));
                document.getElementById('bairro').dispatchEvent(new Event('input'));
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
        }
        
        cepGroup.classList.remove('loading');
    });
}

// Format inputs on typing
document.addEventListener('input', (e) => {
    if (e.target.id === 'telefone') {
        e.target.value = formatPhone(e.target.value);
    }
    
    if (e.target.id === 'cpf') {
        e.target.value = formatCPF(e.target.value);
    }
    
    if (e.target.id === 'cep') {
        e.target.value = formatCEP(e.target.value);
    }
});

function formatPhone(value) {
    value = value.replace(/\D/g, '');
    if (value.length > 10) {
        value = value.slice(0, 11);
    }
    
    if (value.length >= 10) {
        value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (value.length >= 6) {
        value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else if (value.length >= 2) {
        value = value.replace(/(\d{2})(\d{0,4})/, '($1) $2');
    }
    
    return value;
}

function formatCPF(value) {
    value = value.replace(/\D/g, '');
    if (value.length > 11) {
        value = value.slice(0, 11);
    }
    
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    
    return value;
}

function formatCEP(value) {
    value = value.replace(/\D/g, '');
    if (value.length > 8) {
        value = value.slice(0, 8);
    }
    
    if (value.length >= 5) {
        value = value.replace(/(\d{5})(\d)/, '$1-$2');
    }
    
    return value;
}

