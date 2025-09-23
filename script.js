// == TaskMaster Pro - script.js (melhorado) ==
// Mantive toda a lógica original e acrescentei funcionalidades:
// - Toasts, progresso visual, export CSV, atalhos, ripple effect, salvar preferências, animações pequenas.
// - Comentários em PT-BR para facilitar leitura.

document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM (mantidos)
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const totalTasks = document.getElementById('totalTasks');
    const activeTasks = document.getElementById('activeTasks');
    const completedTasks = document.getElementById('completedTasks');
    const highPriorityTasks = document.getElementById('highPriorityTasks');
    const clearCompletedBtn = document.getElementById('clearCompleted');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const themeToggle = document.getElementById('themeToggle');
    const exportBtn = document.getElementById('exportTasks');
    const exportCSVBtn = document.getElementById('exportCSV');
    const importBtn = document.getElementById('importTasks');
    const importFile = document.getElementById('importFile');
    const modal = document.getElementById('confirmationModal');
    const confirmDelete = document.getElementById('confirmDelete');
    const cancelDelete = document.getElementById('cancelDelete');

    // Detalhes da tarefa (mantidos)
    const taskCategory = document.getElementById('taskCategory');
    const taskPriority = document.getElementById('taskPriority');
    const taskDueDate = document.getElementById('taskDueDate');

    // Novos elementos de UI
    const toastContainer = document.getElementById('toastContainer');
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');

    // Estado da aplicação (carrega do localStorage)
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = localStorage.getItem('tm_currentFilter') || 'all';
    let searchQuery = '';
    let sortBy = localStorage.getItem('tm_sortBy') || 'newest';
    let taskToDelete = null;

    // Inicializar a aplicação
    function init() {
        // Aplicar filtros/ordem salvos
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === currentFilter);
        });
        sortSelect.value = sortBy;

        renderTasks();
        updateStats();
        addEventListeners();
        applySavedTheme();
        animateStatCards();
    }

    // ---------- Event listeners ----------
    function addEventListeners() {
        addTaskBtn.addEventListener('click', addTask);
        taskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addTask();
        });

        // Ripple effect para botões principais
        [addTaskBtn, ...document.querySelectorAll('.btn-secondary, .filter-btn, .task-actions button, .btn-danger')].forEach(btn => {
            btn.addEventListener('click', createRipple);
        });

        clearCompletedBtn.addEventListener('click', clearCompletedTasks);

        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentFilter = this.dataset.filter;
                localStorage.setItem('tm_currentFilter', currentFilter);
                renderTasks();
            });
        });

        searchInput.addEventListener('input', function() {
            searchQuery = this.value.toLowerCase();
            renderTasks();
        });

        sortSelect.addEventListener('change', function() {
            sortBy = this.value;
            localStorage.setItem('tm_sortBy', sortBy);
            renderTasks();
        });

        themeToggle.addEventListener('click', toggleTheme);

        exportBtn.addEventListener('click', exportTasksToJSON);
        exportCSVBtn.addEventListener('click', exportTasksToCSV);
        importBtn.addEventListener('click', triggerImport);
        importFile.addEventListener('change', importTasksFromJSON);

        confirmDelete.addEventListener('click', deleteTaskConfirmed);
        cancelDelete.addEventListener('click', closeModal);

        // Fechar modal ao clicar fora dele
        window.addEventListener('click', function(e) {
            if (e.target === modal) closeModal();
        });

        // Atalhos de teclado
        window.addEventListener('keydown', handleShortcuts);

        // Acessibilidade: foco rápido no search com Ctrl+F (consumir evento)
        searchInput.addEventListener('focus', () => { searchInput.select(); });
    }

    // ---------- Funções principais (mantidas e extendidas) ----------
    function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText === '') {
            shakeElement(taskInput);
            showToast('Escreva uma tarefa antes de adicionar.', 'warn');
            return;
        }

        const newTask = {
            id: Date.now(),
            text: taskText,
            completed: false,
            category: taskCategory.value,
            priority: taskPriority.value,
            dueDate: taskDueDate.value || null,
            createdAt: new Date().toISOString()
        };

        tasks.push(newTask);
        saveTasks();
        renderTasks();
        updateStats();

        taskInput.value = '';
        taskInput.focus();

        playSound('add');
        showToast('Tarefa adicionada com sucesso.', 'success');
        animateStatCards();
    }

    function renderTasks() {
        taskList.innerHTML = '';
        let filteredTasks = filterTasks(tasks);
        filteredTasks = searchTasks(filteredTasks);
        filteredTasks = sortTasks(filteredTasks);

        if (filteredTasks.length === 0) {
            const emptyState = document.createElement('li');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `
                <i class="fas fa-clipboard-list"></i>
                <p>Nenhuma tarefa ${getEmptyStateMessage()}</p>
            `;
            taskList.appendChild(emptyState);
            updateProgress();
            return;
        }

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.category} ${task.completed ? 'completed' : ''}`;
            li.dataset.id = task.id;

            let dueDateFormatted = '';
            if (task.dueDate) {
                const dueDate = new Date(task.dueDate);
                dueDateFormatted = dueDate.toLocaleDateString('pt-BR');
            }

            // Badge para prioridade / categoria
            const priorityBadge = `<span class="badge priority-${task.priority}" title="Prioridade">${getPriorityText(task.priority)}</span>`;
            const categoryBadge = `<span class="badge" title="Categoria">${getCategoryText(task.category)}</span>`;

            li.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Marcar tarefa como concluída">
                <div class="task-content">
                    <div class="task-text">${escapeHtml(task.text)}</div>
                    <div class="task-meta">
                        <span class="task-priority">${priorityBadge}</span>
                        <span class="task-category">${categoryBadge}</span>
                        ${task.dueDate ? `
                        <span class="task-due" title="Data de vencimento">
                            <i class="fas fa-calendar"></i> ${dueDateFormatted}
                        </span>` : ''}
                    </div>
                </div>
                <div class="task-actions" role="group" aria-label="Ações da tarefa">
                    <button class="btn-edit" title="Editar tarefa"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" title="Excluir tarefa"><i class="fas fa-trash"></i></button>
                </div>
            `;

            taskList.appendChild(li);
        });

        addTaskEventListeners();
        updateProgress();
    }

    function filterTasks(tasksList) {
        switch(currentFilter) {
            case 'active':
                return tasksList.filter(task => !task.completed);
            case 'completed':
                return tasksList.filter(task => task.completed);
            default:
                return tasksList;
        }
    }

    function searchTasks(tasksList) {
        if (!searchQuery) return tasksList;
        return tasksList.filter(task =>
            task.text.toLowerCase().includes(searchQuery) ||
            getCategoryText(task.category).toLowerCase().includes(searchQuery) ||
            getPriorityText(task.priority).toLowerCase().includes(searchQuery)
        );
    }

    function sortTasks(tasksList) {
        // Criamos uma cópia para evitar mutações inesperadas
        const copy = [...tasksList];
        switch(sortBy) {
            case 'newest':
                return copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            case 'oldest':
                return copy.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            case 'priority':
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return copy.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
            case 'alphabetical':
                return copy.sort((a, b) => a.text.localeCompare(b.text));
            default:
                return copy;
        }
    }

    function addTaskEventListeners() {
        // Checkboxes
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const taskId = parseInt(this.closest('.task-item').dataset.id);
                toggleTaskCompleted(taskId);
            });
        });

        // Deletar
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const taskId = parseInt(this.closest('.task-item').dataset.id);
                showDeleteConfirmation(taskId);
            });
        });

        // Editar
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const taskId = parseInt(this.closest('.task-item').dataset.id);
                editTask(taskId);
            });
        });

        // visual feedback ao concluir tarefa (animação)
        document.querySelectorAll('.task-item.completed').forEach(item => {
            // pequeno efeito de destaque
            item.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.02)' }, { transform: 'scale(1)' }], { duration: 280 });
        });
    }

    function toggleTaskCompleted(taskId) {
        tasks = tasks.map(task => {
            if (task.id === taskId) {
                const updatedTask = { ...task, completed: !task.completed };
                playSound(updatedTask.completed ? 'complete' : 'incomplete');
                showToast(updatedTask.completed ? 'Tarefa marcada como concluída.' : 'Tarefa marcada como pendente.', 'success');
                return updatedTask;
            }
            return task;
        });

        saveTasks();
        renderTasks();
        updateStats();
        animateStatCards();
    }

    function showDeleteConfirmation(taskId) {
        taskToDelete = taskId;
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
    }

    function closeModal() {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        taskToDelete = null;
    }

    function deleteTaskConfirmed() {
        if (taskToDelete) {
            tasks = tasks.filter(task => task.id !== taskToDelete);
            saveTasks();
            renderTasks();
            updateStats();
            closeModal();
            playSound('delete');
            showToast('Tarefa excluída.', 'warn');
            animateStatCards();
        }
    }

    function editTask(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        taskInput.value = task.text;
        taskCategory.value = task.category;
        taskPriority.value = task.priority;
        taskDueDate.value = task.dueDate || '';

        // remover task antiga para evitar duplicação
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks();
        renderTasks();
        updateStats();

        taskInput.focus();
        showToast('Editando tarefa. Faça as alterações e pressione "Adicionar".', 'success');
    }

    function clearCompletedTasks() {
        if (!confirm('Tem certeza que deseja limpar todas as tarefas concluídas?')) return;
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        updateStats();
        playSound('clear');
        showToast('Tarefas concluídas limpas.', 'success');
        animateStatCards();
    }

    function updateStats() {
        const total = tasks.length;
        const active = tasks.filter(task => !task.completed).length;
        const completed = tasks.filter(task => task.completed).length;
        const highPriority = tasks.filter(task => task.priority === 'high' && !task.completed).length;

        totalTasks.textContent = total;
        activeTasks.textContent = active;
        completedTasks.textContent = completed;
        highPriorityTasks.textContent = highPriority;

        // Atualizar progresso
        updateProgress();
    }

    // ---------- Tema (salvamento) ----------
    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        themeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        showToast(`Tema alternado para ${isDarkMode ? 'escuro' : 'claro'}.`, 'success');
    }

    function applySavedTheme() {
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        if (savedDarkMode) {
            document.body.classList.add('dark-mode');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }

    // ---------- Export / Import ----------
    function exportTasksToJSON() {
        const dataStr = JSON.stringify(tasks, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', 'tarefas.json');
        document.body.appendChild(linkElement);
        linkElement.click();
        linkElement.remove();
        showToast('Exportado em JSON.', 'success');
    }

    function exportTasksToCSV() {
        if (!tasks.length) { showToast('Nenhuma tarefa para exportar.', 'warn'); return; }
        // Cabeçalho
        const header = ['id,text,completed,category,priority,dueDate,createdAt'];
        const rows = tasks.map(t => {
            // escape simples para CSV
            const safeText = `"${(t.text || '').replace(/"/g, '""')}"`;
            return [t.id, safeText, t.completed, t.category, t.priority, t.dueDate || '', t.createdAt].join(',');
        });
        const csvContent = header.concat(rows).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tarefas.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast('Exportado em CSV.', 'success');
    }

    function triggerImport() { importFile.click(); }

    function importTasksFromJSON(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedTasks = JSON.parse(e.target.result);
                if (Array.isArray(importedTasks)) {
                    importedTasks.forEach(task => {
                        if (!task.id) task.id = Date.now() + Math.floor(Math.random() * 1000);
                    });
                    tasks = [...tasks, ...importedTasks];
                    saveTasks();
                    renderTasks();
                    updateStats();
                    showToast(`${importedTasks.length} tarefas importadas.`, 'success');
                } else {
                    throw new Error('Formato inválido');
                }
            } catch (error) {
                showToast('Erro ao importar tarefas. Verifique o arquivo.', 'warn');
                console.error(error);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    // ---------- Persistência ----------
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // ---------- Helpers ----------
    function getPriorityText(priority) {
        const priorities = { 'low': 'Baixa', 'medium': 'Média', 'high': 'Alta' };
        return priorities[priority] || 'Média';
    }

    function getCategoryText(category) {
        const categories = { 'work': 'Trabalho', 'personal': 'Pessoal', 'study': 'Estudo', 'health': 'Saúde', 'other': 'Outro' };
        return categories[category] || 'Outro';
    }

    function getEmptyStateMessage() {
        if (searchQuery) return `encontrada para "${searchQuery}"`;
        switch(currentFilter) {
            case 'active': return 'pendente';
            case 'completed': return 'concluída';
            default: return 'criada';
        }
    }

    function playSound(action) {
        // Mantive console para não exigir assets externos. Caso queira sons, adicione arquivos em /sounds e habilite.
        // new Audio(`sounds/${action}.mp3`).play().catch(()=>{});
        console.log(`Sound effect: ${action}`);
    }

    function shakeElement(element) {
        element.classList.add('shake');
        setTimeout(() => element.classList.remove('shake'), 600);
    }

    // Toasts simples
    function showToast(message, type = 'default', duration = 3200) {
        const toast = document.createElement('div');
        toast.className = `toast ${type === 'success' ? 'success' : type === 'warn' ? 'warn' : ''}`;
        toast.innerHTML = `<div class="toast-msg">${escapeHtml(message)}</div>`;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 400);
        }, duration);
    }

    // Progress bar
    function updateProgress() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
        progressFill.style.width = percent + '%';
        progressPercent.textContent = percent + '%';
    }

    // Ripple click effect
    function createRipple(e) {
        const btn = e.currentTarget;
        const circle = document.createElement('span');
        circle.className = 'ripple';
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        circle.style.width = circle.style.height = size + 'px';
        circle.style.left = (e.clientX - rect.left - size / 2) + 'px';
        circle.style.top = (e.clientY - rect.top - size / 2) + 'px';
        btn.appendChild(circle);
        setTimeout(() => circle.remove(), 600);
    }

    // Shortcuts: Enter handled; Ctrl+F foca pesquisa; Ctrl+/ alterna tema
    function handleShortcuts(e) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
            e.preventDefault();
            searchInput.focus();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            toggleTheme();
        }
    }

    // Animar cartões (quando conta muda)
    function animateStatCards() {
        document.querySelectorAll('.stat-card').forEach(card => {
            card.classList.add('animate');
            setTimeout(() => card.classList.remove('animate'), 600);
        });
    }

    // Escape HTML para proteger conteúdo
    function escapeHtml(unsafe) {
        return (unsafe || '').toString().replace(/[&<>"'`=\/]/g, function(s) {
            return {
                '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#x2F;', '`': '&#x60;', '=':'&#x3D;'
            }[s];
        });
    }

    // ---------- Keyboard & accessibility / inicialização ----------
    init();

    // Expor algumas funções no console para debugging rápido (apenas dev)
    window.__tm = {
        tasks,
        saveTasks,
        renderTasks,
        exportTasksToCSV
    };
});
// --- Controles da janela ---
document.querySelector('.win-btn.close').addEventListener('click', () => {
  window.close(); // fecha a janela (Electron intercepta)
});

document.querySelector('.win-btn.minimize').addEventListener('click', () => {
  const { ipcRenderer } = require('electron');
  ipcRenderer.send('minimize-window');
});
