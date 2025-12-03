document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var fechaCitaInput = document.getElementById('fechaCita');
    var horaCitaSelect = document.getElementById('horaCita'); // Referencia al <select> de la hora

    
    const API_URL = '/api/gestion'; 


    var calendar = new FullCalendar.Calendar(calendarEl, {
        
        initialView: 'timeGridWeek', // Vista semanal por horas
        slotMinTime: '09:00:00',     // Inicia la agenda a las 9 AM
        slotMaxTime: '20:00:00',     // Termina la agenda a las 8 PM
        slotDuration: '00:60:00',    
        locale: 'es',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay' 
        },
        editable: false,
        selectable: true, 
        
             select: function(info) {
            // Obtener la fecha y hora 
            const startDateTime = info.start; 
            
            // Formatear la fecha a YYYY-MM-DD
            const formattedDate = startDateTime.toISOString().split('T')[0];
            
            // Formatear la hora a HH:MM:SS
            const hours = String(startDateTime.getHours()).padStart(2, '0');
            const minutes = String(startDateTime.getMinutes()).padStart(2, '0');
            const formattedTime = `${hours}:${minutes}`;

            fechaCitaInput.value = formattedDate;
            horaCitaSelect.value = formattedTime; 
            calendar.unselect(); 
        },
           });

    calendar.render();

    //ALTA de citas
    document.getElementById('appointmentForm').addEventListener('submit', async function(event) {
        event.preventDefault(); 

        const formData = {
            nombreCompleto: document.getElementById('nombreCompleto').value,
            numeroTelefono: document.getElementById('numeroTelefono').value,
            edad: document.getElementById('edad').value,
            categoria: document.getElementById('categoria').value,
            fechaCita: document.getElementById('fechaCita').value,
            horaCita: document.getElementById('horaCita').value
        };

        console.log('--- Intentando FETCH --- Datos a enviar:', formData); 

        try {
            // Llama a /api/gestion usando el método POST
            const response = await fetch(API_URL, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert('¡Cita agendada con éxito!');
                this.reset(); // Limpiar formulario
            } else {
                alert('Error al agendar: ' + (data.message || 'Error desconocido. Verifique la consola.'));
            }

        } catch (error) {
            console.error('Error de conexión con la API:', error);
            alert('Hubo un error de conexión al agendar la cita. Asegúrate de que tu servidor Node.js/Vercel esté corriendo.');
        }
    });

    
});

//consultas

    
        document.addEventListener('DOMContentLoaded', function() {
            const citasTableBody = document.getElementById('citasTableBody');
            const citaDetails = document.getElementById('citaDetails');
            const eliminarCitaBtn = document.getElementById('eliminarCitaBtn');

            let selectedCitaId = null; 
            const API_URL = '/api/gestion'; 

            // --- Consulta (GET) ---
            async function fetchCitas() {
                citasTableBody.innerHTML = '<tr><td colspan="4">Cargando citas...</td></tr>';
                
                try {
                    
                    const response = await fetch(API_URL); 
                    
                    if (!response.ok) {
                        const errorBody = await response.json().catch(() => ({ message: 'Error desconocido del servidor.' }));
                        throw new Error(`HTTP Error ${response.status}: ${errorBody.message || 'Error al conectar.'}`);
                    }
                    const citas = await response.json();

                    citasTableBody.innerHTML = ''; 

                    if (citas.length === 0) {
                        citasTableBody.innerHTML = '<tr><td colspan="4">No hay citas agendadas.</td></tr>';
                        return;
                    }

                    citas.forEach(cita => {
                        const row = document.createElement('tr');
                        row.dataset.citaId = cita.id_cita; 
                        row.innerHTML = `
                            <td>${cita.id_cita}</td>
                            <td>${cita.nombre_paciente}</td>
                            <td>${cita.fecha_cita}</td>
                            <td>${cita.hora_cita.substring(0, 5)}</td>
                        `;
                        row.addEventListener('click', () => showCitaDetails(cita));
                        citasTableBody.appendChild(row);
                    });
                } catch (error) {
                    console.error('Error al obtener las citas:', error);
                    citasTableBody.innerHTML = `<tr><td colspan="4">Error al cargar las citas. ${error.message}</td></tr>`;
                }
            }

            // Muestra los detalles 
            function showCitaDetails(cita) {
                selectedCitaId = cita.id_cita;
                document.getElementById('detailNombre').textContent = cita.nombre_paciente;
                document.getElementById('detailEdad').textContent = `${cita.edad} años - ${cita.categoria}`;
                document.getElementById('detailTelefono').textContent = cita.numero_telefono;
                document.getElementById('detailFecha').textContent = cita.fecha_cita;
                document.getElementById('detailHora').textContent = cita.hora_cita.substring(0, 5); 

                eliminarCitaBtn.disabled = false; 
                
                
                document.querySelectorAll('.citas-table tbody tr').forEach(row => {
                    row.classList.remove('selected-row');
                });
                document.querySelector(`[data-cita-id="${cita.id_cita}"]`).classList.add('selected-row');
            }

            // --- BAJA (DELETE) ---
            eliminarCitaBtn.addEventListener('click', async function() {
                if (!selectedCitaId) return;

                if (!confirm('¿Estás seguro de que quieres eliminar esta cita?')) return;

                try {
                    
                    const response = await fetch(`${API_URL}?id=${selectedCitaId}`, {
                        method: 'DELETE' 
                    });

                    if (!response.ok) {
                        throw new Error('Error al eliminar la cita');
                    }

                    const result = await response.json();
                    if (result.success) {
                        alert('Cita eliminada con éxito.');
                        
                        
                        fetchCitas(); 
                        selectedCitaId = null;
                        eliminarCitaBtn.disabled = true;
                        // Limpiar despues d borrar
                        document.getElementById('detailNombre').textContent = '---';
                        document.getElementById('detailEdad').textContent = '---';
                        document.getElementById('detailTelefono').textContent = '---';
                        document.getElementById('detailFecha').textContent = '---';
                        document.getElementById('detailHora').textContent = '---';
                    } else {
                        alert('No se pudo eliminar la cita: ' + (result.message || 'Error desconocido.'));
                    }
                } catch (error) {
                    console.error('Error al eliminar la cita:', error);
                    alert('Hubo un error de conexión al eliminar la cita.');
                }
            });

            fetchCitas();
        });


