document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
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
    const importBtn = document.getElementById('importTasks');
    const importFile = document.getElementById('importFile');
    const modal = document.getElementById('confirmationModal');
    const confirmDelete = document.getElementById('confirmDelete');
    const cancelDelete = document.getElementById('cancelDelete');
    
    // Elementos dos detalhes da tarefa
    const taskCategory = document.getElementById('taskCategory');
    const taskPriority = document.getElementById('taskPriority');
    const taskDueDate = document.getElementById('taskDueDate');
    
    // Estado da aplicação
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let searchQuery = '';
    let sortBy = 'newest';
    let taskToDelete = null;
    
    // Inicializar a aplicação
    function init() {
        renderTasks();
        updateStats();
        addEventListeners();
        applySavedTheme();
    }
    
    // Adicionar event listeners
    function addEventListeners() {
        addTaskBtn.addEventListener('click', addTask);
        taskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addTask();
        });
        
        clearCompletedBtn.addEventListener('click', clearCompletedTasks);
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentFilter = this.dataset.filter;
                renderTasks();
            });
        });
        
        searchInput.addEventListener('input', function() {
            searchQuery = this.value.toLowerCase();
            renderTasks();
        });
        
        sortSelect.addEventListener('change', function() {
            sortBy = this.value;
            renderTasks();
        });
        
        themeToggle.addEventListener('click', toggleTheme);
        
        exportBtn.addEventListener('click', exportTasksToJSON);
        importBtn.addEventListener('click', triggerImport);
        importFile.addEventListener('change', importTasksFromJSON);
        
        confirmDelete.addEventListener('click', deleteTaskConfirmed);
        cancelDelete.addEventListener('click', closeModal);
        
        // Fechar modal ao clicar fora dele
        window.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // Adicionar nova tarefa
    function addTask() {
        const taskText = taskInput.value.trim();
        
        if (taskText === '') {
            shakeElement(taskInput);
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
        
        // Limpar input e focar nele
        taskInput.value = '';
        taskInput.focus();
        
        // Reproduzir som de adição (se disponível)
        playSound('add');
    }
    
    // Renderizar lista de tarefas
    function renderTasks() {
        // Limpar lista
        taskList.innerHTML = '';
        
        // Filtrar, pesquisar e ordenar tarefas
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
            return;
        }
        
        // Adicionar tarefas à lista
        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.category} ${task.completed ? 'completed' : ''}`;
            li.dataset.id = task.id;
            
            // Formatar data se existir
            let dueDateFormatted = '';
            if (task.dueDate) {
                const dueDate = new Date(task.dueDate);
                dueDateFormatted = dueDate.toLocaleDateString('pt-BR');
            }
            
            li.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <div class="task-text">${task.text}</div>
                    <div class="task-meta">
                        <span class="task-priority ${'priority-' + task.priority}">
                            <i class="fas fa-flag"></i> ${getPriorityText(task.priority)}
                        </span>
                        <span class="task-category">
                            <i class="fas fa-tag"></i> ${getCategoryText(task.category)}
                        </span>
                        ${task.dueDate ? `
                        <span class="task-due">
                            <i class="fas fa-calendar"></i> ${dueDateFormatted}
                        </span>
                        ` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn-edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            taskList.appendChild(li);
        });
        
        // Adicionar event listeners para as novas tarefas
        addTaskEventListeners();
    }
    
    // Filtrar tarefas conforme o filtro atual
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
    
    // Pesquisar tarefas
    function searchTasks(tasksList) {
        if (!searchQuery) return tasksList;
        
        return tasksList.filter(task => 
            task.text.toLowerCase().includes(searchQuery) ||
            getCategoryText(task.category).toLowerCase().includes(searchQuery) ||
            getPriorityText(task.priority).toLowerCase().includes(searchQuery)
        );
    }
    
    // Ordenar tarefas
    function sortTasks(tasksList) {
        switch(sortBy) {
            case 'newest':
                return tasksList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            case 'oldest':
                return tasksList.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            case 'priority':
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return tasksList.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
            case 'alphabetical':
                return tasksList.sort((a, b) => a.text.localeCompare(b.text));
            default:
                return tasksList;
        }
    }
    
    // Adicionar event listeners para as tarefas
    function addTaskEventListeners() {
        // Event listeners para checkboxes
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const taskId = parseInt(this.closest('.task-item').dataset.id);
                toggleTaskCompleted(taskId);
            });
        });
        
        // Event listeners para botões de deletar
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const taskId = parseInt(this.closest('.task-item').dataset.id);
                showDeleteConfirmation(taskId);
            });
        });
        
        // Event listeners para botões de editar
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const taskId = parseInt(this.closest('.task-item').dataset.id);
                editTask(taskId);
            });
        });
    }
    
    // Alternar estado de conclusão da tarefa
    function toggleTaskCompleted(taskId) {
        tasks = tasks.map(task => {
            if (task.id === taskId) {
                const updatedTask = { ...task, completed: !task.completed };
                
                // Reproduzir som de conclusão ou retorno
                playSound(updatedTask.completed ? 'complete' : 'incomplete');
                
                return updatedTask;
            }
            return task;
        });
        
        saveTasks();
        renderTasks();
        updateStats();
    }
    
    // Mostrar confirmação de exclusão
    function showDeleteConfirmation(taskId) {
        taskToDelete = taskId;
        modal.style.display = 'flex';
    }
    
    // Fechar modal
    function closeModal() {
        modal.style.display = 'none';
        taskToDelete = null;
    }
    
    // Confirmar exclusão de tarefa
    function deleteTaskConfirmed() {
        if (taskToDelete) {
            tasks = tasks.filter(task => task.id !== taskToDelete);
            saveTasks();
            renderTasks();
            updateStats();
            closeModal();
            
            // Reproduzir som de exclusão
            playSound('delete');
        }
    }
    
    // Editar tarefa
    function editTask(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        
        // Preencher o formulário com os dados da tarefa
        taskInput.value = task.text;
        taskCategory.value = task.category;
        taskPriority.value = task.priority;
        taskDueDate.value = task.dueDate || '';
        
        // Remover a tarefa antiga
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks();
        renderTasks();
        updateStats();
        
        // Focar no input
        taskInput.focus();
    }
    
    // Limpar tarefas concluídas
    function clearCompletedTasks() {
        if (!confirm('Tem certeza que deseja limpar todas as tarefas concluídas?')) {
            return;
        }
        
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        updateStats();
        
        // Reproduzir som de limpeza
        playSound('clear');
    }
    
    // Atualizar estatísticas
    function updateStats() {
        const total = tasks.length;
        const active = tasks.filter(task => !task.completed).length;
        const completed = tasks.filter(task => task.completed).length;
        const highPriority = tasks.filter(task => task.priority === 'high' && !task.completed).length;
        
        totalTasks.textContent = total;
        activeTasks.textContent = active;
        completedTasks.textContent = completed;
        highPriorityTasks.textContent = highPriority;
    }
    
    // Alternar tema claro/escuro
    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        
        // Alterar ícone do botão
        themeToggle.innerHTML = isDarkMode ? 
            '<i class="fas fa-sun"></i>' : 
            '<i class="fas fa-moon"></i>';
    }
    
    // Aplicar tema salvo
    function applySavedTheme() {
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        if (savedDarkMode) {
            document.body.classList.add('dark-mode');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }
    
    // Exportar tarefas para JSON
    function exportTasksToJSON() {
        const dataStr = JSON.stringify(tasks, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'tarefas.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
    
    // Disparar importação de tarefas
    function triggerImport() {
        importFile.click();
    }
    
    // Importar tarefas de JSON
    function importTasksFromJSON(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedTasks = JSON.parse(e.target.result);
                
                if (Array.isArray(importedTasks)) {
                    // Adicionar IDs únicos para tarefas sem ID
                    importedTasks.forEach(task => {
                        if (!task.id) task.id = Date.now() + Math.floor(Math.random() * 1000);
                    });
                    
                    tasks = [...tasks, ...importedTasks];
                    saveTasks();
                    renderTasks();
                    updateStats();
                    
                    alert(`Tarefas importadas com sucesso! ${importedTasks.length} tarefas adicionadas.`);
                } else {
                    throw new Error('Formato inválido');
                }
            } catch (error) {
                alert('Erro ao importar tarefas. Verifique se o arquivo é válido.');
                console.error(error);
            }
        };
        reader.readAsText(file);
        
        // Limpar o input para permitir importar o mesmo arquivo novamente
        event.target.value = '';
    }
    
    // Salvar tarefas no localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    // Obter texto da prioridade
    function getPriorityText(priority) {
        const priorities = {
            'low': 'Baixa',
            'medium': 'Média',
            'high': 'Alta'
        };
        return priorities[priority] || 'Média';
    }
    
    // Obter texto da categoria
    function getCategoryText(category) {
        const categories = {
            'work': 'Trabalho',
            'personal': 'Pessoal',
            'study': 'Estudo',
            'health': 'Saúde',
            'other': 'Outro'
        };
        return categories[category] || 'Outro';
    }
    
    // Obter mensagem para estado vazio
    function getEmptyStateMessage() {
        if (searchQuery) return `encontrada para "${searchQuery}"`;
        
        switch(currentFilter) {
            case 'active': return 'pendente';
            case 'completed': return 'concluída';
            default: return 'criada';
        }
    }
    
    // Reproduzir som (se disponível)
    function playSound(action) {
        // Em uma implementação real, você adicionaria sons aqui
        console.log(`Sound effect: ${action}`);
        // Exemplo: new Audio(`sounds/${action}.mp3`).play();
    }
    
    // Animação de tremer elemento
    function shakeElement(element) {
        element.classList.add('shake');
        setTimeout(() => {
            element.classList.remove('shake');
        }, 500);
    }
    
    // Inicializar a aplicação
    init();
});