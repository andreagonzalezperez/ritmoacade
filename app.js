let appData = JSON.parse(localStorage.getItem('ritmoAcadeData')) || {
    repertorio: [
        { id: 1, obra: 'Adagio Op. 38', compositor: 'Bargiel', instrumento: 'Piano', estado: 'En proceso', problemas: 'Afinación compases 32-45' }
    ],
    tareas: [
        { id: 1, texto: 'Llevar partitura de Bargiel', asignatura: 'Piano Aplicado', completada: false }
    ]
};

function saveData() {
    localStorage.setItem('ritmoAcadeData', JSON.stringify(appData));
}

const navButtons = document.querySelectorAll('.nav-btn');
const tabSections = document.querySelectorAll('.tab-section');

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        navButtons.forEach(b => b.classList.remove('active'));
        tabSections.forEach(s => s.classList.remove('active'));
        
        btn.classList.add('active');
        const targetTab = btn.getAttribute('data-tab');
        document.getElementById(targetTab).classList.add('active');
    });
});

function switchTab(tabId) {
    document.querySelector(`[data-tab="${tabId}"]`).click();
}

function initToday() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').innerText = new Date().toLocaleDateString('es-ES', options);

    const taskList = document.getElementById('today-tasks-list');
    taskList.innerHTML = '';
    
    if(appData.tareas.length === 0) {
        taskList.innerHTML = '<li>No hay tareas pendientes para hoy. ¡Buen trabajo!</li>';
        return;
    }

    appData.tareas.forEach(t => {
        const li = document.createElement('li');
        li.innerHTML = `<label><input type="checkbox" ${t.completada ? 'checked' : ''} onchange="toggleTask(${t.id})"> ${t.texto} <em>(${t.asignatura})</em></label>`;
        taskList.appendChild(li);
    });
}

function toggleTask(id) {
    const task = appData.tareas.find(t => t.id === id);
    if(task) {
        task.completada = !task.completada;
        saveData();
        initToday();
    }
}

function initRepertoire() {
    const container = document.getElementById('repertoire-container');
    container.innerHTML = '';
    
    appData.repertorio.forEach(rep => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h3>${rep.obra}</h3>
            <p><strong>Compositor:</strong> ${rep.compositor}</p>
            <p><strong>Instrumento:</strong> ${rep.instrumento}</p>
            <p><strong>Estado:</strong> ${rep.estado}</p>
            <p><strong>Problemas a trabajar:</strong> ${rep.problemas}</p>
        `;
        container.appendChild(card);
    });
}

let timerInterval;
let timeLeft = 25 * 60;

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('timer-display').innerText = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
            alert('¡Sesión de estudio terminada! Buen trabajo.');
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
    timeLeft = 25 * 60;
    updateTimerDisplay();
}

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "ritmoacade_backup.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importData(event) {
    const fileReader = new FileReader();
    if(event.target.files[0]) {
        fileReader.readAsText(event.target.files[0], "UTF-8");
        fileReader.onload = (e) => {
            try {
                appData = JSON.parse(e.target.result);
                saveData();
                initToday();
                initRepertoire();
                alert('¡Datos importados con éxito!');
            } catch (error) {
                alert('El archivo no es válido.');
            }
        }
    }
}

window.onload = () => {
    initToday();
    initRepertoire();
    updateTimerDisplay();
};
