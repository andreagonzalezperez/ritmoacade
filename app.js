let appData = JSON.parse(localStorage.getItem('ritmoAcadeData')) || {
    primaryColor: '#818cf8',
    centros: [
        { id: 1, nombre: 'Conservatorio Superior', color: '#818cf8' },
        { id: 2, nombre: 'Universidad', color: '#34d399' }
    ],
    asignaturas: [
        { id: 1, centroId: 1, nombre: 'Piano Aplicado', profesor: 'Juan Pérez', aula: 'Aula 3' },
        { id: 2, centroId: 1, nombre: 'Saxofón', profesor: 'María López', aula: 'Auditorio' }
    ],
    horario: [
        { id: 1, fecha: '2026-09-26', horaInicio: '10:00', horaFin: '11:00', asignatura: 'Piano Aplicado', aula: 'Aula 3', tipo: 'Clase' }
    ],
    tareas: [
        { id: 1, texto: 'Llevar partitura de Bargiel', asignatura: 'Piano Aplicado', categoria: 'Llevar/Preparar', completada: false }
    ],
    repertorio: [
        { id: 1, instrumento: 'piano', obra: 'Adagio Op. 38', compositor: 'Bargiel', estado: 'En proceso', subtareas: [{texto: 'Afinación compases 32-45', hecha: false}] }
    ],
    historialEstudio: []
};

let currentRepertoireInstrument = 'piano';
let currentTaskFilter = 'todos';
let selectedCalendarDate = '2026-09-26';
let timerDurationMinutes = 25;
let timeLeft = 25 * 60;
let timerInterval = null;
let isTimerRunning = false;

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

function initApp() {
    if(appData.primaryColor) {
        document.documentElement.style.setProperty('--primary', appData.primaryColor);
    }

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString('es-ES', options);
    document.getElementById('welcome-date').innerText = dateStr;

    // Estadísticas
    const totalMinutos = (appData.historialEstudio || []).reduce((acc, curr) => acc + curr.minutos, 0);
    const horas = Math.floor(totalMinutos / 60);
    const mins = totalMinutos % 60;
    document.getElementById('widget-study-mins').innerText = totalMinutos;
    document.getElementById('stats-total-study').innerText = `${totalMinutos} minutos registrados (${horas}h ${mins}m).`;

    const tasksCompleted = (appData.tareas || []).filter(t => t.completada).length;
    document.getElementById('widget-tasks-count').innerText = tasksCompleted;
    document.getElementById('stats-total-tasks').innerText = `${tasksCompleted} completadas de ${(appData.tareas || []).length}.`;

    let totalRep = (appData.repertorio || []).length;
    let avgRep = 0;
    if(totalRep > 0) {
        let sumaPorcentajes = appData.repertorio.reduce((acc, r) => {
            if(!r.subtareas || r.subtareas.length === 0) return acc;
            let hechas = r.subtareas.filter(s => s.hecha).length;
            return acc + (hechas / r.subtareas.length) * 100;
        }, 0);
        avgRep = Math.round(sumaPorcentajes / totalRep);
    }
    document.getElementById('widget-repertoire-avg').innerText = `${avgRep}%`;
    document.getElementById('stats-total-repertoire').innerText = `${totalRep} obras · progreso medio ${avgRep}%.`;

    document.getElementById('widget-week-events').innerText = (appData.horario || []).length;

    if(appData.horario.length > 0) {
        document.getElementById('widget-next-event').innerText = `${appData.horario[0].asignatura} — ${appData.horario[0].horaInicio}`;
    } else {
        document.getElementById('widget-next-event').innerText = 'Sin eventos próximos';
    }

    renderTodayPlan();
    renderCalendarDays();
    renderScheduleDayEvents();
    renderTasks();
    renderRepertoire();
    populateTimerSubjects();
    renderStudyHistory();
}

function renderTodayPlan() {
    const container = document.getElementById('today-plan-container');
    const pendientes = (appData.tareas || []).filter(t => !t.completada);
    if(pendientes.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align:center;">No tienes tareas pendientes.</p>';
        return;
    }
    container.innerHTML = `<ul class="task-list">${pendientes.map(t => `<li class="task-item"><span style="font-size:0.9rem;">✓ ${t.texto}</span><button class="text-btn" style="font-size:0.8rem;" onclick="toggleTask(${t.id})">Completar</button></li>`).join('')}</ul>`;
}

function renderCalendarDays() {
    const grid = document.getElementById('calendar-days');
    grid.innerHTML = '';
    let startDay = 21;
    for(let i = 0; i < 28; i++) {
        let dayNum = (startDay + i - 1) % 30 + 1;
        let dateStr = `2026-09-${dayNum < 10 ? '0'+dayNum : dayNum}`;
        let hasEvent = appData.horario.some(h => h.fecha === dateStr);
        let isActive = selectedCalendarDate === dateStr;

        let div = document.createElement('div');
        div.className = `cal-day ${isActive ? 'active' : ''} ${hasEvent && !isActive ? 'has-event' : ''}`;
        div.innerText = dayNum;
        div.onclick = () => { selectedCalendarDate = dateStr; renderCalendarDays(); renderScheduleDayEvents(); };
        grid.appendChild(div);
    }
}

function renderScheduleDayEvents() {
    const container = document.getElementById('schedule-day-events');
    const evs = appData.horario.filter(h => h.fecha === selectedCalendarDate);
    if(evs.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);">No hay eventos para esta fecha.</p>';
        return;
    }
    container.innerHTML = evs.map(e => `
        <div class="task-item" style="margin-bottom:6px;">
            <div><strong>${e.horaInicio} - ${e.horaFin}</strong>: ${e.asignatura} (${e.aula})</div>
            <button class="text-btn" style="color:#f87171;" onclick="deleteItem('horario', ${e.id})">Eliminar</button>
        </div>
    `).join('');
}

function filterTasks(cat, btn) {
    currentTaskFilter = cat;
    document.querySelectorAll('.task-filters .btn').forEach(b => { b.classList.remove('active', 'primary'); b.classList.add('secondary'); });
    btn.classList.add('active', 'primary'); btn.classList.remove('secondary');
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
    list.innerHTML = filtered.map(t => `
        <li class="task-item">
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                <input type="checkbox" ${t.completada ? 'checked' : ''} onchange="toggleTask(${t.id})">
                <span style="${t.completada ? 'text-decoration:line-through; color:var(--text-muted);' : ''}">[${t.categoria}] ${t.texto} <em>(${t.asignatura})</em></span>
            </label>
            <button class="text-btn" style="color:#f87171; font-size:0.8rem;" onclick="deleteItem('tareas', ${t.id})">Eliminar</button>
        </li>
    `).join('');
}

function toggleTask(id) {
    const t = appData.tareas.find(item => item.id === id);
    if(t) { t.completada = !t.completada; saveData(); initApp(); }
}

function switchRepertoireTab(instrument) {
    currentRepertoireInstrument = instrument;
    document.querySelectorAll('.rep-tab-btn').forEach(b => { b.classList.remove('active', 'primary'); b.classList.add('secondary'); });
    event.target.classList.add('active', 'primary'); event.target.classList.remove('secondary');
    renderRepertoire();
}

function renderRepertoire() {
    const container = document.getElementById('repertoire-container');
    const filtered = appData.repertorio.filter(r => r.instrumento === currentRepertoireInstrument);
    if(filtered.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align:center; padding:20px;">No hay obras registradas.</p>';
        return;
    }
    container.innerHTML = filtered.map(r => {
        let hechas = (r.subtareas || []).filter(s => s.hecha).length;
        let total = (r.subtareas || []).length;
        let pct = total > 0 ? Math.round((hechas / total) * 100) : 0;
        return `
            <div class="card" style="margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <h3>${r.obra}</h3>
                        <p style="color:var(--text-muted); font-size:0.85rem;">Compositor: ${r.compositor}</p>
                    </div>
                    <button class="text-btn" style="color:#f87171;" onclick="deleteItem('repertorio', ${r.id})">Eliminar</button>
                </div>
                <div style="margin: 10px 0;">
                    <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">Progreso: ${pct}%</div>
                    <div style="width:100%; background:rgba(255,255,255,0.05); height:6px; border-radius:3px; overflow:hidden;">
                        <div style="width:${pct}%; background:var(--primary); height:100%;"></div>
                    </div>
                </div>
                <div>${(r.subtareas || []).map((s, idx) => `<div style="font-size:0.85rem; margin-top:4px; display:flex; justify-content:space-between;"><label><input type="checkbox" ${s.hecha ? 'checked' : ''} onchange="toggleSubtask(${r.id},${idx})"> <span style="${s.hecha?'text-decoration:line-through;color:var(--text-muted);':''}">${s.texto}</span></label></div>`).join('')}</div>
                <button class="text-btn" style="margin-top:10px;" onclick="addSubtaskPrompt(${r.id})">+ subtarea</button>
            </div>
        `;
    }).join('');
}

function toggleSubtask(repId, subIdx) {
    let r = appData.repertorio.find(item => item.id === repId);
    if(r && r.subtareas[subIdx]) { r.subtareas[subIdx].hecha = !r.subtareas[subIdx].hecha; saveData(); renderRepertoire(); }
}

function addSubtaskPrompt(repId) {
    let txt = prompt('Nueva subtarea u objetivo:');
    if(txt) {
        let r = appData.repertorio.find(item => item.id === repId);
        if(!r.subtareas) r.subtareas = [];
        r.subtareas.push({ texto: txt, hecha: false });
        saveData(); renderRepertoire();
    }
}

function openGlobalAddModal() {
    openModal('task-modal');
}

function openModal(type) {
    const modal = document.getElementById('app-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    modal.classList.add('open');

    if(type === 'task-modal') {
        title.innerText = 'Nueva Tarea';
        let asigOpt = appData.asignaturas.map(a => `<option value="${a.nombre}">${a.nombre}</option>`).join('');
        body.innerHTML = `
            <input type="text" id="t-text" placeholder="Descripción" class="modal-input">
            <select id="t-asig" class="modal-input">${asigOpt}</select>
            <select id="t-cat" class="modal-input">
                <option value="Llevar/Preparar">Llevar/Preparar</option>
                <option value="Estudiar">Estudiar</option>
                <option value="Enviar">Enviar</option>
                <option value="Administrativo">Administrativo</option>
            </select>
            <button class="text-btn" style="width:100%; padding:10px; background:var(--primary); color:white; border-radius:10px; font-weight:700;" onclick="saveTask()">Guardar</button>
        `;
    } else if(type === 'repertoire-modal') {
        title.innerText = 'Nueva Obra';
        body.innerHTML = `
            <input type="text" id="r-obra" placeholder="Nombre de la obra" class="modal-input">
            <input type="text" id="r-comp" placeholder="Compositor" class="modal-input">
            <select id="r-inst" class="modal-input"><option value="piano">Piano</option><option value="saxo">Saxofón</option></select>
            <button class="text-btn" style="width:100%; padding:10px; background:var(--primary); color:white; border-radius:10px; font-weight:700;" onclick="saveRepertoire()">Guardar</button>
        `;
    } else if(type === 'schedule-modal') {
        title.innerText = 'Nuevo Evento / Clase';
        let asigOpt = appData.asignaturas.map(a => `<option value="${a.nombre}" data-aula="${a.aula}">${a.nombre}</option>`).join('');
        body.innerHTML = `
            <input type="date" id="h-fecha" value="${selectedCalendarDate}" class="modal-input">
            <div style="display:flex; gap:8px;"><input type="time" id="h-ini" value="10:00" class="modal-input"><input type="time" id="h-fin" value="11:00" class="modal-input"></div>
            <select id="h-asig" class="modal-input" onchange="document.getElementById('h-aula').value = this.options[this.selectedIndex].getAttribute('data-aula')">${asigOpt}</select>
            <input type="text" id="h-aula" placeholder="Aula" class="modal-input">
            <button class="text-btn" style="width:100%; padding:10px; background:var(--primary); color:white; border-radius:10px; font-weight:700;" onclick="saveSchedule()">Guardar</button>
        `;
    } else if(type === 'study-record-modal') {
        title.innerText = 'Registrar Sesión';
        let asigOpt = appData.asignaturas.map(a => `<option value="${a.nombre}">${a.nombre}</option>`).join('');
        body.innerHTML = `
            <select id="s-asig" class="modal-input">${asigOpt}</select>
            <input type="number" id="s-mins" placeholder="Minutos practicados" value="30" class="modal-input">
            <button class="text-btn" style="width:100%; padding:10px; background:var(--primary); color:white; border-radius:10px; font-weight:700;" onclick="saveStudySession()">Registrar</button>
        `;
    } else if(type === 'exam-modal') {
        title.innerText = 'Exámenes';
        body.innerHTML = `<p style="color:var(--text-muted); margin-bottom:10px;">Gestión de exámenes y cuentas atrás.</p><button class="text-btn" style="width:100%; padding:10px; background:var(--primary); color:white; border-radius:10px;" onclick="closeModal()">Cerrar</button>`;
    }
}

function openSettingsModal() {
    const modal = document.getElementById('app-modal');
    document.getElementById('modal-title').innerText = 'Ajustes & Centros';
    document.getElementById('modal-body').innerHTML = `
        <label style="font-size:0.8rem; color:var(--text-muted);">Color Principal de la App:</label>
        <input type="color" id="cfg-color" value="${appData.primaryColor}" onchange="changeColor(this.value)" class="modal-input" style="height:40px; cursor:pointer;">
        <p style="font-size:0.85rem; color:var(--text-muted); margin-top:10px;">Gestión de Centros y Colores amplios.</p>
        <button class="text-btn" style="width:100%; padding:10px; background:var(--primary); color:white; border-radius:10px; margin-top:10px;" onclick="closeModal()">Cerrar</button>
    `;
    modal.classList.add('open');
}

function closeModal() { document.getElementById('app-modal').classList.remove('open'); }

function saveTask() {
    let texto = document.getElementById('t-text').value;
    if(texto) {
        appData.tareas.push({ id: Date.now(), texto, asignatura: document.getElementById('t-asig').value, categoria: document.getElementById('t-cat').value, completada: false });
        saveData(); closeModal(); initApp();
    }
}

function saveRepertoire() {
    let obra = document.getElementById('r-obra').value;
    if(obra) {
        appData.repertorio.push({ id: Date.now(), instrumento: document.getElementById('r-inst').value, obra, compositor: document.getElementById('r-comp').value, estado: 'En proceso', subtareas: [] });
        saveData(); closeModal(); initApp();
    }
}

function saveSchedule() {
    let fecha = document.getElementById('h-fecha').value;
    let asignatura = document.getElementById('h-asig').value;
    if(fecha && asignatura) {
        appData.horario.push({ id: Date.now(), fecha, horaInicio: document.getElementById('h-ini').value, horaFin: document.getElementById('h-fin').value, asignatura, aula: document.getElementById('h-aula').value });
        saveData(); closeModal(); initApp();
    }
}

function saveStudySession() {
    let minutos = parseInt(document.getElementById('s-mins').value) || 0;
    if(minutos > 0) {
        appData.historialEstudio.push({ id: Date.now(), asignatura: document.getElementById('s-asig').value, minutos, fecha: new Date().toLocaleDateString() });
        saveData(); closeModal(); initApp();
    }
}

function deleteItem(type, id) {
    appData[type] = appData[type].filter(item => item.id !== id);
    saveData(); initApp();
}

function changeColor(c) {
    appData.primaryColor = c; document.documentElement.style.setProperty('--primary', c); saveData();
}

function populateTimerSubjects() {
    const sel = document.getElementById('timer-subject');
    if(sel) sel.innerHTML = appData.asignaturas.map(a => `<option value="${a.nombre}">${a.nombre}</option>`).join('');
}

function toggleTimer() {
    if(isTimerRunning) {
        clearInterval(timerInterval); isTimerRunning = false;
    } else {
        isTimerRunning = true;
        timerInterval = setInterval(() => {
            if(timeLeft > 0) {
                timeLeft--;
                let m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
                let s = (timeLeft % 60).toString().padStart(2, '0');
                document.getElementById('timer-display').innerText = `${m}:${s}`;
            } else {
                clearInterval(timerInterval); isTimerRunning = false;
                alert('¡Sesión finalizada!');
                let asig = document.getElementById('timer-subject').value;
                appData.historialEstudio.push({ id: Date.now(), asignatura: asig, minutos: 25, fecha: new Date().toLocaleDateString() });
                saveData(); initApp();
                timeLeft = 25 * 60;
            }
        }, 1000);
    }
}

function resetTimer() {
    clearInterval(timerInterval); isTimerRunning = false; timeLeft = 25 * 60;
    document.getElementById('timer-display').innerText = '25:00';
}

function renderStudyHistory() {
    const list = document.getElementById('sessions-history-list');
    if(!appData.historialEstudio || appData.historialEstudio.length === 0) {
        list.innerHTML = '<p style="color:var(--text-muted);">Registra tu primera sesión.</p>';
        return;
    }
    list.innerHTML = appData.historialEstudio.slice(-3).reverse().map(s => `
        <div class="task-item" style="margin-bottom:6px;">
            <div><strong>${s.asignatura}</strong> — ${s.minutos} min</div>
            <span style="font-size:0.75rem; color:var(--text-muted);">${s.fecha}</span>
        </div>
    `).join('');
}

window.onload = () => { initApp(); };

