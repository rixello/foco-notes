document.addEventListener('DOMContentLoaded', function () {
    const terminalInput = document.getElementById('terminal-input');
    const terminalOverlay = document.getElementById('terminal-overlay');
    const terminalOutput = document.querySelector('.terminal-output');
    const closeTerminalButton = document.getElementById('close-terminal');
    const notesContainer = document.getElementById('notes-container');

    loadSavedNotes();

    closeTerminalButton.addEventListener('click', () => {
        terminalOverlay.classList.remove('show');
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && terminalOverlay.classList.contains('show')) {
            const command = terminalInput.value.trim();
            terminalInput.value = '';
            processCommand(command);
        }
        handleGlobalShortcuts(event);
    });

    function handleGlobalShortcuts(event) {
        if (event.key === '`') {
            terminalOverlay.classList.toggle('show');
        } else if (event.ctrlKey && event.key === 'ArrowDown') {
            closeAllModules();
        } else if (event.ctrlKey && event.key === 'ArrowUp') {
            maximizeAllModules();
        } else if (event.ctrlKey && event.key.toLowerCase() === 'i') {
            tileLayout();
        }
    }

    function processCommand(command) {
        const [cmd, ...args] = command.split(' ');
        switch (cmd) {
            case 'nn':
                createNewNoteModule(args);
                break;
            case 'maximize_all':
                maximizeAllModules();
                break;
            case 'close_all':
                closeAllModules();
                break;
            default:
                terminalOutput.innerHTML += `<div>Unknown command: ${cmd}</div>`;
        }
    }

    function createNewNoteModule(args) {
        const noteName = args[0];
        const noteTextArr = args.slice(1);
        const noteText = noteTextArr.join(' ');

        if (!noteName || !noteText) {
            terminalOutput.innerHTML += `<div>Usage: nn [note_name] [note_text]</div>`;
            return;
        }

        const noteModule = document.createElement('div');
        noteModule.classList.add('module', 'note-module');
        noteModule.dataset.noteName = noteName;
        noteModule.dataset.noteText = noteText;
        noteModule.innerHTML = `
            <div class="module-header">
                <h2>${noteName}</h2>
            </div>
            <div class="module-content" contenteditable="true">
                ${noteText}
            </div>
            <div class="resize-handle"></div>
        `;

        notesContainer.appendChild(noteModule);
        addModuleEventListeners(noteModule);
        saveNotes();
    }

    function addModuleEventListeners(module) {
        const header = module.querySelector('.module-header');
        const resizeHandle = module.querySelector('.resize-handle');
        const content = module.querySelector('.module-content');

        // Drag functionality
        header.addEventListener('mousedown', (event) => {
            event.preventDefault();
            const rect = module.getBoundingClientRect();
            const offsetX = event.clientX - rect.left;
            const offsetY = event.clientY - rect.top;

            function onMouseMove(event) {
                module.style.left = `${event.clientX - offsetX}px`;
                module.style.top = `${event.clientY - offsetY}px`;
            }

            function onMouseUp() {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                saveNotes();
            }

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        // Resize functionality
        resizeHandle.addEventListener('mousedown', (event) => {
            event.preventDefault();
            const startX = event.clientX;
            const startY = event.clientY;
            const startWidth = parseInt(document.defaultView.getComputedStyle(module).width, 10);
            const startHeight = parseInt(document.defaultView.getComputedStyle(module).height, 10);

            function doDrag(e) {
                module.style.width = (startWidth + e.clientX - startX) + 'px';
                module.style.height = (startHeight + e.clientY - startY) + 'px';
            }

            function stopDrag() {
                document.removeEventListener('mousemove', doDrag);
                document.removeEventListener('mouseup', stopDrag);
                saveNotes();
            }

            document.addEventListener('mousemove', doDrag);
            document.addEventListener('mouseup', stopDrag);
        });

        // Keyboard shortcuts for module actions
        document.addEventListener('keydown', (event) => {
            if (event.altKey && event.key === 'm' && module.classList.contains('selected')) {
                module.classList.toggle('minimized');
            }
            if (event.altKey && event.key === 'x' && module.classList.contains('selected')) {
                module.classList.toggle('expanded');
                if (module.classList.contains('expanded')) {
                    module.style.top = '50%';
                    module.style.left = '50%';
                    module.style.transform = 'translate(-50%, -50%)';
                    module.style.width = '80%';
                    module.style.height = '80%';
                    content.focus();
                } else {
                    module.style.transform = 'none';
                    module.style.width = '';
                    module.style.height = '';
                }
            }
            if (event.altKey && event.key === 'd' && module.classList.contains('selected')) {
                module.remove();
                saveNotes();
            }
        });

        content.addEventListener('blur', () => {
            module.dataset.noteText = content.innerText;
            saveNotes();
        });
    }

    function maximizeAllModules() {
        document.querySelectorAll('.module').forEach((module) => {
            module.classList.add('expanded');
            module.style.top = '50%';
            module.style.left = '50%';
            module.style.transform = 'translate(-50%, -50%)';
            module.style.width = '80%';
            module.style.height = '80%';
        });
    }

    function closeAllModules() {
        document.querySelectorAll('.module').forEach((module) => {
            module.remove();
        });
        localStorage.removeItem('notes');
    }

    function saveNotes() {
        const notes = [];
        document.querySelectorAll('.note-module').forEach(module => {
            notes.push({
                noteName: module.dataset.noteName,
                noteText: module.dataset.noteText,
                position: {
                    top: module.style.top,
                    left: module.style.left,
                    width: module.style.width,
                    height: module.style.height,
                }
            });
        });
        localStorage.setItem('notes', JSON.stringify(notes));
    }

    function loadSavedNotes() {
        const savedNotes = JSON.parse(localStorage.getItem('notes'));
        if (savedNotes) {
            savedNotes.forEach(note => {
                const noteModule = document.createElement('div');
                noteModule.classList.add('module', 'note-module');
                noteModule.dataset.noteName = note.noteName;
                noteModule.dataset.noteText = note.noteText;
                noteModule.style.top = note.position.top;
                noteModule.style.left = note.position.left;
                noteModule.style.width = note.position.width;
                noteModule.style.height = note.position.height;
                noteModule.innerHTML = `
                    <div class="module-header">
                        <h2>${note.noteName}</h2>
                    </div>
                    <div class="module-content" contenteditable="true">
                        ${note.noteText}
                    </div>
                    <div class="resize-handle"></div>
                `;
                notesContainer.appendChild(noteModule);
                addModuleEventListeners(noteModule);
            });
        }
    }

    function tileLayout() {
        const modules = document.querySelectorAll('.module');
        const containerWidth = notesContainer.offsetWidth;
        const moduleWidth = containerWidth / modules.length;
        modules.forEach((module, index) => {
            module.style.width = `${moduleWidth}px`;
            module.style.height = '100%';
            module.style.left = `${moduleWidth * index}px`;
            module.style.top = '0px';
            module.classList.remove('expanded', 'minimized');
        });
        saveNotes();
    }

    // Select a module to apply move commands
    document.addEventListener('click', (event) => {
        const module = event.target.closest('.module');
        if (module) {
            document.querySelectorAll('.module').forEach(mod => mod.classList.remove('selected'));
            module.classList.add('selected');
        }
    });
});
