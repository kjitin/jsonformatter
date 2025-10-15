// JSON Formatter & Validator Application
class JSONFormatter {
    constructor() {
        this.currentIndent = '    '; // 4 spaces default
        this.isTreeView = false;
        this.validationTimer = null;
        this.sampleData = {
            "InsuranceCompanies": {
                "Top Insurance Companies": [
                    {
                        "No": "1",
                        "Name": "Berkshire Hathaway (BRK.A)",
                        "Market Capitalization": "$308 billion",
                        "Founded": 1955,
                        "Active": true,
                        "Subsidiaries": ["GEICO", "General Re", "National Indemnity"]
                    },
                    {
                        "No": "2", 
                        "Name": "UnitedHealth Group",
                        "Market Capitalization": "$450 billion",
                        "Founded": 1977,
                        "Active": true,
                        "Subsidiaries": ["Optum", "UnitedHealthcare"]
                    }
                ],
                "source": "investopedia.com",
                "lastUpdated": "2024-10-04T18:55:00Z",
                "metadata": {
                    "currency": "USD",
                    "dataAccuracy": 0.95,
                    "notes": null
                }
            }
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupTheme();
        this.setupKeyboardShortcuts();
    }

    bindEvents() {
        // Main controls
        document.getElementById('formatBtn').addEventListener('click', () => this.formatJSON());
        document.getElementById('validateBtn').addEventListener('click', () => this.validateJSON());
        document.getElementById('minifyBtn').addEventListener('click', () => this.minifyJSON());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        
        // File operations
        document.getElementById('loadSampleBtn').addEventListener('click', () => this.loadSampleData());
        document.getElementById('uploadBtn').addEventListener('click', () => this.triggerFileUpload());
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Output controls
        document.getElementById('copyBtn').addEventListener('click', () => this.copyToClipboard());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadJSON());
        
        // Settings
        document.getElementById('indentSelect').addEventListener('change', (e) => this.updateIndentation(e));
        document.getElementById('treeToggle').addEventListener('click', () => this.toggleTreeView());
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Input validation with debouncing
        document.getElementById('jsonInput').addEventListener('input', () => this.debounceValidation());
        
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Converter controls
        document.getElementById('copyXmlBtn').addEventListener('click', () => this.copyConverter('xml'));
        document.getElementById('downloadXmlBtn').addEventListener('click', () => this.downloadConverter('xml'));
        document.getElementById('copyCsvBtn').addEventListener('click', () => this.copyConverter('csv'));
        document.getElementById('downloadCsvBtn').addEventListener('click', () => this.downloadConverter('csv'));
        document.getElementById('copyYamlBtn').addEventListener('click', () => this.copyConverter('yaml'));
        document.getElementById('downloadYamlBtn').addEventListener('click', () => this.downloadConverter('yaml'));
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('jsonFormatter.theme') || 'light';
        this.setTheme(savedTheme);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.formatJSON();
                } else if (e.key === 'm') {
                    e.preventDefault();
                    this.minifyJSON();
                }
            }
        });
    }

    debounceValidation() {
        clearTimeout(this.validationTimer);
        this.validationTimer = setTimeout(() => {
            this.validateJSON();
            this.updateStatistics();
        }, 300);
    }

    formatJSON() {
        const input = document.getElementById('jsonInput').value.trim();
        const output = document.getElementById('jsonOutput');
        const errorDisplay = document.getElementById('errorDisplay');
        
        if (!input) {
            this.showError('Please enter some JSON to format.');
            return;
        }

        try {
            const parsed = JSON.parse(input);
            const formatted = JSON.stringify(parsed, null, this.currentIndent);
            const highlighted = this.highlightSyntax(formatted);
            
            output.innerHTML = highlighted;
            this.hideError();
            this.updateValidationStatus(true);
            this.updateStatistics();
            this.updateConverters(parsed);
            
        } catch (error) {
            this.showError(`Invalid JSON: ${error.message}`);
            this.updateValidationStatus(false, error.message);
        }
    }

    validateJSON() {
        const input = document.getElementById('jsonInput').value.trim();
        
        if (!input) {
            this.updateValidationStatus(null);
            return;
        }

        try {
            JSON.parse(input);
            this.updateValidationStatus(true);
            this.hideError();
            return true;
        } catch (error) {
            this.updateValidationStatus(false, error.message);
            this.showError(`Invalid JSON: ${error.message}`);
            return false;
        }
    }

    minifyJSON() {
        const input = document.getElementById('jsonInput').value.trim();
        const output = document.getElementById('jsonOutput');
        
        if (!input) {
            this.showError('Please enter some JSON to minify.');
            return;
        }

        try {
            const parsed = JSON.parse(input);
            const minified = JSON.stringify(parsed);
            const highlighted = this.highlightSyntax(minified);
            
            output.innerHTML = highlighted;
            this.hideError();
            this.updateValidationStatus(true);
            this.updateStatistics();
            
        } catch (error) {
            this.showError(`Invalid JSON: ${error.message}`);
            this.updateValidationStatus(false, error.message);
        }
    }

    clearAll() {
        document.getElementById('jsonInput').value = '';
        document.getElementById('jsonOutput').innerHTML = '';
        document.getElementById('treeView').innerHTML = '';
        this.hideError();
        this.updateValidationStatus(null);
        this.clearStatistics();
        this.clearConverters();
    }

    loadSampleData() {
        const input = document.getElementById('jsonInput');
        input.value = JSON.stringify(this.sampleData, null, 4);
        this.formatJSON();
    }

    triggerFileUpload() {
        document.getElementById('fileInput').click();
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            this.showError('Please select a valid JSON file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('jsonInput').value = e.target.result;
            this.formatJSON();
        };
        reader.onerror = () => {
            this.showError('Error reading file.');
        };
        reader.readAsText(file);
    }

    updateIndentation(event) {
        const value = event.target.value;
        this.currentIndent = value === '\t' ? '\t' : ' '.repeat(parseInt(value));
        
        // Re-format if there's already formatted output
        const output = document.getElementById('jsonOutput');
        if (output.innerHTML.trim()) {
            this.formatJSON();
        }
    }

    toggleTreeView() {
        this.isTreeView = !this.isTreeView;
        const treeView = document.getElementById('treeView');
        const jsonOutput = document.getElementById('jsonOutput');
        const toggleBtn = document.getElementById('treeToggle');
        
        if (this.isTreeView) {
            treeView.classList.remove('hidden');
            jsonOutput.classList.add('hidden');
            toggleBtn.textContent = 'Text View';
            this.generateTreeView();
        } else {
            treeView.classList.add('hidden');
            jsonOutput.classList.remove('hidden');
            toggleBtn.textContent = 'Tree View';
        }
    }

    generateTreeView() {
        const input = document.getElementById('jsonInput').value.trim();
        const treeView = document.getElementById('treeView');
        
        if (!input) {
            treeView.innerHTML = '<p>No JSON data to display</p>';
            return;
        }

        try {
            const parsed = JSON.parse(input);
            treeView.innerHTML = this.createTreeHTML(parsed, 'root');
        } catch (error) {
            treeView.innerHTML = '<p class="text-error">Invalid JSON</p>';
        }
    }

    createTreeHTML(obj, key, level = 0) {
        const indent = '  '.repeat(level);
        let html = '';
        
        if (typeof obj === 'object' && obj !== null) {
            const isArray = Array.isArray(obj);
            const entries = isArray ? obj.entries() : Object.entries(obj);
            const count = isArray ? obj.length : Object.keys(obj).length;
            const type = isArray ? 'array' : 'object';
            const bracket = isArray ? ['[', ']'] : ['{', '}'];
            
            html += `<div class="tree-item" onclick="this.querySelector('.tree-node').classList.toggle('hidden')">
                <span class="tree-toggle">▼</span>
                <span class="tree-key">${key}:</span>
                <span class="tree-value">${bracket[0]}</span>
                <span class="tree-type">${type} (${count})</span>
            </div>`;
            
            html += `<div class="tree-node">`;
            for (const [k, v] of entries) {
                html += this.createTreeHTML(v, isArray ? `[${k}]` : k, level + 1);
            }
            html += `</div>`;
            
        } else {
            const type = typeof obj;
            const value = obj === null ? 'null' : JSON.stringify(obj);
            const className = `json-${type === 'object' ? 'null' : type}`;
            
            html += `<div class="tree-item">
                <span class="tree-toggle"></span>
                <span class="tree-key">${key}:</span>
                <span class="tree-value ${className}">${value}</span>
                <span class="tree-type">${type}</span>
            </div>`;
        }
        
        return html;
    }

    copyToClipboard() {
        const output = document.getElementById('jsonOutput');
        const text = output.textContent;
        
        if (!text.trim()) {
            this.showError('No content to copy.');
            return;
        }

        navigator.clipboard.writeText(text).then(() => {
            this.showSuccess('Copied to clipboard!');
        }).catch(() => {
            this.showError('Failed to copy to clipboard.');
        });
    }

    downloadJSON() {
        const output = document.getElementById('jsonOutput');
        const text = output.textContent;
        
        if (!text.trim()) {
            this.showError('No content to download.');
            return;
        }

        this.downloadFile(text, 'formatted.json', 'application/json');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    highlightSyntax(json) {
        return json
            .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
                let cls = 'json-punctuation';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'json-key';
                    } else {
                        cls = 'json-string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'json-boolean';
                } else if (/null/.test(match)) {
                    cls = 'json-null';
                } else if (!isNaN(match)) {
                    cls = 'json-number';
                }
                return `<span class="${cls}">${match}</span>`;
            })
            .replace(/([{}[\],])/g, '<span class="json-punctuation">$1</span>');
    }

    updateValidationStatus(isValid, message = '') {
        const status = document.getElementById('validationStatus');
        
        if (isValid === null) {
            status.textContent = '';
            status.className = 'validation-status';
        } else if (isValid) {
            status.textContent = 'Valid JSON';
            status.className = 'validation-status valid';
        } else {
            status.textContent = 'Invalid JSON';
            status.className = 'validation-status invalid';
        }
    }

    showError(message) {
        const errorDisplay = document.getElementById('errorDisplay');
        errorDisplay.textContent = message;
        errorDisplay.classList.remove('hidden');
    }

    hideError() {
        const errorDisplay = document.getElementById('errorDisplay');
        errorDisplay.classList.add('hidden');
    }

    showSuccess(message) {
        // Simple success feedback - could be enhanced with a toast
        const btn = document.getElementById('copyBtn');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.classList.add('text-success');
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('text-success');
        }, 2000);
    }

    updateStatistics() {
        const input = document.getElementById('jsonInput').value.trim();
        
        if (!input) {
            this.clearStatistics();
            return;
        }

        try {
            const parsed = JSON.parse(input);
            const stats = this.calculateStats(parsed);
            
            document.getElementById('objectCount').textContent = stats.objects;
            document.getElementById('arrayCount').textContent = stats.arrays;
            document.getElementById('stringCount').textContent = stats.strings;
            document.getElementById('numberCount').textContent = stats.numbers;
            document.getElementById('sizeCount').textContent = `${input.length} bytes`;
            
        } catch (error) {
            this.clearStatistics();
        }
    }

    calculateStats(obj, stats = { objects: 0, arrays: 0, strings: 0, numbers: 0 }) {
        if (typeof obj === 'object' && obj !== null) {
            if (Array.isArray(obj)) {
                stats.arrays++;
                obj.forEach(item => this.calculateStats(item, stats));
            } else {
                stats.objects++;
                Object.values(obj).forEach(value => this.calculateStats(value, stats));
            }
        } else if (typeof obj === 'string') {
            stats.strings++;
        } else if (typeof obj === 'number') {
            stats.numbers++;
        }
        
        return stats;
    }

    clearStatistics() {
        document.getElementById('objectCount').textContent = '0';
        document.getElementById('arrayCount').textContent = '0';
        document.getElementById('stringCount').textContent = '0';
        document.getElementById('numberCount').textContent = '0';
        document.getElementById('sizeCount').textContent = '0 bytes';
    }

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-color-scheme') || 'light';
        const newTheme = current === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-color-scheme', theme);
        localStorage.setItem('jsonFormatter.theme', theme);
        
        const icon = document.getElementById('themeIcon');
        icon.textContent = theme === 'light' ? '🌙' : '☀️';
    }

    // Converter Methods
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.add('hidden');
        });
        document.getElementById(`${tabName}Tab`).classList.remove('hidden');
        
        // Update converter output
        this.updateSpecificConverter(tabName);
    }

    updateConverters(jsonData) {
        this.updateSpecificConverter('xml', jsonData);
        this.updateSpecificConverter('csv', jsonData);
        this.updateSpecificConverter('yaml', jsonData);
    }

    updateSpecificConverter(format, jsonData = null) {
        if (!jsonData) {
            const input = document.getElementById('jsonInput').value.trim();
            if (!input) return;
            
            try {
                jsonData = JSON.parse(input);
            } catch (error) {
                document.getElementById(`${format}Output`).textContent = 'Invalid JSON';
                return;
            }
        }

        const output = document.getElementById(`${format}Output`);
        
        try {
            let converted = '';
            switch (format) {
                case 'xml':
                    converted = this.jsonToXML(jsonData);
                    break;
                case 'csv':
                    converted = this.jsonToCSV(jsonData);
                    break;
                case 'yaml':
                    converted = this.jsonToYAML(jsonData);
                    break;
            }
            output.textContent = converted;
        } catch (error) {
            output.textContent = `Conversion error: ${error.message}`;
        }
    }

    jsonToXML(obj, rootName = 'root') {
        const createXML = (obj, name) => {
            if (obj === null) return `<${name}>null</${name}>`;
            if (typeof obj !== 'object') {
                return `<${name}>${this.escapeXML(String(obj))}</${name}>`;
            }
            
            if (Array.isArray(obj)) {
                return obj.map(item => createXML(item, 'item')).join('\n');
            }
            
            const entries = Object.entries(obj);
            const inner = entries.map(([key, value]) => {
                const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
                return createXML(value, cleanKey);
            }).join('\n');
            
            return `<${name}>\n${inner}\n</${name}>`;
        };
        
        return `<?xml version="1.0" encoding="UTF-8"?>\n${createXML(obj, rootName)}`;
    }

    jsonToCSV(obj) {
        const flatten = (obj, prefix = '') => {
            const flattened = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    const newKey = prefix ? `${prefix}.${key}` : key;
                    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                        Object.assign(flattened, flatten(obj[key], newKey));
                    } else if (Array.isArray(obj[key])) {
                        flattened[newKey] = obj[key].join('; ');
                    } else {
                        flattened[newKey] = obj[key];
                    }
                }
            }
            return flattened;
        };
        
        const flattened = flatten(obj);
        const headers = Object.keys(flattened);
        const values = Object.values(flattened);
        
        return `${headers.join(',')}\n${values.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')}`;
    }

    jsonToYAML(obj, indent = 0) {
        const spaces = '  '.repeat(indent);
        
        if (obj === null) return 'null';
        if (typeof obj === 'string') return `"${obj.replace(/"/g, '\\"')}"`;
        if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
        
        if (Array.isArray(obj)) {
            if (obj.length === 0) return '[]';
            return '\n' + obj.map(item => `${spaces}- ${this.jsonToYAML(item, indent + 1)}`).join('\n');
        }
        
        if (typeof obj === 'object') {
            const entries = Object.entries(obj);
            if (entries.length === 0) return '{}';
            
            return '\n' + entries.map(([key, value]) => {
                const yamlValue = this.jsonToYAML(value, indent + 1);
                if (yamlValue.startsWith('\n')) {
                    return `${spaces}${key}:${yamlValue}`;
                } else {
                    return `${spaces}${key}: ${yamlValue}`;
                }
            }).join('\n');
        }
        
        return String(obj);
    }

    escapeXML(str) {
        return str.replace(/[<>&'"]/g, (char) => {
            switch (char) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case "'": return '&apos;';
                case '"': return '&quot;';
                default: return char;
            }
        });
    }

    copyConverter(format) {
        const output = document.getElementById(`${format}Output`);
        const text = output.textContent;
        
        if (!text.trim()) {
            this.showError('No content to copy.');
            return;
        }

        navigator.clipboard.writeText(text).then(() => {
            const btn = document.getElementById(`copy${format.charAt(0).toUpperCase() + format.slice(1)}Btn`);
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        }).catch(() => {
            this.showError('Failed to copy to clipboard.');
        });
    }

    downloadConverter(format) {
        const output = document.getElementById(`${format}Output`);
        const text = output.textContent;
        
        if (!text.trim()) {
            this.showError('No content to download.');
            return;
        }

        const mimeTypes = {
            xml: 'application/xml',
            csv: 'text/csv',
            yaml: 'text/yaml'
        };

        this.downloadFile(text, `converted.${format}`, mimeTypes[format]);
    }

    clearConverters() {
        document.getElementById('xmlOutput').textContent = '';
        document.getElementById('csvOutput').textContent = '';
        document.getElementById('yamlOutput').textContent = '';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new JSONFormatter();
});