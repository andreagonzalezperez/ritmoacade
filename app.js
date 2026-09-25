let appData = JSON.parse(localStorage.getItem('ritmoAcadeData')) || {
    primaryColor: '#818cf8',
    horario: [
        { dia: 'Lunes', hora: '10:00', asignatura: 'Piano Aplicado', aula: 'Aula 3' },
        { dia: 'Martes', hora: '11:30', asignatura: 'Saxofón', aula: 'Auditorio' }
    ],
    tareas: [
        { id: 1, texto: 'Llevar partitura de Bargiel', asignatura: 'Piano Aplicado', completada: false }
    ],
    asignaturas: [
        { centro: 'Conservatorio Superior', nombre: 'Piano Aplicado', profesor: 'Juan Pérez', aula: 'Aula 3' },
        { centro: 'Conservatorio Superior', nombre: 'Saxofón', profesor: 'María López', aula: 'Auditorio' }
    ],
    repertorio: [
        { instrumento: 'piano', obra: 'Adagio Op. 38', compositor: 'Bargiel', estado: 'En proceso' },
        { instrumento: 'saxo', obra: 'Sonata para Saxofón', compositor: 'Edison Denisov', estado: 'Iniciado' }
    ]
};

let currentRepertoireInstrument = 'piano';

function saveData() {
    localStorage.setItem('ritmoAcadeData', JSON.stringify(appData));
}

// Navegación general
function switchTab(tabId) {
    document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.bottom-quick-nav .nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    const quickBtn = document.querySelector(`.bottom-quick-nav [data-tab="${tabId}"]`);
    if(quickBtn) quickBtn.classList.add('active');
}

// Menú Drawer lateral
function toggleSidebarDrawer() {
    document.getElementById('sidebar-drawer').classList.toggle('open');
}

function switchTabFromDrawer(tabId) {
    toggleSidebarDrawer();
    switchTab(tabId);
}

// Inicialización de la app
function initApp() {
    if(appData.primaryColor) {
        document.documentElement.style.setProperty('--primary', appData.primaryColor);
        document.getElementById('primary-color-picker').value = appData.primaryColor;
    }

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString('es-ES', options);
    
    document.getElementById('welcome-date').innerText = dateStr;
    document.getElementById('today-full-date').innerText = dateStr;

    // Widget y Hoy unificados
    const todayAgenda = document.getElementById('today-agenda-list');
    todayAgenda.innerHTML = '';
    
    let htmlContent = '';
    appData.tareas.forEach(t => {
        htmlContent += `<div>Tarea: ${t.texto} (${t.asignatura})</div>`;
    });
    
    if(appData.tareas.length === 0) {
        htmlContent = '<div>No hay actividades ni tareas registradas para hoy.</div>';
    }

    todayAgenda.innerHTML = htmlContent;
    document.getElementById('widget-today-content').innerText = appData.tareas.length > 0 ? `${appData.tareas[0].texto} (${appData.tareas[0].asignatura})` : 'Sin tareas pendientes';
    document.getElementById('widget-tasks-count').innerText = appData.tareas.filter(t => !t.completada).length;

    renderSchedule('week');
    renderTasks();
    renderSubjectsByCentros();
    renderRepertoire();
}

// Horario
function renderSchedule(mode) {
    const container = document.getElementById('schedule-container');
    container.innerHTML = '';
    let content = '<div style="display: flex; flex-direction: column; gap: 8px;">';
    appData.horario.forEach(h => {
        content += `<div style="padding: 10px; background: rgba(255,255,255,0.02); border-radius: 8px;"><strong>${h.dia} - ${h.hora}</strong>: ${h.asignatura} (${h.aula})</div>`;
    });
    content += '</div>';
    container.innerHTML = content;
}

function setScheduleView(mode) {
    document.getElementById('btn-view-week').classList.toggle('active', mode === 'week');
    document.getElementById('btn-view-day').classList.toggle('active', mode === 'day');
    renderSchedule(mode);
}

// Tareas
function renderTasks() {
    const list = document.getElementById('tasks-full-list');
    list.innerHTML = '';
    appData.tareas.forEach(t => {
        const li = document.createElement('li');
        li.innerHTML = `<label><input type="checkbox" ${t.completada ? 'checked' : ''} onchange="toggleTask(${t.id})"> ${t.texto} <em>(${t.asignatura})</em></label>`;
        list.appendChild(li);
    });
}

function toggleTask(id) {
    const task = appData.tareas.find(t => t.id === id);
    if(task) {
        task.completada = !task.completada;
        saveData();
        initApp();
    }
}

// Asignaturas agrupadas por Centro de Estudio
function renderSubjectsByCentros() {
    const container = document.getElementById('subjects-container');
    container.innerHTML = '';
    
    const centrosMap = {};
    appData.asignaturas.forEach(s => {
        const centro = s.centro || 'General';
        if(!centrosMap[centro]) centrosMap[centro] = [];
        centrosMap[centro].push(s);
    });

    for(const centro in centrosMap) {
        let section = `<div class="card" style="margin-bottom: 20px;"><h3>Centro: ${centro}</h3><div class="grid-cards">`;
        centrosMap[centro].forEach(sub => {
            section += `<div style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: 10px; border: 1px solid var(--border);"><strong>${sub.nombre}</strong><p style="color:var(--text-muted); font-size:0.85rem; margin-top:4px;">Prof: ${sub.profesor} | Aula: ${sub.aula}</p></div>`;
        });
        section += `</div></div>`;
        container.innerHTML += section;
    }
}

// Repertorio dividido por instrumentos
function switchRepertoireTab(instrument) {
    currentRepertoireInstrument = instrument;
    document.querySelectorAll('.rep-tab-btn').forEach(b => {
        b.classList.remove('active', 'primary');
        b.classList.add('secondary');
    });
    event.target.classList.add('active', 'primary');
    event.target.classList.remove('secondary');
    renderRepertoire();
}

function renderRepertoire() {
    const container = document.getElementById('repertoire-container');
    container.innerHTML = '';
    
    const filtered = appData.repertorio.filter(r => r.instrumento === currentRepertoireInstrument);
    
    if(filtered.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted);">No hay obras registradas para este instrumento.</p>';
        return;
    }

    filtered.forEach(r => {
        container.innerHTML += `<div class="card"><h3>${r.obra}</h3><p style="color:var(--text-muted);">Compositor: ${r.compositor}</p><p style="color:var(--text-muted); margin-top:4px;">Estado: ${r.estado}</p></div>`;
    });
}

// Personalización
function changeThemeColor(color) {
    appData.primaryColor = color;
    document.documentElement.style.setProperty('--primary', color);
    saveData();
}

// Temporizador
let timerInterval;
let timeLeft = 25 * 60;
function updateTimerDisplay() {
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');
    document.getElementById('timer-display').innerText = `${m}:${s}`;
}
function startTimer() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateTimerDisplay();
        } else {
            clearInterval(timerInterval);
            timerInterval = null;
            alert('Sesión finalizada.');
        }
    }, 1000);
}
function pauseTimer() { clearInterval(timerInterval); timerInterval = null; }
function resetTimer() { clearInterval(timerInterval); timerInterval = null; timeLeft = 25 * 60; updateTimerDisplay(); }

// Copias
function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", "ritmoacade_backup.json");
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
}

function importData(event) {
    const reader = new FileReader();
    if(event.target.files[0]) {
        reader.readAsText(event.target.files[0], "UTF-8");
        reader.onload = (e) => {
            appData = JSON.parse(e.target.result);
            saveData();
            initApp();
            alert('Datos importados con éxito.');
        }
    }
}

window.onload = () => {
    initApp();
    updateTimerDisplay();
};

