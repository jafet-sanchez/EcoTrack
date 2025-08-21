// ===========================================
// SERVICIO EXCEL PARA ECOTRAK 
// ===========================================

/**
 * Configuración del servicio Excel
 */
// elimine algo aqui (tener en cuenta)

/**
 * Variables para el manejo de Excel
 */
let currentExcelPath = null;
let excelWorkbook = null;
let isExcelLoaded = false;

// ===========================================
// FUNCIONES DE UI Y UTILIDADES
// ===========================================

/**
 * Mostrar notificación toast
 */
function showToastExcel(title, message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
    
    // Integración con sistema de notificaciones si existe
    if (typeof window !== 'undefined' && window.showToast) {
        window.showToast(title, message, type);
    }
}

/**
 * Mostrar indicador de carga
 */
function showLoadingExcel(title, message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${title}:🔄 ${message}`);
    
    if (typeof window !== 'undefined' && window.showToast) {
        window.showToast(title, message, type);
    }
}

/**
 * Ocultar indicador de carga
 */
function hideLoadingExcel() {
    console.log('✅ Carga completada');
    
    if (typeof window !== 'undefined' && window.hideLoading) {
        window.hideLoading();
    }
}

/**
 * Actualizar dashboard desde Excel
 */
function updateDashboardFromExcel() {
    console.log('📊 Actualizando dashboard desde Excel...');
    
    if (typeof window !== 'undefined' && window.updateDashboard) {
        window.updateDashboard();
    }
}

/**
 * Calcular pesos por tipo para reportes
 */
function calculatePesosPorTipoReportes() {
    const pesosPorTipo = {};
    
    // Usar los datos globales de app.js
    const registros = window.registrosData || [];
    
    registros.forEach(registro => {
        if (!pesosPorTipo[registro.Tipo]) {
            pesosPorTipo[registro.Tipo] = 0;
        }
        pesosPorTipo[registro.Tipo] += registro.Peso;
    });
    
    return pesosPorTipo;
}

/**
 * Cargar datos de reportes
 */
function loadReportesDataExcel() {
    console.log('📊 Cargando datos de reportes desde Excel...');
    
    if (typeof window !== 'undefined' && window.loadReportesData) {
        window.loadReportesData();
    }
}

/**
 * Cargar datos de historial
 */
function loadHistorialDataExcel() {
    console.log('📜 Cargando datos de historial desde Excel...');
    
    if (typeof window !== 'undefined' && window.loadHistorialData) {
        window.loadHistorialData();
    }
}

// ===========================================
// FUNCIONES PRINCIPALES DE EXCEL
// ===========================================

/**
 * Inicializar servicio Excel al cargar la aplicación
 */
async function initializeExcelService() {
    console.log('📊 Inicializando servicio Excel...');
    
    try {
        if (window.electronAPI) {
            const result = await window.electronAPI.initializeExcelService();
            
            if (result.success) {
                console.log('✅ Servicio Excel inicializado correctamente');
                showToastExcel('Excel', result.message, 'success');
                
                // Cargar datos existentes desde Excel
                await loadDataFromExcel();
                
                return true;
            } else {
                throw new Error(result.message);
            }
        } else {
            throw new Error('electronAPI no disponible');
        }
        
    } catch (error) {
        console.error('❌ Error inicializando Excel:', error);
        showToastExcel('Error', 'No se pudo inicializar Excel', 'error');
        
        // Crear base de datos en memoria como fallback
        initializeInMemoryData();
        return false;  // ← DEBE SER FALSE aquí
    }
}


/**
 * Crear nueva base de datos Excel
 */
async function createNewExcelDatabase() {
    try {
        const XLSX = require('xlsx');
        const fs = require('fs');
        const path = require('path');
        
        // Verificar que el directorio existe
        const dir = path.dirname(require('path').join(EXCEL_CONFIG.defaultPath, EXCEL_CONFIG.fileName));
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Crear nuevo libro de trabajo
        const workbook = XLSX.utils.book_new();
        
        // Crear hoja de Registros de Reciclaje
        const registrosHeaders = [
            ['ID', 'Tipo', 'Peso', 'Fecha_Registro', 'Persona', 'Estado', 'Observaciones']
        ];
        const registrosSheet = XLSX.utils.aoa_to_sheet(registrosHeaders);
        
        // Crear hoja de Salidas/Despachos
        const salidasHeaders = [
            ['ID_Salida', 'ID_Registro', 'Tipo', 'Peso', 'Fecha_Despacho', 'Persona_Autoriza', 'Observaciones']
        ];
        const salidasSheet = XLSX.utils.aoa_to_sheet(salidasHeaders);
        
        // Agregar hojas al libro
        XLSX.utils.book_append_sheet(workbook, registrosSheet, EXCEL_CONFIG.sheets.registros);
        XLSX.utils.book_append_sheet(workbook, salidasSheet, EXCEL_CONFIG.sheets.salidas);
        
        // Guardar archivo
        const defaultPath = require('path').join(EXCEL_CONFIG.defaultPath, EXCEL_CONFIG.fileName);
        XLSX.writeFile(workbook, defaultPath);
        
        currentExcelPath = defaultPath;
        excelWorkbook = workbook;
        isExcelLoaded = true;
        
        console.log('✅ Nueva base de datos Excel creada:', defaultPath);
        
        // Cargar datos iniciales de ejemplo
        await addInitialSampleData();
        
    } catch (error) {
        console.error('❌ Error creando base de datos Excel:', error);
        throw error;
    }
}

/**
 * Cargar base de datos Excel existente
 */
async function loadExcelDatabase(filePath) {
    try {
        const XLSX = require('xlsx');
        
        console.log('📖 Cargando base de datos desde:', filePath);
        
        // Leer archivo Excel
        excelWorkbook = XLSX.readFile(filePath);
        currentExcelPath = filePath;
        isExcelLoaded = true;
        
        // Cargar datos en memoria
        await loadDataFromExcel();
        
        console.log('✅ Base de datos Excel cargada exitosamente');
        
    } catch (error) {
        console.error('❌ Error cargando base de datos Excel:', error);
        throw error;
    }
}

/**
 * Abrir base de datos desde archivo
 */
async function openDatabase(filePath) {
    console.log('📁 Abrir base de datos:', filePath);
    
    try {
        showLoadingExcel('Cargando base de datos Excel...');
        
        await loadExcelDatabase(filePath);
        
        hideLoadingExcel();
        showToastExcel('Éxito', `Base de datos cargada: ${require('path').basename(filePath)}`, 'success');
        
        // Actualizar interfaz
        updateDashboardFromExcel();
        
    } catch (error) {
        hideLoadingExcel();
        console.error('❌ Error abriendo base de datos:', error);
        showToastExcel('Error', 'No se pudo abrir la base de datos', 'error');
    }
}

/**
 * Crear nueva base de datos (función para interfaz)
 */
async function createNewDatabase() {
    console.log('📁 Crear nueva base de datos');
    
    try {
        showLoadingExcel('Creando nueva base de datos Excel...');
        
        // Limpiar datos actuales en app.js
        if (window.registrosData) window.registrosData.length = 0;
        if (window.salidasData) window.salidasData.length = 0;
        
        await createNewExcelDatabase();
        
        hideLoadingExcel();
        showToastExcel('Éxito', 'Nueva base de datos creada exitosamente', 'success');
        
        // Actualizar interfaz
        updateDashboardFromExcel();
        
    } catch (error) {
        hideLoadingExcel();
        console.error('❌ Error creando base de datos:', error);
        showToastExcel('Error', 'No se pudo crear la nueva base de datos', 'error');
    }
}

/**
 * Guardar base de datos actual
 */
async function saveDatabase() {
    console.log('💾 Guardar base de datos');
    
    if (!isExcelLoaded || !currentExcelPath) {
        showToastExcel('Advertencia', 'No hay base de datos Excel activa', 'warning');
        return;
    }
    
    try {
        showLoadingExcel('Guardando base de datos...');
        
        const XLSX = require('xlsx');
        XLSX.writeFile(excelWorkbook, currentExcelPath);
        
        hideLoadingExcel();
        showToastExcel('Éxito', 'Base de datos guardada correctamente', 'success');
        
    } catch (error) {
        hideLoadingExcel();
        console.error('❌ Error guardando:', error);
        showToastExcel('Error', 'No se pudo guardar la base de datos', 'error');
    }
}

/**
 * Guardar como nueva base de datos
 */
async function saveAsDatabase(filePath) {
    console.log('💾 Guardar como:', filePath);
    
    try {
        showLoadingExcel('Guardando base de datos como...');
        
        if (!excelWorkbook) {
            throw new Error('No hay datos para guardar');
        }
        
        const XLSX = require('xlsx');
        XLSX.writeFile(excelWorkbook, filePath);
        
        currentExcelPath = filePath;
        
        hideLoadingExcel();
        showToastExcel('Éxito', `Base de datos guardada como: ${require('path').basename(filePath)}`, 'success');
        
    } catch (error) {
        hideLoadingExcel();
        console.error('❌ Error guardando como:', error);
        showToastExcel('Error', 'No se pudo guardar la base de datos', 'error');
    }
}

/**
 * Exportar reportes a Excel 
 */
async function exportReportToExcel() {
    console.log('📊 Exportando reporte a Excel');
    
    try {
        showLoadingExcel('Generando reporte Excel...');
        
        const XLSX = require('xlsx');
        const path = require('path');
        const os = require('os');
        
        // Usar datos globales de app.js
        const registros = window.registrosData || [];
        const salidas = window.salidasData || [];
        
        // Crear nuevo libro para el reporte
        const reportWorkbook = XLSX.utils.book_new();
        
        // Hoja 1: Resumen por tipos
        const resumenData = [
            ['Tipo de Material', 'Total Registros', 'Peso Total (kg)', 'Registros Activos', 'Registros Despachados', 'Porcentaje del Total']
        ];
        
        const pesosPorTipo = calculatePesosPorTipoReportes();
        const totalPeso = Object.values(pesosPorTipo).reduce((sum, peso) => sum + peso, 0);
        
        Object.entries(pesosPorTipo).forEach(([tipo, peso]) => {
            const registrosTipo = registros.filter(r => r.Tipo === tipo);
            const activos = registrosTipo.filter(r => r.Estado === 'Activo').length;
            const despachados = registrosTipo.filter(r => r.Estado === 'Despachado').length;
            const porcentaje = totalPeso > 0 ? ((peso / totalPeso) * 100).toFixed(1) : 0;
            
            resumenData.push([
                tipo,
                registrosTipo.length,
                peso.toFixed(1),
                activos,
                despachados,
                `${porcentaje}%`
            ]);
        });
        
        // Agregar totales
        resumenData.push([
            'TOTAL',
            registros.length,
            totalPeso.toFixed(1),
            registros.filter(r => r.Estado === 'Activo').length,
            registros.filter(r => r.Estado === 'Despachado').length,
            '100%'
        ]);
        
        const resumenSheet = XLSX.utils.aoa_to_sheet(resumenData);
        XLSX.utils.book_append_sheet(reportWorkbook, resumenSheet, 'Resumen por Tipos');
        
        // Hoja 2: Registros completos
        const registrosCompletos = [
            ['ID', 'Tipo', 'Peso (kg)', 'Fecha Registro', 'Persona', 'Estado', 'Observaciones']
        ];
        
        registros.forEach(registro => {
            registrosCompletos.push([
                registro.ID,
                registro.Tipo,
                registro.Peso,
                registro.Fecha_Registro,
                registro.Persona,
                registro.Estado,
                registro.Observaciones || ''
            ]);
        });
        
        const registrosSheet = XLSX.utils.aoa_to_sheet(registrosCompletos);
        XLSX.utils.book_append_sheet(reportWorkbook, registrosSheet, 'Registros Completos');
        
        // Guardar reporte
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const reportPath = path.join(os.homedir(), 'Documents', `Reporte_EcoTrak_${timestamp}.xlsx`);
        
        XLSX.writeFile(reportWorkbook, reportPath);
        
        hideLoadingExcel();
        showToastExcel('Éxito', `Reporte exportado: ${path.basename(reportPath)}`, 'success');
        
        console.log('✅ Reporte exportado:', reportPath);
        
    } catch (error) {
        hideLoadingExcel();
        console.error('❌ Error exportando reporte:', error);
        showToastExcel('Error', 'No se pudo exportar el reporte', 'error');
    }
}

/**
 * Función de respaldo para guardar datos
 */
async function backupDatabase() {
    console.log('🔄 Creando respaldo de base de datos');
    
    try {
        if (!currentExcelPath) {
            showToastExcel('Advertencia', 'No hay base de datos activa para respaldar', 'warning');
            return;
        }
        
        const path = require('path');
        const fs = require('fs').promises;
        
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const backupPath = currentExcelPath.replace('.xlsx', `_backup_${timestamp}.xlsx`);
        
        await fs.copyFile(currentExcelPath, backupPath);
        
        showToastExcel('Éxito', `Respaldo creado: ${path.basename(backupPath)}`, 'success');
        console.log('✅ Respaldo creado:', backupPath);
        
    } catch (error) {
        console.error('❌ Error creando respaldo:', error);
        showToastExcel('Error', 'No se pudo crear el respaldo', 'error');
    }
}

/**
 * Cargar datos desde Excel a las variables globales de app.js
 */
async function loadDataFromExcel() {
    try {
        const XLSX = require('xlsx');
        
        if (!excelWorkbook) {
            throw new Error('No hay libro de Excel cargado');
        }
        
        // Cargar registros de reciclaje
        const registrosSheet = excelWorkbook.Sheets[EXCEL_CONFIG.sheets.registros];
        if (registrosSheet) {
            const registrosArray = XLSX.utils.sheet_to_json(registrosSheet);
            
            // Actualizar datos globales de app.js
            if (window.registrosData) {
                window.registrosData.length = 0;
                window.registrosData.push(...registrosArray);
                console.log(`📊 ${registrosArray.length} registros cargados desde Excel`);
            }
        }
        
        // Cargar salidas/despachos
        const salidasSheet = excelWorkbook.Sheets[EXCEL_CONFIG.sheets.salidas];
        if (salidasSheet) {
            const salidasArray = XLSX.utils.sheet_to_json(salidasSheet);
            
            // Agrupar salidas por ID_Salida
            const salidasGrouped = groupSalidasFromExcel(salidasArray);
            
            // Actualizar datos globales de app.js
            if (window.salidasData) {
                window.salidasData.length = 0;
                window.salidasData.push(...salidasGrouped);
                console.log(`📦 ${salidasGrouped.length} salidas cargadas desde Excel`);
            }
        }
        
        // Actualizar interfaz
        updateDashboardFromExcel();
        
    } catch (error) {
        console.error('❌ Error cargando datos desde Excel:', error);
        throw error;
    }
}

/**
 * Guardar registro en Excel
 */
async function saveRegistroToExcel(registro) {
    try {
        if (!isExcelLoaded || !excelWorkbook) {
            console.warn('⚠️ Excel no está cargado, guardando solo en memoria');
            return;
        }
        
        const XLSX = require('xlsx');
        
        // Obtener hoja de registros
        let registrosSheet = excelWorkbook.Sheets[EXCEL_CONFIG.sheets.registros];
        
        // Convertir registro a array para agregar
        const registroArray = [
            registro.ID,
            registro.Tipo,
            registro.Peso,
            registro.Fecha_Registro,
            registro.Persona,
            registro.Estado,
            registro.Observaciones || ''
        ];
        
        // Agregar fila a la hoja
        const currentData = XLSX.utils.sheet_to_json(registrosSheet, { header: 1 });
        currentData.push(registroArray);
        
        // Recrear hoja con nuevos datos
        registrosSheet = XLSX.utils.aoa_to_sheet(currentData);
        excelWorkbook.Sheets[EXCEL_CONFIG.sheets.registros] = registrosSheet;
        
        // Guardar archivo
        XLSX.writeFile(excelWorkbook, currentExcelPath);
        
        console.log('💾 Registro guardado en Excel:', registro.ID);
        
    } catch (error) {
        console.error('❌ Error guardando registro en Excel:', error);
        showToastExcel('Error', 'No se pudo guardar en Excel', 'error');
    }
}

/**
 * Guardar salida en Excel 
 */
async function saveSalidaToExcel(salida) {
    try {
        if (!isExcelLoaded || !excelWorkbook) {
            console.warn('⚠️ Excel no está cargado, guardando solo en memoria');
            return;
        }
        
        const XLSX = require('xlsx');
        
        // Obtener hoja de salidas
        let salidasSheet = excelWorkbook.Sheets[EXCEL_CONFIG.sheets.salidas];
        const currentSalidasData = XLSX.utils.sheet_to_json(salidasSheet, { header: 1 });
        
        // Usar datos globales de app.js
        const registros = window.registrosData || [];
        
        // Expandir salida grupal a registros individuales para Excel
        if (salida.Detalle_Grupos && salida.Detalle_Grupos.length > 0) {
            // Salida grupal - crear una fila por cada registro
            salida.Detalle_Grupos.forEach(grupo => {
                grupo.ids.forEach(registroId => {
                    const registro = registros.find(r => r.ID === registroId);
                    if (registro) {
                        const salidaArray = [
                            salida.ID_Salida,
                            registroId,
                            registro.Tipo,
                            registro.Peso,
                            salida.Fecha_Despacho,
                            salida.Persona_Autoriza,
                            salida.Observaciones || ''
                        ];
                        currentSalidasData.push(salidaArray);
                    }
                });
            });
        } else {
            // Salida individual (compatibilidad)
            const salidaArray = [
                salida.ID_Salida,
                salida.Registros_Procesados || '',
                'Mixto',
                0,
                salida.Fecha_Despacho,
                salida.Persona_Autoriza,
                salida.Observaciones || ''
            ];
            currentSalidasData.push(salidaArray);
        }
        
        // Recrear hoja con nuevos datos
        salidasSheet = XLSX.utils.aoa_to_sheet(currentSalidasData);
        excelWorkbook.Sheets[EXCEL_CONFIG.sheets.salidas] = salidasSheet;
        
        // Guardar archivo
        XLSX.writeFile(excelWorkbook, currentExcelPath);
        
        console.log('💾 Salida guardada en Excel:', salida.ID_Salida);
        
    } catch (error) {
        console.error('❌ Error guardando salida en Excel:', error);
        showToastExcel('Error', 'No se pudo guardar salida en Excel', 'error');
    }
}

/**
 * Actualizar estado de registro en Excel
 */
async function updateRegistroEstadoInExcel(registroId, nuevoEstado) {
    try {
        if (!isExcelLoaded || !excelWorkbook) {
            console.warn('⚠️ Excel no está cargado');
            return;
        }
        
        const XLSX = require('xlsx');
        
        // Obtener datos de la hoja
        const registrosSheet = excelWorkbook.Sheets[EXCEL_CONFIG.sheets.registros];
        const registrosArray = XLSX.utils.sheet_to_json(registrosSheet, { header: 1 });
        
        // Encontrar y actualizar registro
        for (let i = 1; i < registrosArray.length; i++) { // Empezar en 1 para saltar headers
            if (registrosArray[i][0] === registroId) { // Columna ID
                registrosArray[i][5] = nuevoEstado; // Columna Estado
                break;
            }
        }
        
        // Recrear hoja
        const newSheet = XLSX.utils.aoa_to_sheet(registrosArray);
        excelWorkbook.Sheets[EXCEL_CONFIG.sheets.registros] = newSheet;
        
        // Guardar archivo
        XLSX.writeFile(excelWorkbook, currentExcelPath);
        
        console.log('🔄 Estado actualizado en Excel:', registroId, '->', nuevoEstado);
        
    } catch (error) {
        console.error('❌ Error actualizando estado en Excel:', error);
    }
}

// ===========================================
// FUNCIONES DE UTILIDAD
// ===========================================

/**
 * Verificar si un archivo existe
 */
async function fileExists(filePath) {
    try {
        const fs = require('fs').promises;
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Agrupar salidas desde Excel al formato interno
 */
function groupSalidasFromExcel(salidasArray) {
    const salidasMap = new Map();
    const registros = window.registrosData || [];
    
    salidasArray.forEach(row => {
        const idSalida = row.ID_Salida;
        
        if (!salidasMap.has(idSalida)) {
            salidasMap.set(idSalida, {
                ID_Salida: idSalida,
                Fecha_Despacho: row.Fecha_Despacho,
                Persona_Autoriza: row.Persona_Autoriza,
                Observaciones: row.Observaciones,
                Registros_Procesados: 0,
                Grupos_Procesados: 0,
                Tipos_Despachados: '',
                Detalle_Grupos: []
            });
        }
        
        const salida = salidasMap.get(idSalida);
        salida.Registros_Procesados++;
        
        // Agrupar por tipo si no existe
        let grupo = salida.Detalle_Grupos.find(g => g.tipo === row.Tipo);
        if (!grupo) {
            grupo = {
                tipo: row.Tipo,
                cantidad: 0,
                peso: 0,
                ids: [],
                personas: []
            };
            salida.Detalle_Grupos.push(grupo);
        }
        
        grupo.cantidad++;
        grupo.peso += row.Peso || 0;
        grupo.ids.push(row.ID_Registro);
        
        // Agregar persona si no existe
        const persona = registros.find(r => r.ID === row.ID_Registro)?.Persona;
        if (persona && !grupo.personas.includes(persona)) {
            grupo.personas.push(persona);
        }
    });
    
    // Finalizar datos de salidas
    salidasMap.forEach(salida => {
        salida.Grupos_Procesados = salida.Detalle_Grupos.length;
        salida.Tipos_Despachados = salida.Detalle_Grupos.map(g => g.tipo).join(', ');
    });
    
    return Array.from(salidasMap.values());
}

// ===========================================
// FUNCIONES DE INTEGRACIÓN
// ===========================================

/**
 * Función mejorada para guardar nuevo registro con validación
 */
async function saveNewRegistro(registroData) {
    try {
        console.log('🔄 Intentando guardar registro:', registroData);
        
        // Verificar que window.registrosData existe
        if (!window.registrosData) {
            console.error('❌ window.registrosData no está disponible');
            window.registrosData = [];
        }
        
        // Agregar a memoria global de app.js
        window.registrosData.push(registroData);
        console.log('✅ Registro agregado a memoria');
        
        // Guardar en Excel (solo si está disponible)
        if (window.electronAPI) {
            const result = await window.electronAPI.saveNewRegistro(registroData);
            if (result.success) {
                console.log('✅ Registro guardado en Excel');
            } else {
                console.warn('⚠️ No se pudo guardar en Excel:', result.message);
            }
        } else {
            console.warn('⚠️ electronAPI no disponible, guardado solo en memoria');
        }
        
        console.log('✅ Registro guardado exitosamente:', registroData.ID);
        return true;
        
    } catch (error) {
        console.error('❌ Error detallado guardando registro:', error);
        console.error('❌ Stack trace:', error.stack);
        return false;
    }
}

/**
 * Función mejorada para procesar salida
 */
async function procesarSalidaCompleta(registrosIds, salidaData) {
    try {
        // Actualizar estados en memoria global de app.js
        if (window.registrosData) {
            registrosIds.forEach(id => {
                const registro = window.registrosData.find(r => r.ID === id);
                if (registro) {
                    registro.Estado = 'Despachado';
                }
            });
        }
        
        // Agregar salida a memoria global de app.js
        if (window.salidasData) {
            window.salidasData.push(salidaData);
        }
        
        // Procesar en Excel usando electronAPI
        if (window.electronAPI) {
            const result = await window.electronAPI.procesarSalidaCompleta(registrosIds, salidaData);
            if (result.success) {
                console.log('✅ Salida procesada en Excel');
            } else {
                console.warn('⚠️ No se pudo procesar en Excel:', result.message);
            }
        } else {
            console.warn('⚠️ electronAPI no disponible, procesado solo en memoria');
        }
        
        console.log('✅ Salida procesada:', salidaData.ID_Salida);
        return true;

    } catch (error) {
        console.error('❌ Error procesando salida:', error);
        return false;
    }
}

async function loadDataFromExcel() {
    try {
        console.log('📖 Cargando datos desde Excel...');
        
        if (window.electronAPI) {
            const result = await window.electronAPI.loadDataFromExcel();
            
            if (result.success && result.data) {
                // Actualizar datos globales
                if (window.registrosData && result.data.registros) {
                    window.registrosData.length = 0;
                    window.registrosData.push(...result.data.registros);
                    console.log(`✅ ${result.data.registros.length} registros cargados en memoria`);
                }
                
                if (window.salidasData && result.data.salidas) {
                    window.salidasData.length = 0;
                    window.salidasData.push(...result.data.salidas);
                    console.log(`✅ ${result.data.salidas.length} salidas cargadas en memoria`);
                }
                
                // Actualizar interfaz
                if (window.updateDashboard) {
                    window.updateDashboard();
                }
                if (window.currentSection === 'historial' && window.loadHistorialData) {
                     window.loadHistorialData();
                }
                if (window.currentSection === 'salidas' && window.loadSalidasData) {
                    window.loadSalidasData();
                }
                
                console.log('✅ Datos cargados desde Excel correctamente');
                return true;
            } else {
                console.warn('⚠️ No se pudieron cargar datos desde Excel');
                return false;
            }
        }
    } catch (error) {
        console.error('❌ Error cargando datos desde Excel:', error);
        return false;
    }
}
// ===========================================
// EXPORTACIONES GLOBALES PARA ELECTRON
// ===========================================

// Verificar si estamos en el contexto del renderer
if (typeof window !== 'undefined') {
    // Funciones principales
    window.initializeExcelService = initializeExcelService;
    window.openDatabase = openDatabase;
    window.createNewDatabase = createNewDatabase;
    window.saveDatabase = saveDatabase;
    window.saveAsDatabase = saveAsDatabase;
    window.saveNewRegistro = saveNewRegistro;
    window.procesarSalidaCompleta = procesarSalidaCompleta;
    
    // Funciones de reportes y respaldo
    window.exportReportToExcel = exportReportToExcel;
    window.backupDatabase = backupDatabase;
    
    // Funciones de utilidad
    window.fileExists = fileExists;
    
    // Propiedades de estado de Excel (solo lectura)
    Object.defineProperty(window, 'isExcelLoaded', {
        get: () => isExcelLoaded,
        configurable: false
    });
    
    Object.defineProperty(window, 'currentExcelPath', {
        get: () => currentExcelPath,
        configurable: false
    });
    
    console.log('✅ Integración Excel para EcoTrak Desktop cargada');
}

// Para uso en Node.js (main process)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeExcelService,
        openDatabase,
        createNewDatabase,
        saveDatabase,
        saveAsDatabase,
        exportReportToExcel,
        backupDatabase,
        saveNewRegistro,
        procesarSalidaCompleta,
        fileExists,
        // Getters para estado
        get isExcelLoaded() { return isExcelLoaded; },
        get currentExcelPath() { return currentExcelPath; }
    };
}

console.log('📊 Servicio Excel para EcoTrak Desktop cargado');