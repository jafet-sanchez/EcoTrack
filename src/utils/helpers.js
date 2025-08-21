// ===========================================
// HELPERS - FUNCIONES AUXILIARES PARA ECOTRAK
// ===========================================

/**
 * Navegar a una sección específica (función global para HTML)
 */
function navigateToSection(sectionName) {
    // Buscar la función en el contexto de app.js
    if (typeof window.app !== 'undefined' && window.app.navigateToSection) {
        return window.app.navigateToSection(sectionName);
    }
    
    // Fallback: implementación básica
    console.log(`🧭 Navegando a: ${sectionName}`);
    
    // Actualizar navegación activa
    const navLinks = document.querySelectorAll('[data-section]');
    navLinks.forEach(link => {
        link.classList.remove('bg-gray-700', 'text-white');
        link.classList.add('text-gray-300');
        
        if (link.getAttribute('data-section') === sectionName) {
            link.classList.add('bg-gray-700', 'text-white');
            link.classList.remove('text-gray-300');
        }
    });
    
    // Ocultar todas las secciones
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostrar la sección objetivo
    const targetSection = document.getElementById(`section-${sectionName}`);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Actualizar variable global si existe
        if (typeof window.currentSection !== 'undefined') {
            window.currentSection = sectionName;
        }
    }
}

/**
 * Configurar inputs de fecha con valores actuales
 */
function setupDateInputs() {
    const fechaInput = document.getElementById('fecha-reciclaje');
    if (fechaInput) {
        const hoy = new Date();
        const yyyy = hoy.getFullYear();
        const mm = (hoy.getMonth() + 1).toString().padStart(2, '0');
        const dd = hoy.getDate().toString().padStart(2, '0');
        fechaInput.value = `${yyyy}-${mm}-${dd}`;
    }
}

/**
 * Limpiar todos los filtros
 */
function clearFilters() {
    const filtroTipo = document.getElementById('filtro-tipo');
    const filtroEstado = document.getElementById('filtro-estado');
    const filtroFechaDesde = document.getElementById('filtro-fecha-desde');
    const filtroFechaHasta = document.getElementById('filtro-fecha-hasta');
    
    if (filtroTipo) filtroTipo.value = '';
    if (filtroEstado) filtroEstado.value = '';
    if (filtroFechaDesde) filtroFechaDesde.value = '';
    if (filtroFechaHasta) filtroFechaHasta.value = '';
    
    // Llamar función de carga de historial si existe
    if (typeof window.loadHistorialData === 'function') {
        window.loadHistorialData();
    }
    
    showToast('Filtros', 'Filtros limpiados', 'info');
}

/**
 * Ordenar tabla por columna
 */
function sortTable(column, order = 'asc') {
    if (!window.registrosData || !Array.isArray(window.registrosData)) {
        console.warn('No hay datos para ordenar');
        return;
    }
    
    const sortedData = [...window.registrosData].sort((a, b) => {
        let valueA = a[column];
        let valueB = b[column];
        
        // Convertir a número si es peso o ID
        if (column === 'Peso' || column === 'ID') {
            valueA = parseFloat(valueA);
            valueB = parseFloat(valueB);
        }
        
        // Convertir a fecha si es fecha
        if (column === 'Fecha_Registro') {
            valueA = new Date(valueA);
            valueB = new Date(valueB);
        }
        
        if (order === 'desc') {
            return valueB > valueA ? 1 : -1;
        }
        return valueA > valueB ? 1 : -1;
    });
    
    // Llamar función de actualización de tabla si existe
    if (typeof window.updateHistorialTable === 'function') {
        window.updateHistorialTable(sortedData);
    }
}

/**
 * Procesar un registro específico para salida
 */
function procesarRegistro(registroId) {
    console.log('📤 Procesando registro:', registroId);
    
    // Navegar a salidas
    navigateToSection('salidas');
    
    // Preseleccionar el grupo del registro después de que se cargue la sección
    setTimeout(() => {
        if (!window.registrosData) return;
        
        // Encontrar el registro y su tipo
        const registro = window.registrosData.find(r => r.ID === registroId);
        if (registro && registro.Estado === 'Activo') {
            const checkbox = document.getElementById(`grupo-${registro.Tipo.toLowerCase().replace(/\s+/g, '-')}`);
            if (checkbox) {
                checkbox.checked = true;
            }
        }
    }, 500);
}

/**
 * Mostrar detalles de un tipo específico en reportes
 */
function mostrarDetallesTipoReporte(tipo) {
    if (typeof window.mostrarDetallesTipoReporte === 'function') {
        return window.mostrarDetallesTipoReporte(tipo);
    }
    
    // Implementación básica
    showToast('Información', `Mostrando detalles de: ${tipo}`, 'info');
}

/**
 * Obtener icono por tipo de material
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

/**
 * Formatear fecha y hora para mostrar
 */
function formatDateTime(dateTimeString) {
    if (!dateTimeString) return 'N/A';
    
    try {
        const date = new Date(dateTimeString);
        return date.toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return dateTimeString;
    }
}

/**
 * Mostrar notificación de nuevo registro
 */
function mostrarNotificacionNuevoRegistro(registro) {
    const tipoIcon = getTipoIcon(registro.Tipo);
    const mensaje = `${tipoIcon} ${registro.Tipo} - ${registro.Peso}kg registrado por ${registro.Persona}`;
    
    if (typeof showToast === 'function') {
        showToast('Nuevo Registro', mensaje, 'success');
    }
}

// ===========================================
// EXPORTAR FUNCIONES GLOBALES
// ===========================================

// Hacer funciones disponibles globalmente
if (typeof window !== 'undefined') {
    window.navigateToSection = navigateToSection;
    window.setupDateInputs = setupDateInputs;
    window.clearFilters = clearFilters;
    window.sortTable = sortTable;
    window.procesarRegistro = procesarRegistro;
    window.mostrarDetallesTipoReporte = mostrarDetallesTipoReporte;
    window.getTipoIcon = getTipoIcon;
    window.formatDateTime = formatDateTime;
    window.mostrarNotificacionNuevoRegistro = mostrarNotificacionNuevoRegistro;
    
    console.log('✅ Funciones auxiliares de EcoTrak cargadas');
}

// Para uso en Node.js si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        navigateToSection,
        setupDateInputs,
        clearFilters,
        sortTable,
        procesarRegistro,
        mostrarDetallesTipoReporte,
        getTipoIcon,
        formatDateTime,
        mostrarNotificacionNuevoRegistro
    };
}