import { getClientsState } from './clients.js';

export const initDashboard = () => {
    const welcomeMessage = document.getElementById('welcomeMessage');
    const liveClock = document.getElementById('liveClock');
    const dashboardPanel = document.querySelector('.main-content .panel:not(.dashboard-hero)');

    const session = JSON.parse(localStorage.getItem('crm_session'));
    if (session && welcomeMessage) {
        const users = JSON.parse(localStorage.getItem('crm_users')) || [];
        const user = users.find((u) => u.email === session.email);
        if (user) {
            welcomeMessage.textContent = `Welcome back, ${user.fullName.split(' ')[0]}!`;
        }
    }

    if (liveClock) {
        setInterval(() => {
            const now = new Date();
            liveClock.textContent = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
        }, 1000);
    }

    renderDashboardStats(dashboardPanel);
};

const renderDashboardStats = (container) => {
    if (!container) return;
    const clients = getClientsState();

    if (!clients || clients.length === 0) {
        container.innerHTML =
            '<p style="color: var(--text-secondary);">No data available yet. Please add clients.</p>';
        return;
    }

    const totalClients = clients.length;
    const activeDeals = clients.filter((c) => c.status !== 'Won' && c.status !== 'Lost').length;
    const wonRevenue = clients
        .filter((c) => c.status === 'Won')
        .reduce((sum, c) => sum + c.dealValue, 0);
    const formattedRevenue = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(wonRevenue);

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const newThisWeek = clients.filter(
        (c) => new Date(c.createdAt).getTime() >= sevenDaysAgo
    ).length;

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
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
            <div style="padding: 1rem; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px;">
                <h4 style="color: var(--text-secondary);">Total Clients</h4>
                <p style="font-size: 1.5rem; font-weight: bold; color: var(--primary-color);">${totalClients}</p>
            </div>
            <div style="padding: 1rem; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px;">
                <h4 style="color: var(--text-secondary);">Won Revenue</h4>
                <p style="font-size: 1.5rem; font-weight: bold; color: var(--success-color);">${formattedRevenue}</p>
            </div>
        </div>
        <div style="margin-bottom: 2rem;">
            <h3>Pipeline Overview</h3>
            <p style="color: var(--text-secondary); margin-top: 0.5rem;">
                Lead: ${pipeline.Lead} | Contacted: ${pipeline.Contacted} | Won: ${pipeline.Won} | Lost: ${pipeline.Lost}
            </p>
        </div>
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3>Recent Clients</h3>
                <a href="clients.html" style="font-size: 0.9rem;">View all clients &rarr;</a>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                ${recentClients
                    .map(
                        (c) => `
                    <div style="display: flex; justify-content: space-between; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 4px; background: var(--card-bg);">
                        <span><strong>${c.name}</strong></span>
                        <span style="font-size: 0.85rem; color: var(--text-secondary);">${new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                `
                    )
                    .join('')}
            </div>
        </div>
    `;
};
