document.addEventListener('DOMContentLoaded', () => {
  console.log("RitmoAcade inicializado con navegación inferior blindada.");

  // --- Cambio de Vistas mediante Barra de Navegación (IDs directos) ---
  const navHoy = document.getElementById('nav-hoy');
  const navHorario = document.getElementById('nav-horario');
  const navEstudio = document.getElementById('nav-estudio');
  const navRepertorio = document.getElementById('nav-repertorio');
  const navMas = document.getElementById('nav-mas');

  if (navHoy) navHoy.addEventListener('click', () => cambiarVista('hoy', navHoy));
  if (navHorario) navHorario.addEventListener('click', () => cambiarVista('horario', navHorario));
  if (navEstudio) navEstudio.addEventListener('click', () => cambiarVista('estudio', navEstudio));
  if (navRepertorio) navRepertorio.addEventListener('click', () => cambiarVista('repertorio', navRepertorio));
  if (navMas) navMas.addEventListener('click', () => cambiarVista('mas', navMas));

  // --- Enlaces de Tarjetas del Dashboard a Vistas Específicas ---
  const btnAjustes = document.getElementById('btn-ajustes');
  if (btnAjustes) btnAjustes.addEventListener('click', () => cambiarVista('mas', navMas));

  const cardProximo = document.getElementById('card-proximo-evento');
  if (cardProximo) cardProximo.addEventListener('click', () => cambiarVista('horario', navHorario));

  const cardWidgetTareas = document.getElementById('card-widget-tareas');
  if (cardWidgetTareas) cardWidgetTareas.addEventListener('click', () => cambiarVista('tareas', null));

  const cardWidgetEstudio = document.getElementById('card-widget-estudio');
  if (cardWidgetEstudio) cardWidgetEstudio.addEventListener('click', () => cambiarVista('estudio', navEstudio));

  const cardWidgetObjetivos = document.getElementById('card-widget-objetivos');
  if (cardWidgetObjetivos) cardWidgetObjetivos.addEventListener('click', () => cambiarVista('objetivos', null));

  const cardWidgetExamenes = document.getElementById('card-widget-examenes');
  if (cardWidgetExamenes) cardWidgetExamenes.addEventListener('click', () => cambiarVista('examenes', null));

  const linkVerTodoRep = document.getElementById('link-ver-todo-rep');
  if (linkVerTodoRep) linkVerTodoRep.addEventListener('click', () => cambiarVista('repertorio', navRepertorio));

  // Clics en tarjetas de repertorio del inicio
  document.querySelectorAll('.inst-repertorio-click').forEach(card => {
    card.addEventListener('click', () => cambiarVista('tareas', null));
  });

  // Botones de retroceso en vistas secundarias
  const btnVolverTareas = document.getElementById('btn-volver-tareas');
  if (btnVolverTareas) btnVolverTareas.addEventListener('click', () => cambiarVista('hoy', navHoy));

  const btnVolverObjetivos = document.getElementById('btn-volver-objetivos');
  if (btnVolverObjetivos) btnVolverObjetivos.addEventListener('click', () => cambiarVista('hoy', navHoy));

  const btnVolverExamenes = document.getElementById('btn-volver-examenes');
  if (btnVolverExamenes) btnVolverExamenes.addEventListener('click', () => cambiarVista('hoy', navHoy));

  // --- Bottom Sheet de Racha ---
  const cardWidgetRacha = document.getElementById('card-widget-racha');
  if (cardWidgetRacha) cardWidgetRacha.addEventListener('click', abrirRacha);

  const modalRacha = document.getElementById('modalRacha');
  if (modalRacha) {
    modalRacha.addEventListener('click', (e) => {
      if (e.target === modalRacha) cerrarRacha();
    });
  }

  const btnCerrarRacha = document.getElementById('btn-cerrar-racha');
  if (btnCerrarRacha) btnCerrarRacha.addEventListener('click', cerrarRacha);

  // --- Bottom Sheet de Nuevo Instrumento ---
  const btnAbrirModalInst = document.querySelectorAll('.btn-abrir-modal-inst-class, #btn-add-inst-header, #btn-abrir-modal-inst');
  btnAbrirModalInst.forEach(btn => {
    btn.addEventListener('click', abrirModalInstrumento);
  });

  const modalInstrumento = document.getElementById('modalInstrumento');
  if (modalInstrumento) {
    modalInstrumento.addEventListener('click', (e) => {
      if (e.target === modalInstrumento) cerrarModalInstrumento();
    });
  }

  const btnGuardarInstrumento = document.getElementById('btn-guardar-instrumento');
  if (btnGuardarInstrumento) btnGuardarInstrumento.addEventListener('click', guardarNuevoInstrumento);

  // --- Cronómetro de Sesión de Estudio ---
  const btnIniciarSesion = document.getElementById('btn-iniciar-sesion');
  if (btnIniciarSesion) btnIniciarSesion.addEventListener('click', iniciarSesionEstudio);

  // --- Metrónomo ---
  const btnBpmMenos = document.getElementById('btn-bpm-menos');
  if (btnBpmMenos) btnBpmMenos.addEventListener('click', () => ajustarBPM(-5));

  const btnBpmMas = document.getElementById('btn-bpm-mas');
  if (btnBpmMas) btnBpmMas.addEventListener('click', () => ajustarBPM(5));
});

// --- Función central de cambio de vistas ---
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
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function abrirRacha() {
  const modal = document.getElementById('modalRacha');
  if (modal) modal.classList.add('active');
}

function cerrarRacha() {
  const modal = document.getElementById('modalRacha');
  if (modal) modal.classList.remove('active');
}

function abrirModalInstrumento() {
  const modal = document.getElementById('modalInstrumento');
  if (modal) modal.classList.add('active');
}

function cerrarModalInstrumento() {
  const modal = document.getElementById('modalInstrumento');
  if (modal) modal.classList.remove('active');
}

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
      nuevaTarjeta.className = 'card-instrumento interactive-card inst-repertorio-click';
      nuevaTarjeta.addEventListener('click', () => cambiarVista('tareas', null));
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

let sesionActiva = false;
let segundosEstudio = 0;
let intervaloCronometro = null;

function iniciarSesionEstudio() {
  const btn = document.getElementById('btn-iniciar-sesion');
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
