/**
 * Mostrar loading mejorado con mejor diseño
 */
function showLoading(message = 'Procesando...') {
    let loadingModal = document.getElementById('loading-modal');
    
    if (!loadingModal) {
        loadingModal = document.createElement('div');
        loadingModal.id = 'loading-modal';
        loadingModal.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm';
        loadingModal.innerHTML = `
            <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 text-center max-w-sm w-full mx-4 border border-gray-600 shadow-2xl">
                <!-- Spinner mejorado -->
                <div class="relative mb-6">
                    <div class="animate-spin rounded-full h-16 w-16 border-4 border-gray-600 border-t-blue-500 mx-auto"></div>
                    <div class="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-blue-400 animate-pulse mx-auto"></div>
                </div>
                
                <!-- Mensaje -->
                <h3 id="loading-message" class="text-white text-lg font-semibold mb-2"></h3>
                <p class="text-gray-400 text-sm">Por favor espera un momento...</p>
                
                <!-- Barra de progreso animada -->
                <div class="mt-4 w-full bg-gray-700 rounded-full h-1 overflow-hidden">
                    <div class="bg-gradient-to-r from-blue-500 to-green-500 h-1 rounded-full animate-pulse"></div>
                </div>
            </div>
        `;
        document.body.appendChild(loadingModal);
    } else {
        document.getElementById('loading-message').textContent = message;
        loadingModal.classList.remove('hidden');
    }
    
    // Actualizar mensaje
    document.getElementById('loading-message').textContent = message;
}

/**
 * Ocultar loading con animación
 */
function hideLoading() {
    const loadingModal = document.getElementById('loading-modal');
    if (loadingModal) {
        loadingModal.style.opacity = '0';
        loadingModal.style.transform = 'scale(0.95)';
        setTimeout(() => {
            loadingModal.classList.add('hidden');
            loadingModal.style.opacity = '1';
            loadingModal.style.transform = 'scale(1)';
        }, 300);
    }
}

/**
 * Sistema de toast mejorado con mejor diseño y animaciones
 */
function showToast(title, message, type = 'info', duration = 5000) {
    let toastContainer = document.getElementById('toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full';
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    const toastId = 'toast-' + Date.now();
    toast.id = toastId;
    
    // Configuración por tipo
    const config = {
        success: {
            icon: 'fas fa-check-circle',
            iconColor: 'text-green-400',
            bgGradient: 'from-green-500/20 to-emerald-500/20',
            borderColor: 'border-green-500/50',
            shadowColor: 'shadow-green-500/20'
        },
        error: {
            icon: 'fas fa-exclamation-circle',
            iconColor: 'text-red-400',
            bgGradient: 'from-red-500/20 to-rose-500/20',
            borderColor: 'border-red-500/50',
            shadowColor: 'shadow-red-500/20'
        },
        warning: {
            icon: 'fas fa-exclamation-triangle',
            iconColor: 'text-yellow-400',
            bgGradient: 'from-yellow-500/20 to-amber-500/20',
            borderColor: 'border-yellow-500/50',
            shadowColor: 'shadow-yellow-500/20'
        },
        info: {
            icon: 'fas fa-info-circle',
            iconColor: 'text-blue-400',
            bgGradient: 'from-blue-500/20 to-cyan-500/20',
            borderColor: 'border-blue-500/50',
            shadowColor: 'shadow-blue-500/20'
        }
    };
    
    const currentConfig = config[type] || config.info;
    
    toast.className = `
        transform transition-all duration-500 ease-out translate-x-full opacity-0
        bg-gradient-to-r ${currentConfig.bgGradient} backdrop-blur-md
        border ${currentConfig.borderColor} rounded-xl shadow-xl ${currentConfig.shadowColor}
        overflow-hidden relative
    `;
    
    toast.innerHTML = `
        <!-- Barra de progreso -->
        <div class="absolute top-0 left-0 h-1 bg-gradient-to-r ${currentConfig.bgGradient.replace('/20', '')} transition-all duration-${duration} ease-linear toast-progress"></div>
        
        <!-- Contenido -->
        <div class="p-4 bg-gray-800/90 backdrop-blur-sm">
            <div class="flex items-start space-x-3">
                <!-- Icono -->
                <div class="flex-shrink-0 mt-0.5">
                    <div class="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center">
                        <i class="${currentConfig.icon} ${currentConfig.iconColor} text-sm"></i>
                    </div>
                </div>
                
                <!-- Contenido del mensaje -->
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-white leading-tight">${title}</p>
                    <p class="mt-1 text-sm text-gray-300 leading-relaxed">${message}</p>
                </div>
                
                <!-- Botón cerrar -->
                <div class="flex-shrink-0">
                    <button onclick="closeToast('${toastId}')" 
                            class="text-gray-400 hover:text-white transition-colors duration-200 p-1 rounded-full hover:bg-gray-700/50">
                        <i class="fas fa-times text-xs"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Animar entrada
    setTimeout(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
        toast.classList.add('translate-x-0', 'opacity-100');
        
        // Iniciar barra de progreso
        const progressBar = toast.querySelector('.toast-progress');
        if (progressBar) {
            progressBar.style.width = '0%';
            setTimeout(() => {
                progressBar.style.width = '100%';
            }, 100);
        }
    }, 100);
    
    // Auto-cerrar
    setTimeout(() => {
        closeToast(toastId);
    }, duration);
    
    // Efecto de sonido (opcional)
    playNotificationSound(type);
}

/**
 * Cerrar toast con animación mejorada
 */
function closeToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
        toast.classList.add('translate-x-full', 'opacity-0', 'scale-95');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }
}

/**
 * Modal de confirmación mejorado
 */
function showConfirmation(title, message, callback, options = {}) {
    let confirmModal = document.getElementById('confirm-modal');
    
    const defaultOptions = {
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        type: 'warning', // warning, danger, info
        icon: 'fas fa-exclamation-triangle'
    };
    
    const config = { ...defaultOptions, ...options };
    
    if (!confirmModal) {
        confirmModal = document.createElement('div');
        confirmModal.id = 'confirm-modal';
        confirmModal.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm hidden';
        document.body.appendChild(confirmModal);
        
        // Cerrar al hacer clic fuera
        confirmModal.addEventListener('click', (e) => {
            if (e.target === confirmModal) {
                confirmModal.classList.add('hidden');
            }
        });
    }
    
    // Colores según tipo
    const typeConfig = {
        warning: {
            iconColor: 'text-yellow-400',
            bgGradient: 'from-yellow-500/10 to-amber-500/10',
            confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
            border: 'border-yellow-500/30'
        },
        danger: {
            iconColor: 'text-red-400',
            bgGradient: 'from-red-500/10 to-rose-500/10',
            confirmBg: 'bg-red-600 hover:bg-red-700',
            border: 'border-red-500/30'
        },
        info: {
            iconColor: 'text-blue-400',
            bgGradient: 'from-blue-500/10 to-cyan-500/10',
            confirmBg: 'bg-blue-600 hover:bg-blue-700',
            border: 'border-blue-500/30'
        }
    };
    
    const currentTypeConfig = typeConfig[config.type] || typeConfig.warning;
    
    confirmModal.innerHTML = `
        <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 max-w-md w-full mx-4 border ${currentTypeConfig.border} shadow-2xl transform transition-all duration-300 scale-95 opacity-0 confirm-content">
            <!-- Encabezado con icono -->
            <div class="flex items-center space-x-3 mb-4">
                <div class="w-12 h-12 rounded-full bg-gradient-to-r ${currentTypeConfig.bgGradient} flex items-center justify-center border ${currentTypeConfig.border}">
                    <i class="${config.icon} ${currentTypeConfig.iconColor} text-xl"></i>
                </div>
                <div>
                    <h3 id="confirm-title" class="text-lg font-bold text-white">${title}</h3>
                </div>
            </div>
            
            <!-- Mensaje -->
            <div class="mb-6">
                <p id="confirm-message" class="text-gray-300 leading-relaxed whitespace-pre-line">${message}</p>
            </div>
            
            <!-- Botones -->
            <div class="flex justify-end space-x-3">
                <button id="confirm-cancel" 
                        class="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105">
                    ${config.cancelText}
                </button>
                <button id="confirm-accept" 
                        class="px-6 py-2.5 ${currentTypeConfig.confirmBg} text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg">
                    ${config.confirmText}
                </button>
            </div>
        </div>
    `;
    
    // Event listeners
    const cancelBtn = confirmModal.querySelector('#confirm-cancel');
    const acceptBtn = confirmModal.querySelector('#confirm-accept');
    
    cancelBtn.addEventListener('click', () => {
        hideConfirmModal();
    });
    
    acceptBtn.addEventListener('click', () => {
        hideConfirmModal();
        callback();
    });
    
    // Mostrar modal con animación
    confirmModal.classList.remove('hidden');
    setTimeout(() => {
        const content = confirmModal.querySelector('.confirm-content');
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
    
    function hideConfirmModal() {
        const content = confirmModal.querySelector('.confirm-content');
        content.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            confirmModal.classList.add('hidden');
        }, 300);
    }
}

/**
 * Modal de detalles mejorado
 */
function mostrarModalDetalle(titulo, contenido) {
    let modal = document.getElementById('detalle-modal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'detalle-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm hidden p-4';
        modal.innerHTML = `
            <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-gray-600 shadow-2xl transform transition-all duration-300 scale-95 opacity-0 modal-content">
                <!-- Header -->
                <div class="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4 border-b border-gray-600">
                    <div class="flex justify-between items-center">
                        <h3 id="modal-titulo" class="text-xl font-bold text-white flex items-center">
                            <i class="fas fa-info-circle text-blue-400 mr-2"></i>
                            <span></span>
                        </h3>
                        <button onclick="cerrarModalDetalle()" 
                                class="text-gray-400 hover:text-white transition-colors duration-200 p-2 rounded-full hover:bg-gray-600/50">
                            <i class="fas fa-times text-lg"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Contenido -->
                <div class="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                    <div id="modal-contenido" class="text-gray-300"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Cerrar al hacer clic fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                cerrarModalDetalle();
            }
        });
    }
    
    document.getElementById('modal-titulo').querySelector('span').textContent = titulo;
    document.getElementById('modal-contenido').innerHTML = contenido;
    
    // Mostrar con animación
    modal.classList.remove('hidden');
    setTimeout(() => {
        const content = modal.querySelector('.modal-content');
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
}

/**
 * Cerrar modal de detalles con animación
 */
function cerrarModalDetalle() {
    const modal = document.getElementById('detalle-modal');
    if (modal) {
        const content = modal.querySelector('.modal-content');
        content.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
}

/**
 * Sonidos de notificación (opcional)
 */
function playNotificationSound(type) {
    // Solo si el usuario quiere sonidos (puedes agregar una configuración)
    const soundEnabled = false; // Cambiar a true si quieres sonidos
    
    if (!soundEnabled) return;
    
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Frecuencias según tipo
        const frequencies = {
            success: 800,
            error: 400,
            warning: 600,
            info: 700
        };
        
        oscillator.frequency.value = frequencies[type] || 700;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        // Silenciar errores de audio
    }
}

/**
 * Función helper para mostrar notificaciones específicas de EcoTrak
 */
function showEcoTrakNotification(type, title, message, options = {}) {
    const ecoIcons = {
        recycle: 'fas fa-recycle',
        truck: 'fas fa-truck',
        save: 'fas fa-save',
        delete: 'fas fa-trash-alt',
        export: 'fas fa-download'
    };
    
    // Si se especifica un tipo de EcoTrak, usar su icono
    if (options.ecoType && ecoIcons[options.ecoType]) {
        // Mostrar toast personalizado con icono específico
        showToast(`♻️ ${title}`, message, type, options.duration);
    } else {
        showToast(title, message, type, options.duration);
    }
}

// ===========================================
// EXPORTAR FUNCIONES MEJORADAS
// ===========================================

// Reemplazar las funciones globales
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showToast = showToast;
window.closeToast = closeToast;
window.showConfirmation = showConfirmation;
window.mostrarModalDetalle = mostrarModalDetalle;
window.cerrarModalDetalle = cerrarModalDetalle;
window.showEcoTrakNotification = showEcoTrakNotification;

/**
 * Mostrar notificación de nuevo registro con detalles
 */
function mostrarNotificacionNuevoRegistro(registro) {
    const tipoIcon = getTipoIcon(registro.Tipo);
    const mensaje = `${tipoIcon} ${registro.Tipo} - ${registro.Peso}kg registrado por ${registro.Persona}`;
    
    showEcoTrakNotification(
        'success',
        'Nuevo Registro Creado',
        mensaje,
        {
            ecoType: 'recycle',
            duration: 4000
        }
    );
}

/**
 * Obtener icono por tipo de material (helper para notificaciones)
 */
function getTipoIcon(tipo) {
    const icons = {
        'Plástico': '♻️',
        'Cartón': '📦', 
        'Vidrio': '🍾',
        'Metal': '🔧',
        'Otros': '📄'
    };
    return icons[tipo] || '📄';
}

// Exportar la nueva función
window.mostrarNotificacionNuevoRegistro = mostrarNotificacionNuevoRegistro;
window.getTipoIcon = getTipoIcon;

console.log('✨ Funciones adicionales de EcoTrak agregadas');

/**
 * Funciones helper faltantes
 */
function navigateToSection(section) {
    if (typeof window.navigateToSection === 'function') {
        window.navigateToSection(section);
    } else if (window.app && window.app.navigateToSection) {
        window.app.navigateToSection(section);
    }
}

function setupDateInputs() {
    if (typeof window.setupDateInputs === 'function') {
        window.setupDateInputs();
    }
}

// Exportar funciones helper
window.navigateToSection = navigateToSection;
window.setupDateInputs = setupDateInputs;

console.log('✨ Sistema de notificaciones mejorado cargado para EcoTrak');