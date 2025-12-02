const mysql = require('mysql2/promise');

// Configuracion de la BD
const dbConfig = {
    
    host: process.env.DB_HOST, 
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 26245, 
    user: process.env.DB_USER,
    password: process.env.DB_PASS, 
    database: process.env.DB_NAME,

    
    ssl: {
           rejectUnauthorized: false
    }

    
};

module.exports = async (req, res) => {
    
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
        
        
        // 1. ALTA (CREAR) 
        
        if (method === 'POST') {
           
           const data= typeof req.body === 'string'? JSON.parse(req.body) : req.body;
             
            const { nombreCompleto, edad, categoria, numeroTelefono, fechaCita, horaCita } = data;

            await connection.beginTransaction(); // Iniciar transacción
            //no cita duplicada
            const [existingCita] = await connection.execute(
            'SELECT id_cita FROM citas WHERE fecha_cita = ? AND hora_cita = ?',
            [fechaCita, horaCita]
            );

            if (existingCita.length > 0) {
                await connection.rollback(); 
                return res.status(409).json({ success: false, message: 'La hora y fecha seleccionadas ya están ocupadas.' });
            }
            //final no cita duplicada
            // checar si el paciente ya existe
            let id_paciente;
            const [existingPatient] = await connection.execute(
                'SELECT id_paciente FROM pacientes WHERE nombre_completo = ? AND numero_telefono = ?',
                [nombreCompleto, numeroTelefono]
            );

            if (existingPatient.length > 0) {
                
                id_paciente = existingPatient[0].id_paciente;
            } else {
                
                const [patientResult] = await connection.execute(
                    'INSERT INTO pacientes (nombre_completo, edad, categoria, numero_telefono) VALUES (?, ?, ?, ?)',
                    [nombreCompleto, edad, categoria, numeroTelefono]
                );
                id_paciente = patientResult.insertId;
            }
            //final para checar si el paciente ya existe
          
            // INSERTAR CITA
            await connection.execute(
                'INSERT INTO citas (id_paciente, fecha_cita, hora_cita) VALUES (?, ?, ?)',
                [id_paciente, fechaCita, horaCita]
            );

            await connection.commit();
            
            res.status(201).json({ success: true, message: 'Cita agendada con éxito.', id_cita: id_paciente });
            return;
        }

        
        // CONSULTA (LEER)
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

        // BAJA (ELIMINAR) 
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