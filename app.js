let appData = JSON.parse(localStorage.getItem('ritmoAcadeData')) || {
    primaryColor: '#818cf8',
    horario: [
        { id: 1, dia: 'Lunes', horaInicio: '10:00', horaFin: '11:00', asignatura: 'Piano Aplicado', aula: 'Aula 3', repeticion: 'Cada semana' }
    ],
    tareas: [
        { id: 1, texto: 'Llevar partitura de Bargiel', asignatura: 'Piano Aplicado', categoria: 'Llevar/Preparar', completada: false }
    ],
    asignaturas: [
        { id: 1, centro: 'Conservatorio Superior', nombre: 'Piano Aplicado', profesor: 'Juan Pérez', aula: 'Aula 3' },
        { id: 2, centro: 'Conservatorio Superior', nombre: 'Saxofón', profesor: 'María López', aula: 'Auditorio' }
    ],
    repertorio: [
        { id: 1, instrumento: 'piano', obra: 'Adagio Op. 38', compositor: 'Bargiel', estado: 'En proceso', subtareas: [{texto: 'Afinación compases 32-45', hecha: false}] }
    ],
    historialEstudio: []
};

let currentRepertoireInstrument = 'piano';
let currentTaskFilter = 'todos';
let timerDurationMinutes = 25;
let timeLeft = 25 * 60;
let timerInterval;

function saveData() {
    localStorage.setItem('ritmoAcadeData', JSON.stringify(appData));
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.bottom-quick-nav .nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    const quickBtn = document.querySelector(`.bottom-quick-nav [data-tab="${tabId}"]`);
    if(quickBtn) quickBtn.classList.add('active');
}

function toggleSidebarDrawer() {
    document.getElementById('sidebar-drawer').classList.toggle('open');
}

function switchTabFromDrawer(tabId) {
    toggleSidebarDrawer();
    switchTab(tabId);
}

function initApp() {
    if(appData.primaryColor) {
        document.documentElement.style.setProperty('--primary', appData.primaryColor);
        document.getElementById('primary-color-picker').value = appData.primaryColor;
    }

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString('es-ES', options);
    
    document.getElementById('welcome-date').innerText = dateStr;
    document.getElementById('today-full-date').innerText = dateStr;

    // Agenda Hoy
    const todayAgenda = document.getElementById('today-agenda-list');
    todayAgenda.innerHTML = '';
    
    let htmlContent = '';
    appData.tareas.filter(t => !t.completada).forEach(t => {
        htmlContent += `<div><span>[${t.categoria}] ${t.texto}</span> <em>(${t.asignatura})</em></div>`;
    });
    
    if(htmlContent === '') {
        htmlContent = '<div>No hay tareas pendientes para hoy. ¡Excelente trabajo!</div>';
    }

    todayAgenda.innerHTML = htmlContent;
    document.getElementById('widget-today-content').innerText = appData.tareas.filter(t => !t.completada).length > 0 ? appData.tareas.filter(t => !t.completada)[0].texto : 'Sin tareas pendientes';
    document.getElementById('widget-tasks-count').innerText = appData.tareas.filter(t => !t.completada).length;

    if(appData.horario.length > 0) {
        document.getElementById('widget-next-class').innerText = `${appData.horario[0].asignatura} — ${appData.horario[0].horaInicio}`;
    }

    renderSchedule();
    renderTasks();
    renderSubjectsByCentros();
    renderRepertoire();
    renderStats();
    populateTimerSubjects();
}

// Horario
function renderSchedule() {
    const container = document.getElementById('schedule-container');
    container.innerHTML = '';
    if(appData.horario.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);">No hay clases registradas.</p>';
        return;
    }
    let content = '<div style="display: flex; flex-direction: column; gap: 8px;">';
    appData.horario.forEach(h => {
        content += `<div style="padding: 10px; background: rgba(255,255,255,0.02); border-radius: 8px; display:flex; justify-content:space-between; align-items:center;"><span><strong>${h.dia} (${h.horaInicio} - ${h.horaFin})</strong>: ${h.asignatura} [${h.aula}] <em style="font-size:0.75rem; color:var(--text-muted);">(${h.repeticion})</em></span> <button class="btn danger" style="padding:2px 6px; font-size:0.75rem;" onclick="deleteItem('horario', ${h.id})">Eliminar</button></div>`;
    });
    content += '</div>';
    container.innerHTML = content;
}

// Tareas y Filtros
function filterTasks(cat, btn) {
    currentTaskFilter = cat;
    document.querySelectorAll('.task-filters .btn').forEach(b => {
        b.classList.remove('active', 'primary');
        b.classList.add('secondary');
    });
    btn.classList.add('active', 'primary');
    btn.classList.remove('secondary');
    renderTasks();
}

function renderTasks() {
    const list = document.getElementById('tasks-full-list');
    list.innerHTML = '';
    
    const filtered = currentTaskFilter === 'todos' ? appData.tareas : appData.tareas.filter(t => t.categoria === currentTaskFilter);

    if(filtered.length === 0) {
        list.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">No hay tareas en esta categoría.</p>';
        return;
    }

    filtered.forEach(t => {
        const li = document.createElement('li');
        li.innerHTML = `<label style="display:flex; align-items:center; gap:10px; cursor:pointer;"><input type="checkbox" ${t.completada ? 'checked' : ''} onchange="toggleTask(${t.id})"> <span style="${t.completada ? 'text-decoration:line-through; color:var(--text-muted);' : ''}">[${t.categoria}] ${t.texto} <em>(${t.asignatura})</em></span></label> <button class="btn danger" style="padding:2px 6px; font-size:0.75rem;" onclick="deleteItem('tareas', ${t.id})">Eliminar</button>`;
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

// Asignaturas por centro
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

// Repertorio y Subtareas
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
    const container = document.getElementById('repertorio-container');
    container.innerHTML = '';
    
    const filtered = appData.repertorio.filter(r => r.instrumento === currentRepertoireInstrument);
    
    if(filtered.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted);">No hay obras registradas para este instrumento.</p>';
        return;
    }

    filtered.forEach(r => {
        let subHtml = '';
        let hechas = 0;
        if(r.subtareas && r.subtareas.length > 0) {
            r.subtareas.forEach((sub, idx) => {
                if(sub.hecha) hechas++;
                subHtml += `<label style="display:flex; align-items:center; gap:8px; font-size:0.85rem; margin-top:4px; cursor:pointer;"><input type="checkbox" ${sub.hecha ? 'checked' : ''} onchange="toggleSubtask(${r.id}, ${idx})"> <span style="${sub.hecha ? 'text-decoration:line-through; color:var(--text-muted);' : ''}">${sub.texto}</span></label>`;
            });
        }
        let porcentaje = r.subtareas && r.subtareas.length > 0 ? Math.round((hechas / r.subtareas.length) * 100) : 0;

        container.innerHTML += `
            <div class="card">
                <h3>${r.obra}</h3>
                <p style="color:var(--text-muted); font-size:0.85rem;">Compositor: ${r.compositor}</p>
                <div style="margin: 10px 0;">
                    <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">Progreso: ${porcentaje}%</div>
                    <div style="width:100%; background:rgba(255,255,255,0.05); height:6px; border-radius:3px; overflow:hidden;">
                        <div style="width:${porcentaje}%; background:var(--primary); height:100%;"></div>
                    </div>
                </div>
                <div style="margin-top:8px;">${subHtml}</div>
                <button class="btn secondary" style="margin-top:12px; font-size:0.75rem; padding:4px 8px;" onclick="addPromptSubtask(${r.id})">+ Añadir subtarea</button>
            </div>`;
    });
}

function toggleSubtask(repId, subIdx) {
    const obra = appData.repertorio.find(r => r.id === repId);
    if(obra && obra.subtareas[subIdx]) {
        obra.subtareas[subIdx].hecha = !obra.subtareas[subIdx].hecha;
        saveData();
        renderRepertoire();
    }
}

function addPromptSubtask(repId) {
    const texto = prompt('Introduce el objetivo o subtarea a trabajar:');
    if(texto) {
        const obra = appData.repertorio.find(r => r.id === repId);
        if(!obra.subtareas) obra.subtareas = [];
        obra.subtareas.push({ texto, hecha: false });
        saveData();
        renderRepertoire();
    }
}

// Modales con desplegables automáticos
function openModal(type) {
    const modal = document.getElementById('app-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    modal.classList.add('open');

    if(type === 'task-modal') {
        title.innerText = 'Nueva Tarea';
        let asigOptions = appData.asignaturas.map(a => `<option value="${a.nombre}">${a.nombre} (${a.centro})</option>`).join('');
        body.innerHTML = `
            <input type="text" id="t-text" placeholder="Descripción de la tarea" class="modal-input">
            <label style="font-size:0.8rem; color:var(--text-muted);">Asignatura:</label>
            <select id="t-asig" class="modal-input" style="margin-top:4px;">${asigOptions}</select>
            <label style="font-size:0.8rem; color:var(--text-muted);">Categoría:</label>
            <select id="t-cat" class="modal-input" style="margin-top:4px;">
                <option value="Llevar/Preparar">Llevar/Preparar</option>
                <option value="Estudiar">Estudiar</option>
                <option value="Enviar">Enviar</option>
                <option value="Administrativo">Administrativo</option>
            </select>
            <button class="btn primary" style="width:100%; margin-top:8px;" onclick="saveNewTask()">Guardar Tarea</button>
        `;
    } else if(type === 'repertoire-modal') {
        title.innerText = 'Nueva Obra de Repertorio';
        body.innerHTML = `
            <input type="text" id="r-obra" placeholder="Nombre de la obra" class="modal-input">
            <input type="text" id="r-comp" placeholder="Compositor" class="modal-input">
            <label style="font-size:0.8rem; color:var(--text-muted);">Instrumento:</label>
            <select id="r-inst" class="modal-input" style="margin-top:4px;">
                <option value="piano">Piano</option>
                <option value="saxo">Saxofón</option>
            </select>
            <button class="btn primary" style="width:100%; margin-top:8px;" onclick="saveNewRepertoire()">Guardar Obra</button>
        `;
    } else if(type === 'subject-modal') {
        title.innerText = 'Nueva Asignatura';
        body.innerHTML = `
            <input type="text" id="s-centro" placeholder="Centro de estudio (ej: Conservatorio)" class="modal-input">
            <input type="text" id="s-nombre" placeholder="Nombre de la asignatura" class="modal-input">
            <input type="text" id="s-prof" placeholder="Profesor" class="modal-input">
            <input type="text" id="s-aula" placeholder="Aula habitual" class="modal-input">
            <button class="btn primary" style="width:100%; margin-top:8px;" onclick="saveNewSubject()">Guardar Asignatura</button>
        `;
    } else if(type === 'schedule-modal') {
        title.innerText = 'Nueva Clase en Horario';
        let asigSelectOptions = appData.asignaturas.map(a => `<option value="${a.nombre}" data-aula="${a.aula}">${a.nombre} (${a.centro})</option>`).join('');
        body.innerHTML = `
            <label style="font-size:0.8rem; color:var(--text-muted);">Día de la semana:</label>
            <select id="h-dia" class="modal-input" style="margin-top:4px;">
                <option value="Lunes">Lunes</option>
                <option value="Martes">Martes</option>
                <option value="Miércoles">Miércoles</option>
                <option value="Jueves">Jueves</option>
                <option value="Viernes">Viernes</option>
                <option value="Sábado">Sábado</option>
            </select>
            <div style="display:flex; gap:10px;">
                <div><label style="font-size:0.8rem; color:var(--text-muted);">Hora Inicio:</label><input type="time" id="h-inicio" class="modal-input" style="margin-top:4px;"></div>
                <div><label style="font-size:0.8rem; color:var(--text-muted);">Hora Fin:</label><input type="time" id="h-fin" class="modal-input" style="margin-top:4px;"></div>
            </div>
            <label style="font-size:0.8rem; color:var(--text-muted);">Asignatura:</label>
            <select id="h-asig" class="modal-input" style="margin-top:4px;" onchange="updateAulaFromSubject(this)">${asigSelectOptions}</select>
            <input type="text" id="h-aula" placeholder="Aula" class="modal-input">
            <label style="font-size:0.8rem; color:var(--text-muted);">Repetición:</label>
            <select id="h-rep" class="modal-input" style="margin-top:4px;">
                <option value="Cada semana">Cada semana</option>
                <option value="Quincenal">Quincenal</option>
                <option value="Única vez">Única vez</option>
            </select>
            <button class="btn primary" style="width:100%; margin-top:8px;" onclick="saveNewSchedule()">Guardar Clase</button>
        `;
    }
}

function updateAulaFromSubject(selectEl) {
    const selectedOpt = selectEl.options[selectEl.selectedIndex];
    const aula = selectedOpt.getAttribute('data-aula');
    if(aula) {
        document.getElementById('h-aula').value = aula;
    }
}

function closeModal() {
    document.getElementById('app-modal').classList.remove('open');
}

function saveNewTask() {
    const texto = document.getElementById('t-text').value;
    const asignatura = document.getElementById('t-asig').value;
    const categoria = document.getElementById('t-cat').value;
    if(texto) {
        appData.tareas.push({ id: Date.now(), texto, asignatura, categoria, completada: false });
        saveData();
        closeModal();
        initApp();
    }
}

function saveNewRepertoire() {
    const obra = document.getElementById('r-obra').value;
    const compositor = document.getElementById('r-comp').value;
    const instrumento = document.getElementById('r-inst').value;
    if(obra) {
        appData.repertorio.push({ id: Date.now(), instrumento, obra, compositor, estado: 'En proceso', subtareas: [] });
        saveData();
        closeModal();
        initApp();
    }
}

function saveNewSubject() {
    const centro = document.getElementById('s-centro').value;
    const nombre = document.getElementById('s-nombre').value;
    const profesor = document.getElementById('s-prof').value;
    const aula = document.getElementById('s-aula').value;
    if(nombre) {
        appData.asignaturas.push({ id: Date.now(), centro, nombre, profesor, aula });
        saveData();
        closeModal();
        initApp();
    }
}

function saveNewSchedule() {
    const dia = document.getElementById('h-dia').value;
    const horaInicio = document.getElementById('h-inicio').value || '10:00';
    const horaFin = document.getElementById('h-fin').value || '11:00';
    const asignatura = document.getElementById('h-asig').value;
    const aula = document.getElementById('h-aula').value;
    const repeticion = document.getElementById('h-rep').value;
    if(dia && asignatura) {
        appData.horario.push({ id: Date.now(), dia, horaInicio, horaFin, asignatura, aula, repeticion });
        saveData();
        closeModal();
        initApp();
    }
}

function deleteItem(type, id) {
    appData[type] = appData[type].filter(item => item.id !== id);
    saveData();
    initApp();
}

// Temporizador y Estadísticas
function setCustomTimer(mins) {
    timerDurationMinutes = parseInt(mins) || 25;
    timeLeft = timerDurationMinutes * 60;
    updateTimerDisplay();
}

function populateTimerSubjects() {
    const select = document.getElementById('timer-subject');
    if(!select) return;
    select.innerHTML = appData.asignaturas.map(a => `<option value="${a.nombre}">${a.nombre}</option>`).join('');
}

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
            registrarSesionEstudio(timerDurationMinutes);
            alert('¡Sesión de estudio completada y registrada!');
        }
    }, 1000);
}

function pauseTimer() { 
    clearInterval(timerInterval); 
    timerInterval = null; 
}

function resetTimer() { 
    clearInterval(timerInterval); 
    timerInterval = null; 
    timeLeft = timerDurationMinutes * 60; 
    updateTimerDisplay(); 
}

function registrarSesionEstudio(minutos) {
    const asignatura = document.getElementById('timer-subject').value;
    if(!appData.historialEstudio) appData.historialEstudio = [];
    appData.historialEstudio.push({ asignatura, minutos, fecha: new Date().toLocaleDateString() });
    saveData();
    renderStats();
}

function renderStats() {
    if(!appData.historialEstudio) appData.historialEstudio = [];
    const totalMinutos = appData.historialEstudio.reduce((acc, curr) => acc + curr.minutos, 0);
    const horas = Math.floor(totalMinutos / 60);
    const mins = totalMinutos % 60;
    document.getElementById('stats-summary').innerText = `Tiempo total de práctica registrado: ${horas}h ${mins}m`;
}

// Personalización
function changeThemeColor(color) {
    appData.primaryColor = color;
    document.documentElement.style.setProperty('--primary', color);
    saveData();
}

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
            alert('¡Datos importados con éxito!');
        }
    }
}

window.onload = () => {
    initApp();
    updateTimerDisplay();
};
