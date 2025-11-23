const THEMES = ['dark', 'minimal', 'high-contrast'];

export class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('bbn_theme') || 'dark';
        if (!THEMES.includes(this.currentTheme)) this.currentTheme = 'dark';
        this.applyTheme(this.currentTheme);
    }
//A project created NTA Pranav Soggy 
    applyTheme(theme) {
        const root = document.documentElement;
        root.setAttribute('data-theme', theme);
        localStorage.setItem('bbn_theme', theme);
        this.currentTheme = theme;
        this.dispatchChange();
    }

    dispatchChange() {
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: this.currentTheme }));
    }

    cycleTheme() {
        const currentIndex = THEMES.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % THEMES.length;
        const nextTheme = THEMES[nextIndex];
        this.applyTheme(nextTheme);
        return nextTheme;
    }

    getTheme() {
        return this.currentTheme;
    }
    
    getThemeLabel(theme) {
        const labels = {
            'dark': 'Dark Mode',
            'minimal': 'Minimal',
            'high-contrast': 'High Contrast'
        };
        return labels[theme] || 'Theme';
    }
}
