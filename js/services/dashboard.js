import { getCurrentUser } from './auth.js';
import { getClientsState } from './clients.js';

export const initDashboard = async () => {
    const welcomeMessage = document.getElementById('welcomeMessage');
    const liveClock = document.getElementById('liveClock');
    const dashboardPanel = document.getElementById('dashboardContent');

    const user = await getCurrentUser();
    if (user && welcomeMessage) {
        const firstName = user.fullName.split(' ')[0] || user.email;
        welcomeMessage.textContent = `Welcome back, ${firstName}!`;
    }

    if (liveClock) {
        const tick = () => {
            const now = new Date();
            liveClock.textContent = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
        };
        tick();
        setInterval(tick, 1000);
    }

    renderDashboardStats(dashboardPanel);
};

const renderDashboardStats = (container) => {
    if (!container) return;
    const clients = getClientsState();

    if (!clients || clients.length === 0) {
        container.innerHTML = '<p class="dashboard-empty">No data available yet. Please add clients.</p>';
        return;
    }

    const totalClients = clients.length;
    const wonRevenue = clients
        .filter((c) => c.status === 'Won')
        .reduce((sum, c) => sum + (Number(c.dealValue) || 0), 0);
    const formattedRevenue = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(wonRevenue);

    const pipeline = clients.reduce(
        (acc, c) => {
            acc[c.status] = (acc[c.status] || 0) + 1;
            return acc;
        },
        { Lead: 0, Contacted: 0, Won: 0, Lost: 0 }
    );

    const recentClients = [...clients]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    container.innerHTML = `
        <div class="dashboard-stats">
            <div class="stat-card stat-card--primary">
                <h4>Total Clients</h4>
                <p>${totalClients}</p>
            </div>
            <div class="stat-card stat-card--success">
                <h4>Won Revenue</h4>
                <p>${formattedRevenue}</p>
            </div>
        </div>
        <div class="dashboard-section">
            <h3>Pipeline Overview</h3>
            <p class="pipeline-summary">
                Lead: ${pipeline.Lead} · Contacted: ${pipeline.Contacted} · Won: ${pipeline.Won} · Lost: ${pipeline.Lost}
            </p>
        </div>
        <div class="dashboard-section">
            <div class="dashboard-section__header">
                <h3>Recent Clients</h3>
                <a href="clients.html">View all clients →</a>
            </div>
            <div class="recent-list">
                ${recentClients
                    .map(
                        (c) => `
                    <div class="recent-item">
                        <span><strong>${c.name}</strong></span>
                        <span>${new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                `
                    )
                    .join('')}
            </div>
        </div>
    `;
};
