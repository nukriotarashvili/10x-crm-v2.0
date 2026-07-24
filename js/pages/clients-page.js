import {
    applyFieldErrors,
    attachLiveInputErrorClear,
    clearErrors,
    showToast
} from '../utils/dom.js';
import {
    attachDebouncedClientSearch,
    createClient,
    exportClientsToCsv,
    filterAndSortClients,
    getClientsState,
    getHasMoreClients,
    KANBAN_STATUSES,
    loadClients,
    loadMoreClients,
    persistClientStatus,
    removeClient,
    setClientStatusLocal
} from '../services/clients.js';

const formatDealValue = (value) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(value);

const buildListCardElement = (client) => {
    const card = document.createElement('div');
    const statusClass = client.status.toLowerCase();
    card.className = `client-card status-${statusClass}`;
    card.setAttribute('data-id', client.id);

    card.innerHTML = `
        <img src="${client.image || 'https://dummyjson.com/icon/default/128'}" alt="${client.name}">
        <div class="info">
            <h3>${client.name}</h3>
            <p>${client.company || 'No Company'} • ${client.email}</p>
            <p class="deal-value">${formatDealValue(client.dealValue)}</p>
        </div>
        <div>
            <span class="badge ${statusClass}">${client.status}</span>
        </div>
        <button type="button" class="delete-btn" data-id="${client.id}">Delete</button>
    `;

    return card;
};

const buildKanbanCardElement = (client) => {
    const card = document.createElement('article');
    const statusClass = client.status.toLowerCase();
    card.className = `kanban-card status-${statusClass}`;
    card.setAttribute('data-id', client.id);
    card.draggable = true;

    card.innerHTML = `
        <h4>${client.name}</h4>
        <p class="kanban-card__meta">${client.company || 'No Company'}</p>
        <p class="kanban-card__meta">${client.email}</p>
        <p class="deal-value">${formatDealValue(client.dealValue)}</p>
    `;

    /**
     * HTML5 Drag & Drop — dragstart stores the client id in dataTransfer so drop
     * targets (Kanban columns) know which record to move.
     */
    card.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', client.id.toString());
        event.dataTransfer.effectAllowed = 'move';
        card.classList.add('is-dragging');
    });

    card.addEventListener('dragend', () => {
        card.classList.remove('is-dragging');
    });

    return card;
};

const renderListClients = (clientsArray, listContainer, { appendOnly = null } = {}) => {
    if (appendOnly && appendOnly.length) {
        appendOnly.forEach((client) => {
            listContainer.appendChild(buildListCardElement(client));
        });
        return;
    }

    listContainer.innerHTML = '';

    if (clientsArray.length === 0) {
        listContainer.innerHTML = '<div class="loading-state">No clients found.</div>';
        return;
    }

    clientsArray.forEach((client) => {
        listContainer.appendChild(buildListCardElement(client));
    });
};

const renderKanbanBoard = (clientsArray, boardContainer) => {
    boardContainer.innerHTML = '';

    KANBAN_STATUSES.forEach((status) => {
        const column = document.createElement('section');
        column.className = 'kanban-column';
        column.dataset.status = status;

        const inColumn = clientsArray.filter((client) => client.status === status);

        column.innerHTML = `
            <header class="kanban-column__header">
                <h3>${status}</h3>
                <span class="kanban-column__count">${inColumn.length}</span>
            </header>
            <div class="kanban-column__body" data-status="${status}"></div>
        `;

        const body = column.querySelector('.kanban-column__body');
        inColumn.forEach((client) => {
            body.appendChild(buildKanbanCardElement(client));
        });

        boardContainer.appendChild(column);
    });
};

/**
 * Column drop zones use dragover (must preventDefault to allow drop) and drop.
 * On drop we read the client id + target status, update UI/state immediately,
 * then persist to Supabase in the background.
 */
const attachKanbanDragDrop = (boardContainer, onStatusChange) => {
    boardContainer.querySelectorAll('.kanban-column__body').forEach((dropZone) => {
        dropZone.addEventListener('dragover', (event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            dropZone.classList.add('is-drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('is-drag-over');
        });

        dropZone.addEventListener('drop', (event) => {
            event.preventDefault();
            dropZone.classList.remove('is-drag-over');

            const clientId = event.dataTransfer.getData('text/plain');
            const newStatus = dropZone.dataset.status;
            if (!clientId || !newStatus) return;

            onStatusChange(clientId, newStatus);
        });
    });
};

export async function initClientsPage() {
    const listView = document.getElementById('clientsListView');
    const kanbanView = document.getElementById('clientsKanbanView');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const viewListBtn = document.getElementById('viewListBtn');
    const viewKanbanBtn = document.getElementById('viewKanbanBtn');
    const exportCsvBtn = document.getElementById('exportCsvBtn');

    if (!listView || !kanbanView) return;

    let activeFilter = 'All';
    let viewMode = 'list';

    const addClientBtn = document.getElementById('addClientBtn');
    const addClientModal = document.getElementById('addClientModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const addClientForm = document.getElementById('addClientForm');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');

    const getFilteredClients = () =>
        filterAndSortClients(getClientsState(), {
            searchTerm: searchInput.value.trim(),
            activeFilter,
            sortValue: sortSelect.value
        });

    const syncLoadMoreButton = () => {
        if (!loadMoreBtn) return;
        const show = viewMode === 'list' && getHasMoreClients();
        loadMoreBtn.hidden = !show;
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = 'Load More';
    };

    const renderViews = ({ appendOnly = null } = {}) => {
        const filtered = getFilteredClients();

        if (viewMode === 'kanban') {
            listView.hidden = true;
            kanbanView.hidden = false;
            renderKanbanBoard(filtered, kanbanView);
            attachKanbanDragDrop(kanbanView, handleKanbanStatusChange);
        } else {
            kanbanView.hidden = true;
            listView.hidden = false;
            renderListClients(filtered, listView, { appendOnly });
        }

        syncLoadMoreButton();
    };

    const handleKanbanStatusChange = (clientId, newStatus) => {
        const localUpdate = setClientStatusLocal(clientId, newStatus);
        if (!localUpdate?.changed) {
            return;
        }

        renderViews();
        showToast('Status updated ✓', 'success');

        persistClientStatus(clientId, newStatus).catch(() => {
            setClientStatusLocal(clientId, localUpdate.previousStatus);
            renderViews();
            showToast('Sync failed — status reverted', 'error');
        });
    };

    const openAddClientModal = () => {
        if (!addClientModal) return;
        addClientModal.style.display = 'flex';
    };

    const closeModal = () => {
        if (!addClientModal) return;
        addClientModal.style.display = 'none';
        addClientForm?.reset();
        if (addClientForm) clearErrors(addClientForm);
    };

    addClientBtn?.addEventListener('click', openAddClientModal);
    closeModalBtn?.addEventListener('click', closeModal);
    addClientModal?.addEventListener('click', (event) => {
        if (event.target === addClientModal) closeModal();
    });

    if (addClientForm) {
        attachLiveInputErrorClear(addClientForm);

        addClientForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            clearErrors(addClientForm);

            const formData = {
                name: document.getElementById('clientName').value.trim(),
                email: document.getElementById('clientEmail').value.trim(),
                phone: document.getElementById('clientPhone').value.trim(),
                company: document.getElementById('clientCompany').value.trim(),
                dealValue: parseFloat(document.getElementById('clientDealValue').value),
                status: document.getElementById('clientStatus').value
            };

            try {
                const result = await createClient(formData);
                if (!result.ok) {
                    if (result.errors) {
                        applyFieldErrors(result.errors);
                    } else {
                        showToast(
                            result.message || 'Could not add client. Are you logged in?',
                            'error'
                        );
                    }
                    return;
                }

                renderViews();
                closeModal();
                showToast('Client added ✓', 'success');
            } catch {
                showToast('Error adding client', 'error');
            }
        });
    }

    listView.addEventListener('click', async (event) => {
        if (!event.target.classList.contains('delete-btn')) return;

        event.stopPropagation();
        const clientId = event.target.getAttribute('data-id');

        if (!confirm('Delete this client? This cannot be undone.')) return;

        try {
            await removeClient(clientId);
            renderViews();
            showToast('Client deleted ✓', 'success');
        } catch {
            showToast('Error deleting client', 'error');
        }
    });

    attachDebouncedClientSearch(searchInput, () => renderViews(), 300);
    sortSelect?.addEventListener('change', () => renderViews());

    document.querySelectorAll('.filters .chip').forEach((chip) => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.filters .chip').forEach((c) => c.classList.remove('active'));
            chip.classList.add('active');
            activeFilter = chip.dataset.status;
            renderViews();
        });
    });

    viewListBtn?.addEventListener('click', () => {
        viewMode = 'list';
        viewListBtn.classList.add('active');
        viewKanbanBtn?.classList.remove('active');
        renderViews();
    });

    viewKanbanBtn?.addEventListener('click', () => {
        viewMode = 'kanban';
        viewKanbanBtn.classList.add('active');
        viewListBtn?.classList.remove('active');
        renderViews();
    });

    exportCsvBtn?.addEventListener('click', () => {
        const rows = getFilteredClients();
        if (!rows.length) {
            showToast('Nothing to export', 'error');
            return;
        }
        exportClientsToCsv(rows);
        showToast('CSV downloaded ✓', 'success');
    });

    loadMoreBtn?.addEventListener('click', async () => {
        loadMoreBtn.disabled = true;
        loadMoreBtn.textContent = 'Loading…';

        try {
            const { added } = await loadMoreClients();
            const filteredAdded = filterAndSortClients(added, {
                searchTerm: searchInput.value.trim(),
                activeFilter,
                sortValue: sortSelect.value
            });
            renderViews({ appendOnly: filteredAdded });
        } catch {
            showToast('Could not load more clients', 'error');
        } finally {
            syncLoadMoreButton();
        }
    });

    await loadClients(listView);
    if (listView.querySelector('.error-state')) {
        showToast('Failed to load clients — you can still add new ones', 'error');
    }

    renderViews();
}
