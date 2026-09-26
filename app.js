// Función global limpia y directa para cambiar de vista sin fallos
function cambiarVista(idVista) {
  // 1. Ocultar todas las vistas
  document.querySelectorAll('.view').forEach(v => {
    v.classList.remove('active');
  });

  // 2. Mostrar la seleccionada
  const destino = document.getElementById('vista-' + idVista);
  if (destino) {
    destino.classList.add('active');
  }

  // 3. Actualizar estado activo en la barra de navegación inferior
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  const navBtn = document.getElementById('nav-' + idVista);
  if (navBtn) {
    navBtn.classList.add('active');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Modales y extras
function abrirRacha() {
  const m = document.getElementById('modalRacha');
  if (m) m.classList.add('active');
}

function cerrarRacha() {
  const m = document.getElementById('modalRacha');
  if (m) m.classList.remove('active');
}

function cerrarRachaFuera(e) {
  if (e.target.id === 'modalRacha') cerrarRacha();
}

let cronoActivo = false;
let segundos = 0;
let intervalo = null;

function iniciarSesionEstudio() {
  const btn = document.querySelector('.btn-main');
  const display = document.getElementById('cronometro');
  
  if (!cronoActivo) {
    cronoActivo = true;
    if (btn) {
      btn.textContent = "Finalizar sesión";
      btn.style.background = "#EF4444";
    }
    intervalo = setInterval(() => {
      segundos++;
      let m = Math.floor(segundos / 60);
      let s = segundos % 60;
      if (display) display.textContent = `00:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }, 1000);
  } else {
    clearInterval(intervalo);
    cronoActivo = false;
    if (btn) {
      btn.textContent = "Empezar sesión de estudio";
      btn.style.background = "var(--primary)";
    }
    const minsElem = document.getElementById('num-minutos');
    if (minsElem) minsElem.textContent = parseInt(minsElem.textContent || 0) + Math.max(1, Math.floor(segundos / 60));
    segundos = 0;
    if (display) display.textContent = "00:00:00";
  }
}
