
let appData = JSON.parse(localStorage.getItem('ritmoAcadeData')) || {
    primaryColor: '#818cf8',
    centros: [
        { id: 1, nombre: 'Conservatorio Superior', color: '#818cf8' },
        { id: 2, nombre: 'Universidad', color: '#34d399' }
    ],
    asignaturas: [
        { id: 1, centroId: 1, nombre: 'Piano Aplicado', profesor: 'Juan Pérez', aula: 'Aula 3', color: '#818cf8' },
        { id: 2, centroId: 1, nombre: 'Saxofón', profesor: 'María López', aula: 'Auditorio', color: '#34d399' }
    ],
    repertorioSections: ['piano', 'saxo', 'camara', 'ensamble'],
    horario: [
        { id: 1, fecha: '2026-09-26', diaSemana: 'Sábado', horaInicio: '10:00', horaFin: '11:00', asignatura: 'Piano Aplicado', profesor: 'Juan Pérez', aula: 'Aula 3', color: '#818cf8', notasClase: [] }
    ],
    tareas: [
        { id: 1, texto: 'Llevar partitura de Bargiel', asignatura: 'Piano Aplicado', categoria: 'Llevar/Preparar', completada: false }
    ],
    repertorio: [
        { id: 1, seccion: 'piano', obra: 'Adagio Op. 38', compositor: 'Bargiel', subtareas: [{texto: 'Afinación compases 32-45', hecha: false}], notasTecnicas: [] }
    ],
    examenes: [
        { id: 1, nombre: 'Examen Final Piano', fecha: '2026-10-15', asignatura: 'Piano Aplicado' }
    ],
    historialEstudio: [],
    streak: { count: 3, lastDate: '2026-09-25' }
};

let currentRepertoireSection = 'piano';
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
    if(!appData.repertorioSections) appData.repertorioSections = ['piano', 'saxo'];
    if(!appData.examenes) appData.examenes = [];

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString('es-ES', options);
    document.getElementById('welcome-date').innerText = dateStr;

    // Calcular racha de práctica
    checkStreak();

    // Estadísticas
    const totalMinutos = (appData.historialEstudio || []).reduce((acc, curr) => acc + curr.minutos, 0);
    document.getElementById('widget-study-mins').innerText = totalMinutos;
    document.getElementById('stats-total-study').innerText = `${totalMinutos} minutos registrados.`;

    const tasks = appData.tareas || [];
    const tasksCompleted = tasks.filter(t => t.completada).length;
    document.getElementById('widget-tasks-count').innerText = tasksCompleted;
    document.getElementById('stats-total-tasks').innerText = `${tasksCompleted} completadas de ${tasks.length}.`;

    let dailyGoalPct = tasks.length > 0 ? Math.round((tasksCompleted / tasks.length) * 100) : 0;
    document.getElementById('widget-daily-goal-text').innerText = `${dailyGoalPct}%`;
    document.getElementById('daily-circle-progress').style.setProperty('--p', dailyGoalPct);

    document.getElementById('widget-streak-count').innerText = `🔥 ${appData.streak.count}`;

    // Repertorio medio
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

    // Eventos hoy
    const todayEvents = (appData.horario || []).filter(h => h.fecha === selectedCalendarDate);
    document.getElementById('widget-today-events-count').innerText = todayEvents.length;

    // Próximo evento dinámico con inicio y fin
    if(appData.horario.length > 0) {
        let next = appData.horario[0];
        document.getElementById('widget-next-event').innerText = `${next.asignatura} (${next.horaInicio} - ${next.horaFin})`;
        document.getElementById('widget-next-time').innerText = `Docente: ${next.profesor || 'No asignado'} | Aula: ${next.aula}`;
    } else {
        document.getElementById('widget-next-event').innerText = 'Sin eventos próximos';
        document.getElementById('widget-next-time').innerText = 'Añade clases, ensayos o conciertos.';
    }

    renderTodayPlan();
    renderTodayExams();
    renderCalendarDays();
    renderScheduleDayEvents();
    renderWeeklyScheduleGrid();
    renderTasks();
    renderRepertoireTabs();
    renderRepertoire();
    populateTimerSubjects();
    renderStudyHistory();
}

function checkStreak() {
    const today = new Date().toISOString().split('T')[0];
    if(appData.streak.lastDate !== today) {
        // Lógica sencilla de mantenimiento de racha si procede
    }
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

function renderTodayExams() {
    const container = document.getElementById('today-exams-container');
    const exams = appData.examenes || [];
    if(exams.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align:center;">No hay exámenes próximos.</p>';
        return;
    }
    const todayObj = new Date();
    container.innerHTML = exams.map(e => {
        const examDate = new Date(e.fecha);
        const diffDays = Math.ceil((examDate - todayObj) / (1000 * 60 * 60 * 24));
        return `<div class="task-item" style="border-left: 4px solid #f87171;">
            <div><strong>${e.nombre}</strong> (${e.asignatura})<br><em style="font-size:0.75rem; color:var(--primary);">Faltan ${diffDays >= 0 ? diffDays : 0} días (${e.fecha})</em></div>
            <button class="text-btn" style="color:#f87171;" onclick="deleteItem('examenes', ${e.id})">Eliminar</button>
        </div>`;
    }).join('');
}

// Horario & Calendario con puntos de color y notas/tareas de clase
function switchScheduleView(view, btn) {
    document.querySelectorAll('.tab-section #horario .rep-tab-btn').forEach(b => { b.classList.remove('active', 'primary'); b.classList.add('secondary'); });
    btn.classList.add('active', 'primary'); btn.classList.remove('secondary');
    
    if(view === 'calendar') {
        document.getElementById('schedule-view-calendar').style.display = 'block';
        document.getElementById('schedule-view-weekly').style.display = 'none';
    } else {
        document.getElementById('schedule-view-calendar').style.display = 'none';
        document.getElementById('schedule-view-weekly').style.display = 'block';
        renderWeeklyScheduleGrid();
    }
}

function renderCalendarDays() {
    const grid = document.getElementById('calendar-days');
    grid.innerHTML = '';
    let startDay = 21;
    for(let i = 0; i < 28; i++) {
        let dayNum = (startDay + i - 1) % 30 + 1;
        let dateStr = `2026-09-${dayNum < 10 ? '0'+dayNum : dayNum}`;
        let evs = appData.horario.filter(h => h.fecha === dateStr);
        let isActive = selectedCalendarDate === dateStr;

        let div = document.createElement('div');
        div.className = `cal-day ${isActive ? 'active' : ''}`;
        div.innerHTML = `<span>${dayNum}</span>`;
        if(evs.length > 0 && !isActive) {
            let dot = document.createElement('div');
            dot.className = 'cal-dot';
            dot.style.backgroundColor = evs[0].color || 'var(--primary)';
            div.appendChild(dot);
        }
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
        <div class="card" style="margin-bottom:8px; border-left: 4px solid ${e.color || 'var(--primary)'};">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <strong>${e.horaInicio} - ${e.horaFin}</strong>: ${e.asignatura} (${e.aula})<br>
                    <em style="font-size:0.8rem; color:var(--text-muted);">Docente: ${e.profesor || 'No asignado'}</em>
                </div>
                <button class="text-btn" style="color:#f87171; font-size:0.8rem;" onclick="deleteItem('horario', ${e.id})">Eliminar</button>
            </div>
            <div style="margin-top:10px; border-top:1px solid var(--border); pt:8px;">
                <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">Recordatorios / Deberes para esta clase:</div>
                ${(e.notasClase || []).map((nota, idx) => `<div style="font-size:0.85rem; display:flex; justify-content:space-between;"><span>• ${nota}</span></div>`).join('')}
                <button class="text-btn" style="font-size:0.75rem; margin-top:4px;" onclick="addEventNotePrompt(${e.id})">+ añadir recordatorio</button>
            </div>
        </div>
    `).join('');
}

function addEventNotePrompt(eventId) {
    let nota = prompt('Introduce deberes o recordatorios para esta clase en concreto:');
    if(nota) {
        let ev = appData.horario.find(h => h.id === eventId);
        if(!ev.notasClase) ev.notasClase = [];
        ev.notasClase.push(nota);
        saveData(); renderScheduleDayEvents();
    }
}

function renderWeeklyScheduleGrid() {
    const container = document.getElementById('weekly-grid-container');
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    let html = '<div style="display:grid; grid-template-columns: repeat(7, 1fr); gap:8px; min-width:600px;">';
    dias.forEach(d => {
        let clasesDia = appData.horario.filter(h => h.diaSemana === d);
        html += `<div style="background:rgba(255,255,255,0.02); border:1px solid var(--border); border-radius:10px; padding:8px; min-height:150px;">
            <div style="font-weight:700; font-size:0.8rem; margin-bottom:8px; text-align:center; color:var(--primary);">${d}</div>
            ${clasesDia.length === 0 ? '<div style="font-size:0.7rem; color:var(--text-muted); text-align:center;">Sin eventos</div>' : clasesDia.map(c => `<div style="background:${c.color \vert{}\vert{} 'var(--primary)'}22; border-left:3px solid${c.color || 'var(--primary)'}; padding:4px; border-radius:4px; font-size:0.75rem; margin-bottom:4px;"><strong>${c.horaInicio}</strong><br>${c.asignatura}</div>`).join('')}
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

// Tareas
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

// Repertorio ampliable con notas técnicas por fechas
function renderRepertoireTabs() {
    const container = document.getElementById('repertoire-tabs-container');
    container.innerHTML = appData.repertorioSections.map(sec => `
        <button class="rep-section-btn ${sec === currentRepertoireSection ? 'active' : ''}" onclick="switchRepertoireSection('${sec}')">${sec.toUpperCase()}</button>
    `).join('') + `<button class="rep-section-btn" onclick="addNewRepertoireSection()" style="border-style:dashed;">+ Sección</button>`;
}

function switchRepertoireSection(sec) {
    currentRepertoireSection = sec;
    renderRepertoireTabs();
    renderRepertoire();
}

function addNewRepertoireSection() {
    let name = prompt('Nombre de la nueva sección (ej: Música de cámara, Ensamble):');
    if(name && !appData.repertorioSections.includes(name.toLowerCase())) {
        appData.repertorioSections.push(name.toLowerCase());
        saveData(); renderRepertoireTabs();
    }
}

function renderRepertoire() {
    const container = document.getElementById('repertoire-container');
    const filtered = appData.repertorio.filter(r => r.seccion === currentRepertoireSection);
    if(filtered.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align:center; padding:20px;">No hay obras registradas en esta sección.</p>';
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
                
                <div style="margin-top:12px; pt:8px; border-top:1px solid var(--border);">
                    <div style="font-size:0.75rem; color:var(--text-muted); mb:4px;">Notas del profesor / Problemas técnicos:</div>
                    ${(r.notasTecnicas || []).map(n => `<div style="font-size:0.8rem; color:var(--text-main);">• [${n.fecha}]${n.nota}</div>`).join('')}
                    <button class="text-btn" style="font-size:0.75rem; mt:4px;" onclick="addTechNotePrompt(${r.id})">+ nota de clase</button>
                </div>
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

function addTechNotePrompt(repId) {
    let nota = prompt('Nota técnica o corrección del profesor:');
    if(nota) {
        let r = appData.repertorio.find(item => item.id === repId);
        if(!r.notasTecnicas) r.notasTecnicas = [];
        r.notasTecnicas.push({ fecha: new Date().toLocaleDateString(), nota });
        saveData(); renderRepertoire();
    }
}

function openGlobalAddModal() {
    openModal('task-modal');
}

// Modales universales
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
        let secOpt = appData.repertorioSections.map(s => `<option value="${s}">${s.toUpperCase()}</option>`).join('');
        body.innerHTML = `
            <input type="text" id="r-obra" placeholder="Nombre de la obra" class="modal-input">
            <input type="text" id="r-comp" placeholder="Compositor" class="modal-input">
            <select id="r-sec" class="modal-input">${secOpt}</select>
            <button class="text-btn" style="width:100%; padding:10px; background:var(--primary); color:white; border-radius:10px; font-weight:700;" onclick="saveRepertoire()">Guardar</button>
        `;
    } else if(type === 'schedule-modal') {
        title.innerText = 'Nuevo Evento / Clase';
        let asigOpt = appData.asignaturas.map(a => `<option value="${a.nombre}" data-prof="${a.profesor || ''}" data-aula="${a.aula || ''}" data-color="${a.color || '#818cf8'}">${a.nombre}</option>`).join('');
        body.innerHTML = `
            <input type="date" id="h-fecha" value="${selectedCalendarDate}" class="modal-input">
            <select id="h-diasem" class="modal-input">
                <option value="Lunes">Lunes</option><option value="Martes">Martes</option><option value="Miércoles">Miércoles</option><option value="Jueves">Jueves</option><option value="Viernes">Viernes</option><option value="Sábado">Sábado</option><option value="Domingo">Domingo</option>
            </select>
            <div style="display:flex; gap:8px;"><input type="time" id="h-ini" value="10:00" class="modal-input"><input type="time" id="h-fin" value="11:00" class="modal-input"></div>
            <select id="h-asig" class="modal-input" onchange="updateEventFields(this)">${asigOpt}</select>
            <input type="text" id="h-prof" placeholder="Docente / Profesor" class="modal-input">
            <input type="text" id="h-aula" placeholder="Aula" class="modal-input">
            <label style="font-size:0.8rem; color:var(--text-muted);">Color distintivo:</label>
            <input type="color" id="h-color" value="#818cf8" class="modal-input" style="height:36px; cursor:pointer;">
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
        title.innerText = 'Nuevo Examen';
        let asigOpt = appData.asignaturas.map(a => `<option value="${a.nombre}">${a.nombre}</option>`).join('');
        body.innerHTML = `
            <input type="text" id="e-nombre" placeholder="Nombre (ej: Examen Final)" class="modal-input">
            <input type="date" id="e-fecha" value="${selectedCalendarDate}" class="modal-input">
            <select id="e-asig" class="modal-input">${asigOpt}</select>
            <button class="text-btn" style="width:100%; padding:10px; background:var(--primary); color:white; border-radius:10px; font-weight:700;" onclick="saveExam()">Guardar Examen</button>
        `;
    }
}

function updateEventFields(sel) {
    let opt = sel.options[sel.selectedIndex];
    document.getElementById('h-prof').value = opt.getAttribute('data-prof');
    document.getElementById('h-aula').value = opt.getAttribute('data-aula');
    document.getElementById('h-color').value = opt.getAttribute('data-color');
}

function openSettingsModal() {
    const modal = document.getElementById('app-modal');
    document.getElementById('modal-title').innerText = 'Ajustes & Centros';
    document.getElementById('modal-body').innerHTML = `
        <label style="font-size:0.8rem; color:var(--text-muted);">Color Principal de la App:</label>
        <input type="color" id="cfg-color" value="${appData.primaryColor}" onchange="changeColor(this.value)" class="modal-input" style="height:40px; cursor:pointer;">
        <p style="font-size:0.85rem; color:var(--text-muted); margin-top:10px;">Gestión de Asignaturas y Centros con códigos de colores amplios.</p>
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
        appData.repertorio.push({ id: Date.now(), seccion: document.getElementById('r-sec').value, obra, compositor: document.getElementById('r-comp').value, subtareas: [], notasTecnicas: [] });
        saveData(); closeModal(); initApp();
    }
}

function saveSchedule() {
    let fecha = document.getElementById('h-fecha').value;
    let asignatura = document.getElementById('h-asig').value;
    if(fecha && asignatura) {
        appData.horario.push({ 
            id: Date.now(), 
            fecha, 
            diaSemana: document.getElementById('h-diasem').value,
            horaInicio: document.getElementById('h-ini').value, 
            horaFin: document.getElementById('h-fin').value, 
            asignatura, 
            profesor: document.getElementById('h-prof').value,
            aula: document.getElementById('h-aula').value,
            color: document.getElementById('h-color').value,
            notasClase: []
        });
        saveData(); closeModal(); initApp();
    }
}

function saveStudySession() {
    let minutos = parseInt(document.getElementById('s-mins').value) || 0;
    if(minutos > 0) {
        appData.historialEstudio.push({ id: Date.now(), asignatura: document.getElementById('s-asig').value, minutos, fecha: new Date().toLocaleDateString() });
        // Actualizar racha si se estudia hoy
        appData.streak.count += 1;
        appData.streak.lastDate = new Date().toISOString().split('T')[0];
        saveData(); closeModal(); initApp();
    }
}

function saveExam() {
    let nombre = document.getElementById('e-nombre').value;
    let fecha = document.getElementById('e-fecha').value;
    let asignatura = document.getElementById('e-asig').value;
    if(nombre && fecha) {
        appData.examenes.push({ id: Date.now(), nombre, fecha, asignatura });
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

// Temporizador interactivo
function changeTimerDuration(mins) {
    timerDurationMinutes = parseInt(mins) || 25;
    if(!isTimerRunning) {
        timeLeft = timerDurationMinutes * 60;
        updateTimerDisplay();
    }
}

function populateTimerSubjects() {
    const sel = document.getElementById('timer-subject');
    if(sel) sel.innerHTML = appData.asignaturas.map(a => `<option value="${a.nombre}">${a.nombre}</option>`).join('');
}

function updateTimerDisplay() {
    let m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    let s = (timeLeft % 60).toString().padStart(2, '0');
    document.getElementById('timer-display').innerText = `${m}:${s}`;
}

function toggleTimer() {
    const btn = document.getElementById('btn-toggle-timer');
    if(isTimerRunning) {
        clearInterval(timerInterval); isTimerRunning = false;
        btn.innerText = '▶ Iniciar';
    } else {
        isTimerRunning = true;
        btn.innerText = '❚❚ Pausar';
        timerInterval = setInterval(() => {
            if(timeLeft > 0) {
                timeLeft--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval); isTimerRunning = false;
                btn.innerText = '▶ Iniciar';
                alert('¡Sesión finalizada!');
                let asig = document.getElementById('timer-subject').value;
                appData.historialEstudio.push({ id: Date.now(), asignatura: asig, minutos: timerDurationMinutes, fecha: new Date().toLocaleDateString() });
                appData.streak.count += 1;
                appData.streak.lastDate = new Date().toISOString().split('T')[0];
                saveData(); initApp();
                timeLeft = timerDurationMinutes * 60;
                updateTimerDisplay();
            }
        }, 1000);
    }
}

function resetTimer() {
    clearInterval(timerInterval); isTimerRunning = false; timeLeft = timerDurationMinutes * 60;
    document.getElementById('btn-toggle-timer').innerText = '▶ Iniciar';
    updateTimerDisplay();
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

window.onload = () => { initApp(); updateTimerDisplay(); };

// Función para solicitar permisos de notificación al navegador/dispositivo
async function solicitarPermisoNotificaciones() {
  if (!("Notification" in window)) {
    console.log("Este navegador no soporta notificaciones.");
    return;
  }
  
  let permission = await Notification.requestPermission();
  if (permission === "granted") {
    console.log("Permiso de notificaciones concedido.");
    programarRecordatorioDiario();
  }
}

// Ejemplo de aviso para mantener la racha viva
function programarRecordatorioDiario() {
  // Se puede programar usando la hora configurada en la sección de horarios
  setTimeout(() => {
    if (Notification.permission === "granted") {
      new Notification("¡Hora de practicar! 🎷", {
        body: "No rompas tu racha de estudio de hoy. ¡Dale caña!",
        icon: "/path-to-icon.png"
      });
    }
  }, 3600000); // Ejemplo de intervalo
}

