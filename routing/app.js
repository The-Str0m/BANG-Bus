import { ThemeManager } from './theme_manager.js';
import { Header, SearchPanel, MapContainer, InfoSection } from './ui_components.js';
import { popularRoutes } from './data_service.js';
// the poimt of this is to get ppl to use public transport more, the map makes bus usage easy and accsesible for anyone and allows users to learn how to use the bus to reduce carbon emmisions and be more eco friendly 
class App {
  constructor() {
    this.themeManager = new ThemeManager();
    this.appContainer = document.getElementById('app');
    this.map = null;
    this.routingControl = null;

    this.init();
  }

  init() {
    this.renderAll();
    this.setupDelegatedEvents();
    this.animateEntry();
    this.handleResize();
  }

  initMap() {
    if (this.map) return;
    
    const mapContainer = document.getElementById('leaflet-map');
    if (!mapContainer) return;

    this.map = L.map('leaflet-map').setView([12.9716, 77.5946], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);
    
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 200);
  }

  renderAll() {
    const currentTheme = this.themeManager.getTheme();
    const themeLabel = this.themeManager.getThemeLabel(currentTheme);

    document.getElementById('header-container').innerHTML = Header(currentTheme, themeLabel);
    document.getElementById('search-section').innerHTML = SearchPanel();
    document.getElementById('map-section').innerHTML = MapContainer();
    document.getElementById('info-section').innerHTML = InfoSection();
    lucide.createIcons();
    
    setTimeout(() => {
      this.initMap();
    }, 100);
  }

  setupDelegatedEvents() {
   
    this.appContainer.addEventListener('click', (e) => {
      const themeBtn = e.target.closest('#theme-toggle');
      if (themeBtn) { this.handleThemeToggle(themeBtn); return; }
      const toggleHeader = e.target.closest('.toggle-header');
      if (toggleHeader && window.innerWidth < 768) {
        const card = toggleHeader.closest('.collapsible-card');
        if (card) card.classList.toggle('collapsed');
      }
    });

    const form = document.getElementById('search-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSearch(form);
      });
    }
  }

  handleThemeToggle(btn) {
    const newTheme = this.themeManager.cycleTheme();
    const labelSpan = btn.querySelector('#theme-label');
    if (labelSpan) labelSpan.textContent = this.themeManager.getThemeLabel(newTheme);
    const icon = btn.querySelector('svg');
    if (icon) gsap.fromTo(icon, { rotation: -45, scale: 0.8 }, { rotation: 0, scale: 1, duration: 0.4, ease: "back.out(1.7)" });
  }

  async handleSearch(form) {
    const btn = form.querySelector('button[type="submit"]');
    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="animate-spin w-5 h-5 mr-2"></i> Finding route...';
    lucide.createIcons();

    const from = form.querySelector('#from-input').value;
    const to = form.querySelector('#to-input').value;

    try {
      const geocoder = L.Control.Geocoder.nominatim();
      
      const geocodePromise = (query) => {
        return new Promise((resolve, reject) => {
          geocoder.geocode(query + ', Bangalore, India', (results) => {
            if (results && results.length > 0) {
              resolve(results[0].center);
            } else {
              reject(new Error('Location not found'));
            }
          });
        });
      };

      const fromLatLng = await geocodePromise(from);
      const toLatLng = await geocodePromise(to);

      if (this.routingControl) {
        this.map.removeControl(this.routingControl);
      }

      this.routingControl = L.Routing.control({
        waypoints: [fromLatLng, toLatLng],
        routeWhileDragging: false,
        show: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
        lineOptions: {
          styles: [{color: '#4ade80', weight: 6, opacity: 0.8}]
        },
        createMarker: function(i, wp) {
          return L.marker(wp.latLng, {
            icon: L.divIcon({
              className: 'custom-marker',
              html: `<div style="background: ${i === 0 ? '#4ade80' : '#ef4444'}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`
            })
          });
        },
        containerClassName: 'leaflet-routing-container-hide'
      }).addTo(this.map);

      this.routingControl.on('routesfound', (e) => {
        const route = e.routes[0];
        this.renderRouteInstructions(route, from, to);
        
        btn.innerHTML = '<i data-lucide="check" class="w-5 h-5 mr-2"></i> Route Found!';
        lucide.createIcons();
        btn.classList.add('bg-green-600');

        setTimeout(() => {
          btn.innerHTML = originalContent;
          btn.disabled = false;
          btn.classList.remove('bg-green-600');
          lucide.createIcons();
        }, 1400);
      });

      this.routingControl.on('routingerror', (e) => {
        console.error('Routing error!!.:', e);
        this.renderNoInstructions('sorry we Could not find the route. Please check your locations and try again.');
        
        btn.innerHTML = originalContent;
        btn.disabled = false;
        lucide.createIcons();
      });

    } catch (error) {
      console.error('Sarch error:', error);
      this.renderNoInstructions('Error finding route: '+ error.message);
      
      btn.innerHTML = originalContent;
      btn.disabled = false;
      lucide.createIcons();
    }
  }

  renderRouteInstructions(route, from, to) {
    const panel = document.getElementById('route-instructions');
    const container = document.getElementById('route-instructions-content');
    panel.classList.remove('hidden');

    const distance = (route.summary.totalDistance / 1000).toFixed(1) + ' km';
    const duration = Math.round(route.summary.totalTime / 60) + ' min';

    let html = `
      <div class="space-y-4">
        <div class="bg-[var(--accent-glow)] border-l-4 border-[var(--accent-primary)] rounded-lg p-5">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-full bg-[var(--accent-primary)] flex items-center justify-center shadow-lg flex-shrink-0">
              <i data-lucide="bus" class="w-6 h-6 text-white"></i>
            </div>
            <div class="flex-1">
              <div class="font-bold text-lg text-[var(--text-primary)] mb-3">BMTC Bus Route Information</div>
              
              <div class="bg-[var(--glass-bg)] rounded-lg p-4 mb-4">
                <div class="flex items-center gap-3 mb-2">
                  <i data-lucide="map-pin" class="w-5 h-5 text-green-500"></i>
                  <div>
                    <div class="text-xs text-[var(--text-secondary)] uppercase tracking-wide">Get On At</div>
                    <div class="font-semibold text-[var(--text-primary)]">${from}</div>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <i data-lucide="flag" class="w-5 h-5 text-red-500"></i>
                  <div>
                    <div class="text-xs text-[var(--text-secondary)] uppercase tracking-wide">Get Off At</div>
                    <div class="font-semibold text-[var(--text-primary)]">${to}</div>
                  </div>
                </div>
              </div>

              <div class="text-sm font-semibold text-[var(--text-primary)] mb-2">Available Buses:</div>
              <div class="grid gap-2 mb-4">
                ${this.getSuggestedBuses(from, to)}
              </div>
              
              <div class="flex gap-4 text-xs bg-[var(--glass-bg)] rounded-lg p-3">
                <div class="flex items-center gap-2">
                  <i data-lucide="route" class="w-4 h-4 text-[var(--accent-primary)]"></i>
                  <span class="text-[var(--text-secondary)]">Distance: <span class="text-[var(--text-primary)] font-semibold">${distance}</span></span>
                </div>
                <div class="flex items-center gap-2">
                  <i data-lucide="clock" class="w-4 h-4 text-[var(--accent-primary)]"></i>
                  <span class="text-[var(--text-secondary)]">Est. Time: <span class="text-[var(--text-primary)] font-semibold">${duration}</span></span>
                </div>
              </div>

              <div class="mt-3 pt-3 border-t border-[var(--glass-border)] text-xs text-[var(--text-secondary)]">
                <i data-lucide="info" class="w-3 h-3 inline mr-1"></i>
                Visit <a href="https://synthax.tech/" target="_blank" class="text-[var(--accent-primary)] hover:underline">BMTC official website</a> or use the BMTC app for real-time bus schedules and exact timings.
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    lucide.createIcons();
  }

  getSuggestedBuses(from, to) {
    const fromLower = from.toLowerCase();
    const toLower = to.toLowerCase();
    
    const matchingRoutes = popularRoutes.filter(route => {
      const routeFrom = route.from.toLowerCase();
      const routeTo = route.to.toLowerCase();
      return (fromLower.includes(routeFrom) || routeFrom.includes(fromLower)) &&
             (toLower.includes(routeTo) || routeTo.includes(toLower));
    });

    if (matchingRoutes.length > 0) {
      return matchingRoutes.map(route => `
        <div class="flex items-center gap-3 bg-[var(--card-bg)] p-2 rounded">
          <span class="font-mono font-bold text-sm text-[var(--accent-primary)] bg-[var(--glass-bg)] px-2 py-1 rounded">${route.code}</span>
          <div class="text-xs">
            <div class="text-[var(--text-primary)] font-semibold">${route.from} → ${route.to}</div>
            <div class="text-[var(--text-secondary)]">${route.type}</div>
          </div>
        </div>
      `).join('');
    } else {
      return `
        <div class="text-xs text-[var(--text-secondary)] bg-[var(--card-bg)] p-3 rounded">
          <i data-lucide="bus" class="w-4 h-4 inline mr-1"></i>
           Common options include Ordinary buses, Vajra (AC), as 342F 342A 500CH.
        </div>
      `;
    }
  }

  
  renderInstructions(route) {
    const panel = document.getElementById('route-instructions');
    const container = document.getElementById('route-instructions-content');
    panel.classList.remove('hidden');

    let html = '';

    route.legs.forEach((leg, legIndex) => {
      const totalDuration = leg.duration ? leg.duration.text : '';
      const totalDistance = leg.distance ? leg.distance.text : '';
      
      html += `
        <div class="mb-6 pb-4 border-b border-[var(--glass-border)] last:border-0">
          <div class="bg-[var(--glass-border)] rounded-lg p-4 mb-4">
            <div class="flex items-center justify-between flex-wrap gap-3">
              <div class="flex items-center gap-3">
                <i data-lucide="route" class="w-5 h-5 text-[var(--accent-primary)]"></i>
                <div>
                  <div class="text-sm font-bold text-[var(--text-primary)]">Journey ${legIndex + 1}</div>
                  <div class="text-xs text-[var(--text-secondary)]">${leg.start_address}</div>
                  <div class="text-xs text-[var(--text-secondary)]">to ${leg.end_address}</div>
                </div>
              </div>
              <div class="flex gap-4 text-xs">
                <div class="text-center">
                  <div class="text-[var(--accent-primary)] font-bold">${totalDuration}</div>
                  <div class="text-[var(--text-secondary)]">Total Time</div>
                </div>
                <div class="text-center">
                  <div class="text-[var(--accent-primary)] font-bold">${totalDistance}</div>
                  <div class="text-[var(--text-secondary)]">Distance</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="space-y-3 pl-2">`;

      leg.steps.forEach((step, stepIndex) => {
        if (step.travel_mode === 'WALKING') {
          const tmp = document.createElement('div'); 
          tmp.innerHTML = step.instructions;
          const plain = tmp.textContent || tmp.innerText || '';
          const distance = step.distance?.text || '';
          const duration = step.duration?.text || '';
          
          html += `
            <div class="flex gap-3 p-3 rounded-lg hover:bg-[var(--glass-border)] transition-colors">
              <div class="flex flex-col items-center">
                <div class="w-8 h-8 rounded-full bg-[var(--accent-glow)] flex items-center justify-center text-lg">🚶</div>
                ${stepIndex < leg.steps.length - 1 ? '<div class="w-0.5 h-full bg-[var(--glass-border)] mt-1"></div>' : ''}
              </div>
              <div class="flex-1 pb-2">
                <div class="font-semibold text-[var(--text-primary)] mb-1">${plain}</div>
                ${distance || duration ? `<div class="flex gap-3 text-xs text-[var(--text-secondary)]">
                  ${distance ? `<span><i data-lucide="map" class="w-3 h-3 inline mr-1"></i>${distance}</span>` : ''}
                  ${duration ? `<span><i data-lucide="clock" class="w-3 h-3 inline mr-1"></i>${duration}</span>` : ''}
                </div>` : ''}
              </div>
            </div>`;
            
        } else if (step.travel_mode === 'TRANSIT' && step.transit) {
          const t = step.transit;
          const lineName = (t.line && (t.line.short_name || t.line.name)) || 'Bus';
          const headsign = t.headsign || 'Destination';
          const depStop = t.departure_stop?.name || 'Stop';
          const arrStop = t.arrival_stop?.name || 'Stop';
          const numStops = t.num_stops || 0;
          const depTime = t.departure_time?.text || '';
          const arrTime = t.arrival_time?.text || '';
          const duration = step.duration?.text || '';
          
          html += `
            <div class="flex gap-3 p-4 rounded-lg bg-[var(--accent-glow)] border-l-4 border-[var(--accent-primary)]">
              <div class="flex flex-col items-center">
                <div class="w-8 h-8 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-lg shadow-lg">🚌</div>
                ${stepIndex < leg.steps.length - 1 ? '<div class="w-0.5 h-full bg-[var(--accent-primary)] mt-1"></div>' : ''}
              </div>
              <div class="flex-1">
                <div class="mb-2">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-mono font-bold text-lg text-[var(--accent-primary)] bg-[var(--card-bg)] px-3 py-1 rounded">${lineName}</span>
                    <i data-lucide="arrow-right" class="w-4 h-4 text-[var(--text-secondary)]"></i>
                    <span class="text-sm font-semibold text-[var(--text-primary)]">${headsign}</span>
                  </div>
                </div>
                
                <div class="space-y-2 text-sm">
                  <div class="flex items-start gap-2 bg-[var(--card-bg)] p-2 rounded">
                    <i data-lucide="map-pin" class="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0"></i>
                    <div>
                      <div class="font-semibold text-[var(--text-primary)]">Board at: ${depStop}</div>
                      ${depTime ? `<div class="text-xs text-[var(--text-secondary)]">Departure: ${depTime}</div>` : ''}
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-2 pl-6 text-xs text-[var(--text-secondary)]">
                    <i data-lucide="circle-dot" class="w-3 h-3"></i>
                    <span>Ride for ${numStops} stop${numStops !== 1 ? 's' : ''}${duration ? ` (${duration})` : ''}</span>
                  </div>
                  
                  <div class="flex items-start gap-2 bg-[var(--card-bg)] p-2 rounded">
                    <i data-lucide="map-pin" class="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0"></i>
                    <div>
                      <div class="font-semibold text-[var(--text-primary)]">Get off at: ${arrStop}</div>
                      ${arrTime ? `<div class="text-xs text-[var(--text-secondary)]">Arrival: ${arrTime}</div>` : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>`;
            
        } else {
          const tmp = document.createElement('div'); 
          tmp.innerHTML = step.instructions;
          const plain = tmp.textContent || tmp.innerText || '';
          const distance = step.distance?.text || '';
          const duration = step.duration?.text || '';
          
          html += `
            <div class="flex gap-3 p-3 rounded-lg hover:bg-[var(--glass-border)] transition-colors">
              <div class="flex flex-col items-center">
                <div class="w-8 h-8 rounded-full bg-[var(--glass-border)] flex items-center justify-center">
                  <i data-lucide="arrow-right" class="w-4 h-4"></i>
                </div>
                ${stepIndex < leg.steps.length - 1 ? '<div class="w-0.5 h-full bg-[var(--glass-border)] mt-1"></div>' : ''}
              </div>
              <div class="flex-1 pb-2">
                <div class="font-semibold text-[var(--text-primary)] mb-1">${plain}</div>
                ${distance || duration ? `
                  <div class="flex gap-3 text-xs text-[var(--text-secondary)]">
                    ${distance ? `<span>${distance}</span>` : ''}
                    ${duration ? `<span>${duration}</span>` : ''}
                  </div>` : ''}
              </div>
            </div>`;
        }
      });

      html += `</div></div>`;
    });

    container.innerHTML = html;
    lucide.createIcons();
  }

  renderNoInstructions(msg) {
    const panel = document.getElementById('route-instructions');
    const container = document.getElementById('route-instructions-content');
    panel.classList.remove('hidden');
    container.innerHTML = `<div class="text-sm text-[var(--text-secondary)]">${msg}</div>`;
  }

  
  animateEntry() { }
  handleResize() {  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
