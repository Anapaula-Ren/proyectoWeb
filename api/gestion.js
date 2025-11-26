// api/citas.js - Endpoints consolidados para ALTA, CONSULTA y BAJA

const mysql = require('mysql2/promise');
//cacert
const caCert = process.env.MYSQL_CA_CERT; 
// 2. Si la variable existe, reemplazamos '\n' por saltos de línea reales:
const formattedCaCert = caCert ? caCert.replace(/\\n/g, '\n') : null;

// Configuración de la conexión usando Variables de Entorno de Vercel
const dbConfig = {
    
    host: process.env.DB_HOST, 
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 26245, 
    user: process.env.DB_USER,
    password: process.env.DB_PASS, // Aquí se usará el valor de Vercel
    database: process.env.DB_NAME,

    // --- LÍNEA A AÑADIR (CRUCIAL) ---
    ssl: {

            ca: formattedCaCert, // Usa el certificado formateado
        // Si el certificado es correcto, la verificación DEBERÍA ser true, pero lo dejamos así para asegurar la conexión:
        // rejectUnauthorized: false


        // Usar el certificado que obtuvimos de Vercel (o null si no existe)
       /* ca: caCert || null,
        // Mantener por si hay problemas de verificación:
        rejectUnauthorized: true // Vercel ya debería confiar en el certificado, así que lo ponemos en tru*/

        // En entornos Cloud, se requiere la bandera 'rejectUnauthorized' en false
        //rejectUnauthorized: false
    }
    // --------------------------------
};

module.exports = async (req, res) => {
    // Configuración de CORS para permitir todos los métodos necesarios
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { method } = req;
    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);
        
        // -----------------------------------------------------------------
        // 1. ALTA (CREAR) - Maneja el método POST
        // -----------------------------------------------------------------
        if (method === 'POST') {
            const data = JSON.parse(req.body); 
            const { nombreCompleto, edad, categoria, numeroTelefono, fechaCita, horaCita } = data;

            await connection.beginTransaction(); // Iniciar transacción

            // INSERTAR PACIENTE
            const [patientResult] = await connection.execute(
                'INSERT INTO pacientes (nombre_completo, edad, categoria, numero_telefono) VALUES (?, ?, ?, ?)',
                [nombreCompleto, edad, categoria, numeroTelefono]
            );
            const id_paciente = patientResult.insertId;

            // INSERTAR CITA
            await connection.execute(
                'INSERT INTO citas (id_paciente, fecha_cita, hora_cita) VALUES (?, ?, ?)',
                [id_paciente, fechaCita, horaCita]
            );

            await connection.commit();
            
            res.status(201).json({ success: true, message: 'Cita agendada con éxito.', id_cita: id_paciente });
            return;
        }

        // -----------------------------------------------------------------
        // 2. CONSULTA (LEER) y BAJA (ELIMINAR) - Se manejan por el método
        // -----------------------------------------------------------------
        
        // CONSULTA (LEER) - Maneja el método GET
        if (method === 'GET') {
            const sql = `
                SELECT c.id_cita, p.nombre_completo AS nombre_paciente, p.edad, p.categoria, p.numero_telefono, c.fecha_cita, c.hora_cita 
                FROM citas c 
                JOIN pacientes p ON c.id_paciente = p.id_paciente 
                ORDER BY c.fecha_cita DESC, c.hora_cita DESC
            `;
            const [rows] = await connection.execute(sql);
            
            res.status(200).json(rows);
            return;
        }

        // BAJA (ELIMINAR) - Maneja el método DELETE
        if (method === 'DELETE') {
            const id_cita = req.query.id;
            
            if (!id_cita) {
                res.status(400).json({ success: false, message: 'ID de cita no proporcionado.' });
                return;
            }

            const [result] = await connection.execute('DELETE FROM citas WHERE id_cita = ?', [id_cita]);

            if (result.affectedRows > 0) {
                res.status(200).json({ success: true, message: 'Cita eliminada con éxito.' });
            } else {
                res.status(404).json({ success: false, message: 'No se encontró la cita con el ID proporcionado.' });
            }
            return;
        }

        res.status(405).json({ success: false, message: 'Método no permitido o no implementado.' });

    } catch (error) {
        if (connection && method === 'POST') {
            await connection.rollback(); // Deshacer la transacción si falló el POST
        }
        console.error('Error en la API:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.', error: error.message });
    } finally {
        if (connection) {
            connection.end();
        }
    }
};