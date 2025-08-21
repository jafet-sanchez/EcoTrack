console.log('🚀 PRELOAD.JS CARGÁNDOSE...');
const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const os = require('os');

console.log('🔧 Preload script iniciando...');

// Configuración de Excel
const EXCEL_CONFIG = {
    fileName: 'Reciclaje_Database.xlsx',
    defaultPath: path.join(os.homedir(), 'Documents'),
    sheets: {
        registros: 'Registros_Reciclaje',
        salidas: 'Salidas_Despachos'
    }
};

// Variables del servicio Excel
let currentExcelPath = null;
let excelWorkbook = null;
let isExcelLoaded = false;

// Función para verificar si XLSX está disponible
function getXLSX() {
    try {
        return require('xlsx');
    } catch (error) {
        console.error('❌ XLSX no está instalado:', error);
        return null;
    }
}

// Función para obtener fs de forma segura
function getFS() {
    try {
        return require('fs');
    } catch (error) {
        console.error('❌ No se puede acceder a fs:', error);
        return null;
    }
}

// Exponer APIs al renderer
contextBridge.exposeInMainWorld('electronAPI', {
    async initializeExcelService() {
        try {
            console.log('📊 Inicializando servicio Excel desde preload...');
            
            const XLSX = getXLSX();
            const fs = getFS();
            
            if (!XLSX) {
                return { success: false, message: 'XLSX no está instalado' };
            }
            
            if (!fs) {
                return { success: false, message: 'No se puede acceder al sistema de archivos' };
            }
            
            // Crear directorio si no existe
            const dir = EXCEL_CONFIG.defaultPath;
            if (!fs.existsSync(dir)) {
                console.log('📁 Creando directorio:', dir);
                fs.mkdirSync(dir, { recursive: true });
            }
            
            const defaultFilePath = path.join(EXCEL_CONFIG.defaultPath, EXCEL_CONFIG.fileName);
            console.log('📁 Buscando archivo en:', defaultFilePath);
            
            // Verificar si el archivo existe
            if (fs.existsSync(defaultFilePath)) {
                console.log('📄 Archivo Excel encontrado, cargando...');
                try {
                    excelWorkbook = XLSX.readFile(defaultFilePath);
                    currentExcelPath = defaultFilePath;
                    isExcelLoaded = true;
                    console.log('✅ Excel cargado correctamente');
                    return { success: true, message: 'Excel cargado correctamente' };
                } catch (readError) {
                    console.error('❌ Error leyendo archivo Excel:', readError);
                    return { success: false, message: 'Error leyendo archivo Excel: ' + readError.message };
                }
            } else {
                console.log('📝 Archivo no existe, creando nueva base de datos...');
                
                try {
                    // Crear nuevo workbook
                    const workbook = XLSX.utils.book_new();
                    
                    // Crear hojas con headers
                    const registrosHeaders = [['ID', 'Tipo', 'Peso', 'Fecha_Registro', 'Persona', 'Estado', 'Observaciones']];
                    const salidasHeaders = [['ID_Salida', 'ID_Registro', 'Tipo', 'Peso', 'Fecha_Despacho', 'Persona_Autoriza', 'Observaciones']];
                    
                    const registrosSheet = XLSX.utils.aoa_to_sheet(registrosHeaders);
                    const salidasSheet = XLSX.utils.aoa_to_sheet(salidasHeaders);
                    
                    XLSX.utils.book_append_sheet(workbook, registrosSheet, EXCEL_CONFIG.sheets.registros);
                    XLSX.utils.book_append_sheet(workbook, salidasSheet, EXCEL_CONFIG.sheets.salidas);
                    
                    // Guardar archivo
                    console.log('💾 Guardando nuevo archivo Excel...');
                    XLSX.writeFile(workbook, defaultFilePath);
                    
                    currentExcelPath = defaultFilePath;
                    excelWorkbook = workbook;
                    isExcelLoaded = true;
                    
                    console.log('✅ Nueva base de datos Excel creada');
                    return { success: true, message: 'Nueva base de datos Excel creada exitosamente' };
                    
                } catch (createError) {
                    console.error('❌ Error creando archivo Excel:', createError);
                    return { success: false, message: 'Error creando archivo Excel: ' + createError.message };
                }
            }
        } catch (error) {
            console.error('❌ Error general en initializeExcelService:', error);
            return { success: false, message: 'Error general: ' + error.message };
        }
    },

    async saveNewRegistro(registroData) {
        try {
            console.log('💾 Guardando registro:', registroData.ID);
            
            if (!isExcelLoaded || !excelWorkbook) {
                console.warn('⚠️ Excel no está cargado');
                return { success: false, message: 'Excel no está cargado' };
            }

            const XLSX = getXLSX();
            if (!XLSX) {
                return { success: false, message: 'XLSX no disponible' };
            }
            
            // Obtener hoja de registros
            let registrosSheet = excelWorkbook.Sheets[EXCEL_CONFIG.sheets.registros];
            if (!registrosSheet) {
                console.error('❌ Hoja de registros no encontrada');
                return { success: false, message: 'Hoja de registros no encontrada' };
            }
            
            // Convertir registro a array
            const registroArray = [
                registroData.ID,
                registroData.Tipo,
                registroData.Peso,
                registroData.Fecha_Registro,
                registroData.Persona,
                registroData.Estado,
                registroData.Observaciones || ''
            ];
            
            // Obtener datos actuales y agregar nueva fila
            const currentData = XLSX.utils.sheet_to_json(registrosSheet, { header: 1 });
            currentData.push(registroArray);
            
            // Recrear hoja
            registrosSheet = XLSX.utils.aoa_to_sheet(currentData);
            excelWorkbook.Sheets[EXCEL_CONFIG.sheets.registros] = registrosSheet;
            
            // Guardar archivo
            XLSX.writeFile(excelWorkbook, currentExcelPath);
            
            console.log('✅ Registro guardado en Excel:', registroData.ID);
            return { success: true, message: 'Registro guardado en Excel' };
            
        } catch (error) {
            console.error('❌ Error guardando registro en preload:', error);
            return { success: false, message: 'Error guardando: ' + error.message };
        }
    },

    async procesarSalidaCompleta(registrosIds, salidaData) {
        try {
            console.log('📤 Procesando salida:', salidaData.ID_Salida);
            
            if (!isExcelLoaded || !excelWorkbook) {
                console.warn('⚠️ Excel no está cargado');
                return { success: false, message: 'Excel no está cargado' };
            }

            const XLSX = getXLSX();
            const fs = getFS();

            if (!XLSX || !fs) {
                return { success: false, message: 'XLSX no disponible' };
            }
            
            // Actualizar estados en registros
            let registrosSheet = excelWorkbook.Sheets[EXCEL_CONFIG.sheets.registros];
            const registrosArray = XLSX.utils.sheet_to_json(registrosSheet, { header: 1 });
            
            for (let i = 1; i < registrosArray.length; i++) {
                if (registrosIds.includes(registrosArray[i][0])) {
                    registrosArray[i][5] = 'Despachado'; // Columna Estado
                }
            }
            
            // Recrear hoja de registros
            registrosSheet = XLSX.utils.aoa_to_sheet(registrosArray);
            excelWorkbook.Sheets[EXCEL_CONFIG.sheets.registros] = registrosSheet;
            
            // Procesar salidas
            let salidasSheet = excelWorkbook.Sheets[EXCEL_CONFIG.sheets.salidas];
            if (!salidasSheet) {
                console.log('📝 Creando hoja de salidas...');
                const salidasHeaders = [['ID_Salida', 'ID_Registro', 'Tipo', 'Peso', 'Fecha_Despacho', 'Persona_Autoriza', 'Observaciones']];
                salidasSheet = XLSX.utils.aoa_to_sheet(salidasHeaders);
                excelWorkbook.Sheets[EXCEL_CONFIG.sheets.salidas] = salidasSheet;
            }
            
            const currentSalidasData = XLSX.utils.sheet_to_json(salidasSheet, { header: 1 });
            
            // Expandir salida grupal
            if (salidaData.Detalle_Grupos && salidaData.Detalle_Grupos.length > 0) {
            salidaData.Detalle_Grupos.forEach(grupo => {
                if (grupo.ids && Array.isArray(grupo.ids)) {
                    grupo.ids.forEach(registroId => {
                        // Buscar el registro para obtener sus datos completos
                        const registro = registrosArray.find(r => r[0] === registroId);
                        if (registro) {
                            const salidaArray = [
                                salidaData.ID_Salida,
                                registroId,
                                grupo.tipo,
                                (grupo.peso / grupo.ids.length).toFixed(2),
                                salidaData.Fecha_Despacho,
                                salidaData.Persona_Autoriza,
                                salidaData.Observaciones || ''
                            ];
                            currentSalidasData.push(salidaArray);
                        }
                    });
                }
            });
        } else {
            console.warn('⚠️ No hay Detalle_Grupos en la salida');
        }
            
            
         // Recrear hoja de salidas
        salidasSheet = XLSX.utils.aoa_to_sheet(currentSalidasData);
        excelWorkbook.Sheets[EXCEL_CONFIG.sheets.salidas] = salidasSheet;
            
        // Guardar archivo
        XLSX.writeFile(excelWorkbook, currentExcelPath);
            
        console.log('✅ Salida procesada en Excel:', salidaData.ID_Salida);
        return { success: true, message: 'Salida procesada correctamente' };
            
        } catch (error) {
            console.error('❌ Error procesando salida en preload:', error);
            return { success: false, message: 'Error procesando salida: ' + error.message };
        }
    },

    
    async procesarSalidaConParciales(datos) {
      try {
        console.log('📤 Procesando salida con parciales:', datos);
        
        if (!isExcelLoaded || !excelWorkbook) {
            return { success: false, message: 'Excel no está cargado' };
        }

        const XLSX = getXLSX();
        if (!XLSX) {
            return { success: false, message: 'XLSX no disponible' };
        }
        
        const { salida, registrosModificados, registrosParcialesInfo } = datos;
        
        // IMPORTANTE: NO MODIFICAR LA HOJA DE REGISTROS
        // Solo actualizar el ESTADO, NO el peso
        let registrosSheet = excelWorkbook.Sheets[EXCEL_CONFIG.sheets.registros];
        const registrosArray = XLSX.utils.sheet_to_json(registrosSheet, { header: 1 });
        
        // Solo actualizar ESTADOS, no pesos
        registrosModificados.forEach(mod => {
            for (let i = 1; i < registrosArray.length; i++) {
                if (registrosArray[i][0] === mod.id) {
                    // NO MODIFICAR EL PESO 
                    // Solo actualizar el ESTADO 
                    if (mod.mantenerActivo) {
                        registrosArray[i][5] = 'Activo'; // Mantener como Activo
                    } else {
                        registrosArray[i][5] = 'Despachado'; // Marcar como Despachado
                    }
                    break;
                }
            }
        });
        
        // Recrear hoja de registros
        registrosSheet = XLSX.utils.aoa_to_sheet(registrosArray);
        excelWorkbook.Sheets[EXCEL_CONFIG.sheets.registros] = registrosSheet;
        
        // AGREGAR SALIDA - SIEMPRE
        let salidasSheet = excelWorkbook.Sheets[EXCEL_CONFIG.sheets.salidas];
        const currentSalidasData = XLSX.utils.sheet_to_json(salidasSheet, { header: 1 });
        
        // Si hay info de parciales, usar esa
        if (registrosParcialesInfo && registrosParcialesInfo.length > 0) {
            registrosParcialesInfo.forEach(info => {
                // Buscar el tipo del registro
                const registro = registrosArray.find(r => r[0] === info.id);
                const tipo = registro ? registro[1] : 'Desconocido';
                
                const salidaArray = [
                    salida.ID_Salida,
                    info.id,
                    tipo,
                    info.pesoDespachado, // Peso despachado, no el original
                    salida.Fecha_Despacho,
                    salida.Persona_Autoriza,
                    salida.Observaciones || ''
                ];
                currentSalidasData.push(salidaArray);
            });
        } else {
            // Para despachos completos normales
            salida.Detalle_Grupos.forEach(grupo => {
                grupo.ids.forEach(id => {
                    const registro = registrosArray.find(r => r[0] === id);
                    if (registro) {
                        const salidaArray = [
                            salida.ID_Salida,
                            id,
                            registro[1], // Tipo
                            grupo.peso / grupo.ids.length, // Peso promedio
                            salida.Fecha_Despacho,
                            salida.Persona_Autoriza,
                            salida.Observaciones || ''
                        ];
                        currentSalidasData.push(salidaArray);
                    }
                });
            });
        }
        
        // Recrear hoja de salidas
        salidasSheet = XLSX.utils.aoa_to_sheet(currentSalidasData);
        excelWorkbook.Sheets[EXCEL_CONFIG.sheets.salidas] = salidasSheet;
        
        // Guardar archivo
        XLSX.writeFile(excelWorkbook, currentExcelPath);
        
        console.log('✅ Salida con parciales procesada en Excel');
        return { success: true, message: 'Salida procesada correctamente' };
        
      } catch (error) {
        console.error('❌ Error procesando salida con parciales:', error);
        return { success: false, message: error.message };
      }
    },

    async loadDataFromExcel() {
       try {
           console.log('📊 Cargando datos desde Excel...');
        
           if (!isExcelLoaded || !excelWorkbook) {
                return { success: false, message: 'Excel no está cargado' };
            }

          const XLSX = getXLSX();
          if (!XLSX) {
            return { success: false, message: 'XLSX no disponible' };
          }
        
          const data = {
            registros: [],
            salidas: []
          };
        
          // Leer registros
          const registrosSheet = excelWorkbook.Sheets[EXCEL_CONFIG.sheets.registros];
          if (registrosSheet) {
              const registrosArray = XLSX.utils.sheet_to_json(registrosSheet);
              data.registros = registrosArray;
              console.log(`📊 ${registrosArray.length} registros cargados desde Excel`);
          }
        
          // Leer salidas
          const salidasSheet = excelWorkbook.Sheets[EXCEL_CONFIG.sheets.salidas];
          if (salidasSheet) {
              const salidasArray = XLSX.utils.sheet_to_json(salidasSheet);
            
            // Calcular peso despachado por cada registro
            const pesosDespachados = {};
            salidasArray.forEach(salida => {
                const idRegistro = salida.ID_Registro;
                if (!pesosDespachados[idRegistro]) {
                    pesosDespachados[idRegistro] = 0;
                }
                pesosDespachados[idRegistro] += parseFloat(salida.Peso) || 0;
            });
            
            // IMPORTANTE: NO modificar el campo Peso, solo agregar metadata
            data.registros = data.registros.map(registro => {
                const pesoDespachado = pesosDespachados[registro.ID] || 0;
                const pesoOriginal = registro.Peso;
                const pesoDisponible = Math.max(0, pesoOriginal - pesoDespachado);
                
                    
                // Mantener el peso original y agregar campos adicionales
                return {
                    ...registro,
                    PesoOriginal: pesoOriginal,
                    PesoDisponible: pesoDisponible,
                    PesoDespachado: pesoDespachado,
                    // MANTENER EL PESO ORIGINAL SIEMPRE
                    Peso: pesoOriginal,
                    // Solo cambiar estado si está completamente despachado
                    Estado: pesoDespachado >= pesoOriginal 
                    ? 'Despachado' 
                    : (registro.Estado || 'Activo')
                };
            });
            
            // Agrupar salidas por ID_Salida
            const salidasMap = new Map();
            
            salidasArray.forEach(row => {
                const idSalida = row.ID_Salida;
                
                if (!salidasMap.has(idSalida)) {
                    salidasMap.set(idSalida, {
                        ID_Salida: idSalida,
                        Fecha_Despacho: row.Fecha_Despacho || row.Fecha_Desp,
                        Persona_Autoriza: row.Persona_Autoriza || row.Persona_Aut,
                        Observaciones: row.Observaciones || '',
                        Registros_Procesados: 0,
                        Grupos_Procesados: 0,
                        Tipos_Despachados: '',
                        Detalle_Grupos: [],
                        RegistrosParciales: []
                    });
                }
                
                const salida = salidasMap.get(idSalida);
                salida.Registros_Procesados++;
                
                // Agregar info de parciales
                salida.RegistrosParciales.push({
                    id: row.ID_Registro,
                    pesoDespachado: parseFloat(row.Peso) || 0
                });
                
                // Agrupar por tipo
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
                grupo.peso += parseFloat(row.Peso) || 0;

                if (!grupo.ids.includes(row.ID_Registro)) {
                    grupo.ids.push(row.ID_Registro);
                }

                // Buscar la persona del registro original
                const registroOriginal = data.registros.find(r => r.ID === row.ID_Registro);
                if (registroOriginal && registroOriginal.Persona && !grupo.personas.includes(registroOriginal.Persona)) {
                    grupo.personas.push(registroOriginal.Persona);
                }
            });

            // Finalizar datos de cada salida
            salidasMap.forEach(salida => {
                salida.Grupos_Procesados = salida.Detalle_Grupos.length;
                salida.Tipos_Despachados = salida.Detalle_Grupos.map(g => g.tipo).join(', ');
            });
            
            data.salidas = Array.from(salidasMap.values());
            console.log(`📦 ${data.salidas.length} salidas cargadas desde Excel`);
        }
        
        console.log('✅ Datos cargados con metadata de pesos');
        return { success: true, data: data };
        
      } catch (error) {
          console.error('❌ Error cargando datos desde Excel:', error);
          return { success: false, message: error.message };
      }
    },

    async openExcelFile(filePath) {
        try {
            const XLSX = getXLSX();
            const fs = getFS();
            
            if (!XLSX || !fs) {
                return { success: false, message: 'XLSX o fs no disponible' };
            }
            
            if (fs.existsSync(filePath)) {
                excelWorkbook = XLSX.readFile(filePath);
                currentExcelPath = filePath;
                isExcelLoaded = true;
                
                console.log('✅ Archivo Excel abierto:', filePath);
                return { success: true, message: 'Archivo abierto correctamente' };
            } else {
                return { success: false, message: 'El archivo no existe' };
            }
        } catch (error) {
            console.error('❌ Error abriendo archivo:', error);
            return { success: false, message: error.message };
        }
    },
    
    // Estados
    get isExcelLoaded() { return isExcelLoaded; },
    get currentExcelPath() { return currentExcelPath; }
});

console.log('✅ Preload script configurado exitosamente');