/* ========================================
   AÇAÍ PREMIUM - validation.js
   Validação de Formulários
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    initValidation();
});

function initValidation() {
    // Add real-time validation to all forms
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => validateField(input));
            input.addEventListener('input', () => clearError(input));
        });
    });
}

function validateField(input) {
    const value = input.value.trim();
    const fieldName = input.name || input.id;
    
    // Clear previous error
    clearError(input);
    
    // Check required
    if (input.hasAttribute('required') && !value) {
        showError(input, 'Este campo é obrigatório');
        return false;
    }
    
    // Check specific fields
    switch (fieldName) {
        case 'nome':
            if (value && value.length < 3) {
                showError(input, 'Nome deve ter pelo menos 3 caracteres');
                return false;
            }
            break;
            
        case 'email':
            if (value && !isValidEmail(value)) {
                showError(input, 'Digite um e-mail válido');
                return false;
            }
            break;
            
        case 'telefone':
            if (value && value.replace(/\D/g, '').length < 10) {
                showError(input, 'Digite um telefone válido');
                return false;
            }
            break;
            
        case 'cpf':
            if (value && !isValidCPF(value)) {
                showError(input, 'Digite um CPF válido');
                return false;
            }
            break;
            
        case 'cep':
            if (value && value.replace(/\D/g, '').length !== 8) {
                showError(input, 'Digite um CEP válido');
                return false;
            }
            break;
            
        case 'senha':
            if (value && value.length < 6) {
                showError(input, 'Senha deve ter pelo menos 6 caracteres');
                return false;
            }
            break;
            
        case 'confirmarSenha':
            const senha = document.getElementById('senha');
            if (value && senha && value !== senha.value) {
                showError(input, 'As senhas não conferem');
                return false;
            }
            break;
    }
    
    // Mark as valid
    input.classList.add('valid');
    return true;
}

function showError(input, message) {
    const group = input.closest('.form-group');
    if (!group) return;
    
    input.classList.add('error');
    input.classList.remove('valid');
    
    let errorElement = group.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('span');
        errorElement.className = 'error-message';
        group.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    group.classList.add('has-error');
}

function clearError(input) {
    const group = input.closest('.form-group');
    if (!group) return;
    
    input.classList.remove('error');
    group.classList.remove('has-error');
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
        return false;
    }
    
    // Validate first digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    
    let digit = 11 - (sum % 11);
    if (digit > 9) digit = 0;
    
    if (parseInt(cpf.charAt(9)) !== digit) {
        return false;
    }
    
    // Validate second digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    
    digit = 11 - (sum % 11);
    if (digit > 9) digit = 0;
    
    return parseInt(cpf.charAt(10)) === digit;
}

// Format functions
function formatPhone(value) {
    value = value.replace(/\D/g, '');
    
    if (value.length > 11) {
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

// Validate entire form
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    
    return isValid;
}

// Password strength checker
function checkPasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    return strength;
}

