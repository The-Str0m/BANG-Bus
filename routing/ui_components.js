import { kannadaPhrases, popularRoutes } from './data_service.js';

export function Header(currentTheme, label) {
    return `
        <div class="glass-panel px-4 py-3 md:px-6 md:py-4 flex justify-between items-center shadow-lg">
            <div class="flex items-center space-x-3">
                <div class="p-2 rounded-lg bg-[var(--glass-border)] text-[var(--accent-primary)]">
                    <i data-lucide="navigation" class="w-5 h-5 md:w-6 md:h-6"></i>
                </div>
                <h1 class="text-lg md:text-2xl font-display font-bold glow-text tracking-tight">
                    BANG! <span class="text-[var(--accent-primary)]">Navigator</span>
                </h1>
            </div>
            <button id="theme-toggle" aria-label="Switch Theme" class="flex items-center space-x-2 px-3 py-2 md:px-4 rounded-full border border-[var(--glass-border)] hover:bg-[var(--glass-border)] focus:ring-2 focus:ring-[var(--accent-primary)] transition-all duration-300 group">
                <i data-lucide="moon" class="w-4 h-4 group-hover:rotate-12 transition-transform text-[var(--accent-primary)]"></i>
                <span id="theme-label" class="text-xs md:text-sm font-medium font-display hidden sm:inline-block">${label}</span>
            </button>
        </div>
    `;
}
//a project by NTA n Pranavoggy 
export function SearchPanel() {
    return `
        <div class="glass-panel p-6 md:p-8 transform hover:scale-[1.01] transition-transform duration-500">
            <h2 class="text-xl md:text-2xl font-display font-semibold mb-6 text-[var(--text-primary)] flex items-center gap-2">
                <i data-lucide="search" class="w-6 h-6 text-[var(--accent-primary)]"></i>
                Plan Your Journey
            </h2>
            <form id="search-form" class="flex flex-col md:flex-row gap-4 md:gap-6 items-end">
                <div class="flex-grow w-full group">
                    <label for="from-input" class="block text-xs font-bold text-[var(--text-secondary)] mb-2 ml-1 uppercase tracking-wider">From</label>
                    <div class="relative">
                        <i data-lucide="map-pin" class="absolute left-4 top-3.5 w-5 h-5 text-[var(--accent-primary)] opacity-70"></i>
                        <input id="from-input" type="text" placeholder="e.g. Silk Board" aria-label="Starting Point" required class="neu-input w-full pl-12 pr-4 py-3 text-base md:text-lg bg-transparent focus:ring-0 placeholder-[var(--text-secondary)]/50">
                    </div>
                </div>
                
                <div class="flex justify-center items-center py-2 md:py-0 md:mb-4">
                    <i data-lucide="arrow-right-left" class="w-5 h-5 text-[var(--text-secondary)] md:rotate-0 rotate-90"></i>
                </div>
                
                <div class="flex-grow w-full group">
                    <label for="to-input" class="block text-xs font-bold text-[var(--text-secondary)] mb-2 ml-1 uppercase tracking-wider">To</label>
                    <div class="relative">
                        <i data-lucide="flag" class="absolute left-4 top-3.5 w-5 h-5 text-[var(--accent-primary)] opacity-70"></i>
                        <input id="to-input" type="text" placeholder="e.g. Majestic" aria-label="Destination" required class="neu-input w-full pl-12 pr-4 py-3 text-base md:text-lg bg-transparent focus:ring-0 placeholder-[var(--text-secondary)]/50">
                    </div>
                </div>
                
                <button type="submit" class="btn-primary w-full md:w-auto px-8 py-3.5 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-transform duration-300 hover:-translate-y-1 focus:translate-y-0 active:scale-95">
                    <span>Search</span>
                    <i data-lucide="arrow-right" class="w-5 h-5"></i>
                </button>
            </form>
        </div>
    `;
}

export function MapContainer() {
  return `
    <div class="w-full flex flex-col gap-6">

        <!-- LEAFLET MAP -->
        <div id="leaflet-map"
             class="w-full h-[450px] md:h-[500px] rounded-xl overflow-hidden border border-[var(--glass-border)]">
        </div>

        <!-- ROUTE INSTRUCTIONS BOX -->
        <div id="route-instructions"
             class="glass-panel w-full p-6 md:p-8 rounded-xl border-2 border-[var(--accent-primary)] shadow-2xl hidden mb-8">
            <h3 class="text-2xl font-display font-bold mb-6 flex items-center gap-3 text-[var(--text-primary)]">
                <div class="p-2 rounded-lg bg-[var(--accent-primary)] text-white">
                    <i data-lucide="bus" class="w-6 h-6"></i>
                </div>
                Your Bus Route
            </h3>
            <div id="route-instructions-content" class="space-y-4"></div>
        </div>
    </div>
  `;
}


export function InfoSection() {
    const phrasesHtml = kannadaPhrases.map(phrase => `
        <div class="group p-4 rounded-xl border border-[var(--glass-border)] hover:bg-[var(--glass-border)] transition-all duration-300">
            <div class="flex items-start gap-4">
                <div class="p-2.5 rounded-lg bg-[var(--accent-glow)] text-[var(--accent-primary)] shadow-sm">
                    <i data-lucide="${phrase.icon}" class="w-5 h-5"></i>
                </div>
                <div class="flex-1">
                    <h4 class="font-bold text-[var(--text-primary)] text-lg mb-1">${phrase.kannada}</h4>
                    <p class="text-sm text-[var(--text-secondary)] mb-0.5">${phrase.english}</p>
                    <p class="text-xs text-[var(--text-secondary)] opacity-75 italic">${phrase.pronunciation}</p>
                </div>
            </div>
        </div>
    `).join('');

    const routesHtml = popularRoutes.map(route => `
        <div class="flex items-center justify-between p-3 border-b border-[var(--glass-border)] last:border-0 hover:bg-[var(--glass-border)] transition-colors rounded-lg cursor-pointer group">
            <div class="flex items-center gap-4">
                <span class="font-mono font-bold text-[var(--accent-primary)] bg-[var(--accent-glow)] px-2 py-1 rounded text-sm min-w-[4rem] text-center group-hover:scale-105 transition-transform">${route.code}</span>
                <div class="flex flex-col">
                    <span class="text-sm text-[var(--text-primary)] font-semibold flex items-center gap-2">
                        ${route.from} <i data-lucide="arrow-right" class="w-3 h-3 text-[var(--text-secondary)]"></i> ${route.to}
                    </span>
                    <span class="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-bold mt-0.5">${route.type}</span>
                </div>
            </div>
            <i data-lucide="chevron-right" class="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] group-hover:translate-x-1 transition-all"></i>
        </div>
    `).join('');

    return `
        <!-- Card 1: Kannada Phrases Guide -->
        <article class="glass-panel overflow-hidden flex flex-col h-full collapsible-card">
            <div class="p-6 md:p-8 border-b border-[var(--glass-border)] flex justify-between items-center cursor-pointer md:cursor-default toggle-header">
                <h3 class="text-lg md:text-xl font-display font-bold text-[var(--text-primary)]">Kannada Phrases Guide</h3>
                <i data-lucide="chevron-down" class="w-5 h-5 text-[var(--text-secondary)] md:hidden chevron"></i>
            </div>
            <div class="details-content flex-grow">
                <div class="p-6 md:p-8 pt-4 space-y-3">
                    ${phrasesHtml}
                </div>
            </div>
        </article>

        <!-- Card 2: Popular Routes -->
        <article class="glass-panel overflow-hidden flex flex-col h-full floating-card collapsible-card" style="animation-delay: 0.5s;">
            <div class="p-6 md:p-8 border-b border-[var(--glass-border)] flex justify-between items-center cursor-pointer md:cursor-default toggle-header">
                <h3 class="text-lg md:text-xl font-display font-bold text-[var(--text-primary)]">Popular Routes</h3>
                <i data-lucide="chevron-down" class="w-5 h-5 text-[var(--text-secondary)] md:hidden chevron"></i>
            </div>
            <div class="details-content flex-grow flex flex-col">
                <div class="p-6 md:p-8 pt-4 flex-grow overflow-y-auto custom-scrollbar space-y-1 max-h-[400px]">
                    ${routesHtml}
                </div>
                <div class="p-4 border-t border-[var(--glass-border)] text-center bg-[var(--glass-bg)]">
                    <button class="text-sm text-[var(--accent-primary)] font-bold hover:text-[var(--text-primary)] transition-colors flex items-center justify-center gap-1 mx-auto">
                        View Full Schedule <i data-lucide="external-link" class="w-3 h-3"></i>
                    </button>
                </div>
            </div>
        </article>
    `;
}
