// --- Navegación fluida y garantizada entre Vistas ---
function cambiarVista(idVista, elementoNav) {
  document.querySelectorAll('.view').forEach(vista => {
    vista.classList.remove('active-view');
  });

  const vistaSeleccionada = document.getElementById(`vista-${idVista}`);
  if (vistaSeleccionada) {
    vistaSeleccionada.classList.add('active-view');
  }

  if (elementoNav) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    elementoNav.classList.add('active');
  }
  
  // Forzar scroll al inicio al cambiar de vista
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- Control del Bottom Sheet Contextual para la Racha ---
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

// --- Lógica para Crear Nuevos Instrumentos ---
function guardarNuevoInstrumento() {
  const input = document.getElementById('nombre-instrumento');
  if (!input) return;
  const nombre = input.value.trim();

  if (!nombre) {
    alert("Por favor, introduce un nombre para el instrumento.");
    return;
  }

  ['grid-instrumentos-home', 'grid-instrumentos-completo'].forEach(idGrid => {
    const grid = document.getElementById(idGrid);
    if (grid) {
      const botonAnadir = grid.querySelector('.card-add');
      const nuevaTarjeta = document.createElement('article');
      nuevaTarjeta.className = 'card-instrumento interactive-card';
      nuevaTarjeta.onclick = function() { cambiarVista('tareas', null); };
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
}

// --- Cronómetro de la Sesión de Estudio ---
let sesionActiva = false;
let segundosEstudio = 0;
let intervaloCronometro = null;

function iniciarSesionEstudio() {
  const btn = document.querySelector('.btn-estudio');
  const displayCronometro = document.getElementById('cronometro');

  if (!sesionActiva) {
    sesionActiva = true;
    if (btn) {
      btn.textContent = "Finalizar sesión de estudio";
      btn.style.backgroundColor = "#EF4444";
    }

    intervaloCronometro = setInterval(() => {
      segundosEstudio++;
      let horas = Math.floor(segundosEstudio / 3600);
      let minutos = Math.floor((segundosEstudio % 3600) / 60);
      let segundos = segundosEstudio % 60;

      if (displayCronometro) {
        displayCronometro.textContent = 
          String(horas).padStart(2, '0') + ":" + 
          String(minutos).padStart(2, '0') + ":" + 
          String(segundos).padStart(2, '0');
      }
    }, 1000);
  } else {
    clearInterval(intervaloCronometro);
    sesionActiva = false;
    if (btn) {
      btn.textContent = "Empezar sesión de estudio";
      btn.style.backgroundColor = "var(--primary)";
    }
    
    const minEstudiadosElem = document.getElementById('num-minutos');
    if (minEstudiadosElem) {
      let minutosActuales = parseInt(minEstudiadosElem.textContent) || 0;
      let minutosNuevos = Math.floor(segundosEstudio / 60);
      minutosActuales += minutosNuevos > 0 ? minutosNuevos : 1;
      minEstudiadosElem.textContent = minutosActuales;
    }

    segundosEstudio = 0;
    if (displayCronometro) {
      displayCronometro.textContent = "00:00:00";
    }
  }
}

// --- Metrónomo de Apoyo ---
let bpmActual = 120;
function ajustarBPM(cambio) {
  bpmActual += cambio;
  if (bpmActual < 40) bpmActual = 40;
  if (bpmActual > 240) bpmActual = 240;
  const bpmDisp = document.getElementById('bpm-display');
  if (bpmDisp) {
    bpmDisp.textContent = bpmActual + " BPM";
  }
}

function cambiarFiltroHorario(select) {
  console.log("Filtro de horario seleccionado:", select.value);
}

document.addEventListener('DOMContentLoaded', () => {
  console.log("RitmoAcade cargado. Capas táctiles y eventos operativos al 100%.");
});
