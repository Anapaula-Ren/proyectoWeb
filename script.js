document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var fechaCitaInput = document.getElementById('fechaCita');
    var horaCitaSelect = document.getElementById('horaCita'); // Referencia al <select> de la hora

    
    const API_URL = '/api/gestion'; 
    // Verificación de existencia del elemento DOM
   /* if (!calendarEl) {
        console.error("No se encontró el elemento con ID 'calendar'.");
        return;
    }*/

    var calendar = new FullCalendar.Calendar(calendarEl, {
        // --- Cambios Cruciales ---
        initialView: 'timeGridWeek', // Vista inicial: semanal por horas
        slotMinTime: '09:00:00',     // Inicia la agenda a las 9 AM
        slotMaxTime: '20:00:00',     // Termina la agenda a las 8 PM
        slotDuration: '00:60:00',    // Intervalos de 60 minutos
        // -------------------------

        locale: 'es',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            // Agregamos la vista semanal y diaria para que el usuario pueda ver las horas
            right: 'dayGridMonth,timeGridWeek,timeGridDay' 
        },
        editable: false,
        selectable: true, 
        
        // La función 'select' ahora devolverá la fecha Y la hora de inicio y fin
        select: function(info) {
            // Obtener la fecha y hora seleccionada
            const startDateTime = info.start; // Objeto Date/Time
            
            // Formatear la fecha a YYYY-MM-DD
            const formattedDate = startDateTime.toISOString().split('T')[0];
            
            // Formatear la hora a HH:MM:SS
            // getHours() devuelve 0-23. getMinutes() devuelve 0-59.
            const hours = String(startDateTime.getHours()).padStart(2, '0');
            const minutes = String(startDateTime.getMinutes()).padStart(2, '0');
            const formattedTime = `${hours}:${minutes}`;

            // 1. Asignar la fecha al input
            fechaCitaInput.value = formattedDate;
            
            // 2. Asignar la hora al select del formulario
            // NOTA: Tu <select id="horaCita"> debe tener la opción con el valor HH:MM
            horaCitaSelect.value = formattedTime; 
            
            calendar.unselect(); // Opcional: Deseleccionar el slot
        },
        
        events: [
            // Citas de ejemplo...
        ]
    });

    calendar.render();

    // --- NUEVO CÓDIGO 2: LÓGICA DE ENVÍO DEL FORMULARIO ACTUALIZADA (ALTA) ---
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

        /*if (!formData.fechaCita || !formData.horaCita) {
             alert('Por favor, selecciona una fecha y hora válidas en el calendario.');
             return;
        }*/
       console.log('--- Intentando FETCH --- Datos a enviar:', formData); // NUEVA LÍNEA DE DIAGNÓSTICO

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
    // ------------------------------------------------------------------------
});

/*document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var fechaCitaInput = document.getElementById('fechaCita');
    var horaCitaSelect = document.getElementById('horaCita'); // Referencia al <select> de la hora

    // Verificación de existencia del elemento DOM
    if (!calendarEl) {
        console.error("No se encontró el elemento con ID 'calendar'.");
        return;
    }

    var calendar = new FullCalendar.Calendar(calendarEl, {
        // --- Cambios Cruciales ---
        initialView: 'timeGridWeek', // Vista inicial: semanal por horas
        slotMinTime: '09:00:00',     // Inicia la agenda a las 9 AM
        slotMaxTime: '20:00:00',     // Termina la agenda a las 8 PM
        slotDuration: '00:60:00',    // Intervalos de 60 minutos
        // -------------------------

        locale: 'es',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            // Agregamos la vista semanal y diaria para que el usuario pueda ver las horas
            right: 'dayGridMonth,timeGridWeek,timeGridDay' 
        },
        editable: false,
        selectable: true, 
        
        // La función 'select' ahora devolverá la fecha Y la hora de inicio y fin
        select: function(info) {
            // Obtener la fecha y hora seleccionada
            const startDateTime = info.start; // Objeto Date/Time
            
            // Formatear la fecha a YYYY-MM-DD
            const formattedDate = startDateTime.toISOString().split('T')[0];
            
            // Formatear la hora a HH:MM:SS
            // getHours() devuelve 0-23. getMinutes() devuelve 0-59.
            const hours = String(startDateTime.getHours()).padStart(2, '0');
            const minutes = String(startDateTime.getMinutes()).padStart(2, '0');
            const formattedTime = `${hours}:${minutes}`;

            // 1. Asignar la fecha al input
            fechaCitaInput.value = formattedDate;
            
            // 2. Asignar la hora al select del formulario
            // NOTA: Tu <select id="horaCita"> debe tener la opción con el valor HH:MM
            horaCitaSelect.value = formattedTime; 
            
            calendar.unselect(); // Opcional: Deseleccionar el slot
        },
        
          });

    calendar.render();

    // ... (El resto de la lógica del formulario se mantiene)
});*/




