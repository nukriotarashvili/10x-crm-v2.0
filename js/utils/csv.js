/**
 * CSV helpers for exporting client records from in-memory state.
 */

const CSV_HEADERS = ['id', 'name', 'email', 'phone', 'company', 'status', 'dealValue', 'createdAt'];

const escapeCsvCell = (value) => {
    const text = value == null ? '' : String(value);
    if (/[",\n\r]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
};

export const clientsToCsvString = (clients) => {
    const headerLine = CSV_HEADERS.join(',');
    const rows = clients.map((client) =>
        CSV_HEADERS.map((key) => escapeCsvCell(client[key])).join(',')
    );
    return [headerLine, ...rows].join('\r\n');
};

/**
 * Blob download flow:
 * 1) Build a CSV string from current state.
 * 2) Wrap it in a Blob (in-memory file with MIME type text/csv).
 * 3) Create an object URL, attach to a temporary <a download>, programmatically click.
 * 4) Revoke the URL and remove the link to avoid memory leaks.
 */
export const downloadClientsCsv = (clients, filename = '10x-crm-clients.csv') => {
    const csvString = clientsToCsvString(clients);
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
    const objectUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
};
