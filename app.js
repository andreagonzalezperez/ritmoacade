// --- Navegación fluida entre Vistas ---
function cambiarVista(idVista, elementoNav) {
  document.querySelectorAll('.view').forEach(vista => {
    vista.classList.remove('active-view');
  });

  const vistaSeleccionada = document.getElementById(`vista-${idVista}`);
  if (vistaSeleccionada) {
    vistaSeleccionada.classList.add('active-view');
  }

  // Si pasamos elementoNav desde la barra inferior, actualizamos clases
  if (elementoNav) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    elementoNav.classList.add('active');
  }
}

// --- Control del Bottom Sheet Contextual para la Racha (Aparece por debajo) ---
function abrirRacha() {
  const modal = document.getElementById('modalRacha');
  if (modal) modal.classList.add('active');
}

function cerrarRacha() {
  const modal = document.getElementById('modalRacha');
  if (modal) modal.classList.remove('active');
}

function cerrarRachaFuera(event) {
  if (event.target.id === 'modalRacha') {
    cerrarRacha();
  }
}

// --- Control del Modal para Añadir Instrumento ---
function abrirModalInstrumento() {
  const modal = document.getElementById('modalInstrumento');
  if (modal) modal.classList.add('active');
}

function cerrarModalInstrumento() {
  const modal = document.getElementById('modalInstrumento');
  if (modal) modal.classList.remove('active');
}

function cerrarModalInstFuera(event) {
  if (event.target.id === 'modalInstrumento') {
    cerrarModalInstrumento();
  }
}

// --- Lógica para Crear Nuevos Instrumentos y Sincronizarlos ---
function guardarNuevoInstrumento() {
  const input = document.getElementById('nombre-instrumento');
  const nombre = input.value.trim();

  if (!nombre) {
    alert("Por favor, introduce un nombre para el instrumento.");
    return;
  }

  // Sincronizar en los grids de inicio y repertorio completo
  ['grid-instrumentos-home', 'grid-instrumentos-completo'].forEach(idGrid => {
    const grid = document.getElementById(idGrid);
    if (grid) {
      const botonAnadir = grid.querySelector('.card-add');
      const nuevaTarjeta = document.article ? document.createElement('article') : document.createElement('article');
      nuevaTarjeta.className = 'card-instrumento';
      nuevaTarjeta.innerHTML = `
        <span class="icono">🎵</span>
        <h4>${nombre}</h4>
        <span class="card-sub-instrumento">0 piezas</span>
      `;
      if (botonAnadir) {
        grid.insertBefore(nuevaTarjeta, botonAnadir);
      } else {
        grid.appendChild(nuevaTarjeta);
      }
    }
  });

  input.value = '';
  cerrarModalInstrumento();
  alert(`Instrumento "${nombre}" añadido correctamente.`);
}

// --- Cronómetro y Feedback Interactivo de la Sesión de Estudio ---
let sesionActiva = false;
let segundosEstudio = 0;
let intervaloCronometro = null;

function iniciarSesionEstudio() {
  const btn = document.querySelector('.btn-estudio');
  const displayCronometro = document.getElementById('cronometro');

  if (!sesionActiva) {
    sesionActiva = true;
    btn.textContent = "Finalizar sesión de estudio";
    btn.style.backgroundColor = "#EF4444"; // Rojo para indicar acción activa

    intervaloCronometro = setInterval(() => {
      segundosEstudio++;
      let horas = Math.floor(segundosEstudio / 3600);
      let minutos = Math.floor((segundosEstudio % 3600) / 60);
      let segundos = segundosEstudio % 60;

      displayCronometro.textContent = 
        String(horas).padStart(2, '0') + ":" + 
        String(minutos).padStart(2, '0') + ":" + 
        String(segundos).padStart(2, '0');
    }, 1000);
  } else {
    clearInterval(intervaloCronometro);
    sesionActiva = false;
    btn.textContent = "Empezar sesión de estudio";
    btn.style.backgroundColor = "var(--primary)";
    
    // Actualizar minutos acumulados en el dashboard principal
    const minEstudiadosElem = document.getElementById('num-minutos');
    let minutosActuales = parseInt(minEstudiadosElem.textContent) || 0;
    let minutosNuevos = Math.floor(segundosEstudio / 60);
    minutosActuales += minutosNuevos > 0 ? minutosNuevos : 1; // Mínimo 1 min si completó
    minEstudiadosElem.textContent = minutosActuales;

    segundosEstudio = 0;
    displayCronometro.textContent = "00:00:00";
    alert("¡Sesión de estudio guardada con éxito!");
  }
}

// --- Metrónomo de Apoyo ---
let bpmActual = 120;
function ajustarBPM(cambio) {
  bpmActual += cambio;
  if (bpmActual < 40) bpmActual = 40;
  if (bpmActual > 240) bpmActual = 240;
  document.getElementById('bpm-display').textContent = bpmActual + " BPM";
}

function cambiarFiltroHorario(select) {
  console.log("Filtro de horario seleccionado:", select.value);
}

document.addEventListener('DOMContentLoaded', () => {
  console.log("RitmoAcade cargado al 100% con todas las secciones, widgets y mejoras implementadas.");
});
