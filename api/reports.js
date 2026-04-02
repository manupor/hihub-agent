import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Directorio para archivos generados
const OUTPUT_DIR = path.join(__dirname, '../output/reports');

// Crear directorio si no existe
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * POST /api/reports/generate
 * Genera reportes Excel y PDF de una conversación de chat
 */
router.post('/generate', async (req, res) => {
    try {
        const { leadId, messages, format = 'both' } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ 
                error: 'Se requiere un array de mensajes válido' 
            });
        }

        // Generar nombre de archivo único
        const timestamp = Date.now();
        const baseFilename = `cliente_${leadId || timestamp}`;
        const excelPath = path.join(OUTPUT_DIR, `${baseFilename}.xlsx`);
        const pdfPath = path.join(OUTPUT_DIR, `${baseFilename}.pdf`);

        // Preparar datos para el script de Python
        const scriptData = {
            messages,
            leadId,
            excelPath,
            pdfPath,
            format
        };

        // Ejecutar script de Python
        const pythonProcess = spawn('python3', [
            path.join(__dirname, '../reports/generate_report.py'),
            JSON.stringify(scriptData)
        ]);

        let pythonOutput = '';
        let pythonError = '';

        pythonProcess.stdout.on('data', (data) => {
            pythonOutput += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            pythonError += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error('Error en script de Python:', pythonError);
                return res.status(500).json({ 
                    error: 'Error al generar reportes',
                    details: pythonError
                });
            }

            try {
                const result = JSON.parse(pythonOutput);
                
                // Verificar que los archivos existan
                const files = {};
                if (format === 'excel' || format === 'both') {
                    if (fs.existsSync(excelPath)) {
                        files.excel = `/api/reports/download/${path.basename(excelPath)}`;
                    }
                }
                if (format === 'pdf' || format === 'both') {
                    if (fs.existsSync(pdfPath)) {
                        files.pdf = `/api/reports/download/${path.basename(pdfPath)}`;
                    }
                }

                res.json({
                    success: true,
                    files,
                    data: result.data,
                    message: 'Reportes generados exitosamente'
                });

            } catch (parseError) {
                console.error('Error al parsear salida de Python:', parseError);
                res.status(500).json({ 
                    error: 'Error al procesar resultado',
                    details: pythonOutput
                });
            }
        });

    } catch (error) {
        console.error('Error al generar reportes:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

/**
 * GET /api/reports/download/:filename
 * Descarga un archivo generado
 */
router.get('/download/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(OUTPUT_DIR, filename);

        // Validar que el archivo existe y está en el directorio correcto
        if (!fs.existsSync(filePath) || !filePath.startsWith(OUTPUT_DIR)) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }

        // Determinar tipo de contenido
        const ext = path.extname(filename).toLowerCase();
        const contentType = ext === '.xlsx' 
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'application/pdf';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Error al descargar archivo:', error);
        res.status(500).json({ 
            error: 'Error al descargar archivo',
            details: error.message
        });
    }
});

/**
 * GET /api/reports/list
 * Lista todos los reportes generados
 */
router.get('/list', (req, res) => {
    try {
        const files = fs.readdirSync(OUTPUT_DIR)
            .filter(file => file.endsWith('.xlsx') || file.endsWith('.pdf'))
            .map(file => {
                const filePath = path.join(OUTPUT_DIR, file);
                const stats = fs.statSync(filePath);
                return {
                    filename: file,
                    size: stats.size,
                    created: stats.birthtime,
                    downloadUrl: `/api/reports/download/${file}`
                };
            })
            .sort((a, b) => b.created - a.created);

        res.json({ files });

    } catch (error) {
        console.error('Error al listar reportes:', error);
        res.status(500).json({ 
            error: 'Error al listar reportes',
            details: error.message
        });
    }
});

/**
 * DELETE /api/reports/:filename
 * Elimina un reporte generado
 */
router.delete('/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(OUTPUT_DIR, filename);

        if (!fs.existsSync(filePath) || !filePath.startsWith(OUTPUT_DIR)) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }

        fs.unlinkSync(filePath);
        res.json({ success: true, message: 'Archivo eliminado' });

    } catch (error) {
        console.error('Error al eliminar archivo:', error);
        res.status(500).json({ 
            error: 'Error al eliminar archivo',
            details: error.message
        });
    }
});

export default router;
