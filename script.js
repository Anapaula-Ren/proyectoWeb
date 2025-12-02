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
            //los otroas vistas
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

