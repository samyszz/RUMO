document.addEventListener('DOMContentLoaded', () => {

    // --- VARIÁVEIS GLOBAIS ---
    let mapInstance;
    let userMarker;
    let searchMarkers = [];
    let widgetUserCoords = null;
    let routingControl = null; 

    // --- TRADUÇÃO DINÂMICA (Google Client) ---
    async function translateText(text) {
        if (!text) return '';
        const storedLang = localStorage.getItem('rumo_lang') || 'pt';
        const targetLang = storedLang.split('-')[0]; 
        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
            const res = await fetch(url);
            const json = await res.json();
            if (json && json[0]) return json[0].map(s => s[0]).join('');
            return text;
        } catch (e) {
            return text;
        }
    }

    // --- HELPER: ENDEREÇO LIMPO (CURTO) ---
    function formatCleanAddress(addr) {
        const parts = [];
        const rua = addr.road || addr.street || addr.pedestrian || "";
        const numero = addr.house_number || "";
        if (rua) parts.push(numero ? `${rua}, ${numero}` : rua);
        
        const bairro = addr.suburb || addr.neighbourhood || addr.district || "";
        if (bairro) parts.push(bairro);
        
        const cidade = addr.city || addr.town || addr.municipality || "";
        if (cidade) parts.push(cidade);

        return parts.join(' - ');
    }

    // --- HTML E CSS INJETADOS ---
    const mapWidgetHTML = `
        <style>
            .widget-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6); z-index: 1000; }
            .map-widget-content { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1001; width: 90%; max-width: 600px; max-height: 90vh; display: flex; flex-direction: column; background-color: #daf3ed; border: 6px solid #659474; border-radius: 20px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2); overflow: hidden; }
            .map-widget-content .widget-header { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 18px 25px; background-color: #9eddd5; border-bottom: 6px solid #659474; color: #053536; }
            .widget-header h3 { margin: 0; font-size: 1.3rem; font-family: 'Nunito-Black', sans-serif; font-weight: 800; }
            .close-widget-btn { background: none; border: none; font-size: 28px; cursor: pointer; color: #053536; opacity: 0.7; transition: opacity 0.2s; }
            .close-widget-btn:hover { opacity: 1; }
            .widget-body { padding: 20px; display: flex; flex-direction: column; gap: 15px; overflow-y: auto; flex-grow: 1; }
            body.dark-mode .map-widget-content { background-color: #4192899f; border: 6px solid #317067; color: #d6fafc; }
            body.dark-mode .map-widget-content .widget-header { background-color: #419289; border-bottom: 6px solid #317067; color: #d6fafc; }
            body.dark-mode .close-widget-btn { color: #d6fafc; }
            .widget-search-bar-map { display: flex; align-items: center; background-color: #ffea97; border: 2px solid #cdbc7b; border-radius: 25px; padding: 8px 15px; }
            .widget-search-bar-map input { border: none; outline: none; flex-grow: 1; font-size: 15px; background-color: transparent; color: #826414; font-family: 'Nunito-Black', sans-serif; }
            .widget-search-bar-map .btn-search-map { border: none; background-color: #053536; color: white; padding: 8px 15px; border-radius: 20px; cursor: pointer; margin-left: 10px; font-family: 'Nunito-Black', sans-serif; }
            #map-widget-map { height: 400px; width: 100%; border-radius: 15px; border: 1px solid #659474; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1); z-index: 0; }
            #widget-search-results-list { max-height: 200px; overflow-y: auto; }
            .widget-result-item { background-color: #cae8ff; border: 2px solid #739d9f; border-radius: 12px; padding: 12px 15px; margin-bottom: 10px; cursor: pointer; transition: background-color 0.2s; }
            .widget-result-item:hover { background-color: #b8d9f2; }
            .widget-result-item h5 { margin: 0 0 5px 0; color: #053536; font-size: 1rem; }
            .widget-result-item p { margin: 0; font-size: 0.85em; color: #333; }
            
            body.dark-mode .widget-search-bar-map { background-color: #4f4a3a; border-color: #8c7f4a; }
            body.dark-mode .widget-search-bar-map input { color: #f0e6c5; }
            body.dark-mode #map-widget-map { border-color: #317067; }
            body.dark-mode .widget-result-item { background-color: #3a4f60; border-color: #739d9f; }
            body.dark-mode .widget-result-item h5 { color: #cae8ff; }
            body.dark-mode .widget-result-item p { color: #ccc; }
            
            .leaflet-routing-container { background-color: #ade6ec !important; border: 1px solid #85cbcb; color: #0a4849; }
            body.dark-mode .leaflet-routing-container { background-color: #2a5a5a !important; border: 1px solid #0e3b3b; color: #cce5e2; }
            .leaflet-routing-container h2 { color: var(--text-color, #0a4849) !important; }
            body.dark-mode .leaflet-routing-container h2 { color: var(--text-color, #cce5e2) !important; }

            .map-widget-btn { background-color: #d6fafc; border: 2px solid #317067; color: #419289; position: fixed; bottom: 395px; right: 8px; z-index: 999; width: 42px; height: 42px; border-radius: 12px; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.2); display: flex; justify-content: center; align-items: center; font-size: 24px; transition: transform 0.2s ease; }
            .map-widget-btn:hover { transform: scale(1.1); }
            .phone-widget-btn { background-color: #dc3545; border: 2px solid #b02a37; color: white; position: fixed; bottom: 343px; right: 8px; z-index: 998; width: 42px; height: 42px; border-radius: 12px; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.2); display: flex; justify-content: center; align-items: center; font-size: 20px; transition: transform 0.2s ease; }
            .phone-widget-btn:hover { transform: scale(1.1); }
            
            @media (max-width: 600px) { .map-widget-btn { bottom: 320px; } .phone-widget-btn { bottom: 270px; } }
        </style>

        <div class="map-widget-container">
            <div class="widget-overlay" id="map-overlay" style="display: none;"></div>
            <button id="map-widget-btn" class="map-widget-btn"><i class="fas fa-map-marker-alt"></i></button>
            <div id="map-widget-content" class="map-widget-content" style="display: none;">
                <div class="widget-header"><i class="fas fa-map-marker-alt"></i><h3>Sua localização e Rotas</h3><button id="close-map-widget" class="close-widget-btn">&times;</button></div>
                <div class="widget-body">
                    <form id="widget-search-form-map" class="widget-search-bar-map" action="#">
                        <i class="fas fa-search"></i>
                        <input type="text" id="widget-search-input-map" placeholder="Pesquisar locais próximos (3.5km)...">
                        <button type="submit" class="btn-search-map">Buscar</button>
                    </form>
                    <div id="map-widget-map"></div>
                    <div id="widget-search-results-list"></div>
                    <p id="widget-address-container"><strong>Endereço:</strong> <span id="widget-user-address">Carregando...</span></p>
                </div>
            </div>
        </div>
    `;

    const phoneWidgetHTML = `<div class="phone-widget-container"><div class="widget-overlay" id="phone-overlay" style="display: none;"></div><button id="phone-widget-btn" class="phone-widget-btn"><i class="fas fa-phone-alt"></i></button><div id="phone-widget-content" class="phone-widget-content" style="display: none;"><div class="widget-header"><h3>Telefones Úteis</h3><button id="close-phone-widget" class="close-widget-btn">&times;</button></div><ul class="phone-list"><li><a href="tel:190"><strong>190</strong> - Polícia Militar</a></li><li><a href="tel:192"><strong>192</strong> - SAMU</a></li><li><a href="tel:193"><strong>193</strong> - Bombeiros</a></li><li><a href="tel:199"><strong>199</strong> - Defesa Civil</a></li><li><a href="tel:188"><strong>188</strong> - CVV</a></li></ul></div></div>`;

    document.body.insertAdjacentHTML('beforeend', mapWidgetHTML);
    document.body.insertAdjacentHTML('beforeend', phoneWidgetHTML);

    // --- UI Logic ---
    const mapBtn = document.getElementById('map-widget-btn');
    const mapContent = document.getElementById('map-widget-content');
    const closeMapBtn = document.getElementById('close-map-widget');
    const mapOverlay = document.getElementById('map-overlay');
    const openMapModal = () => { mapOverlay.style.display = 'block'; mapContent.style.display = 'flex'; initializeMap(); };
    const closeMapModal = () => { mapOverlay.style.display = 'none'; mapContent.style.display = 'none'; };
    mapBtn.addEventListener('click', openMapModal);
    closeMapBtn.addEventListener('click', closeMapModal);
    mapOverlay.addEventListener('click', closeMapModal);

    const phoneBtn = document.getElementById('phone-widget-btn');
    const phoneContent = document.getElementById('phone-widget-content');
    const closePhoneBtn = document.getElementById('close-phone-widget');
    const phoneOverlay = document.getElementById('phone-overlay');
    const openPhoneModal = () => { phoneOverlay.style.display = 'block'; phoneContent.style.display = 'flex'; };
    const closePhoneModal = () => { phoneOverlay.style.display = 'none'; phoneContent.style.display = 'none'; };
    phoneBtn.addEventListener('click', openPhoneModal);
    closePhoneBtn.addEventListener('click', closePhoneModal);
    phoneOverlay.addEventListener('click', closePhoneModal);

    // --- Loaders ---
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
            const script = document.createElement('script');
            script.src = src; script.onload = resolve; script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    function loadCSS(href) {
        if (document.querySelector(`link[href="${href}"]`)) return;
        const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = href;
        document.head.appendChild(link);
    }

    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; const p = Math.PI/180;
        const a = 0.5 - Math.cos((lat2-lat1)*p)/2 + Math.cos(lat1*p) * Math.cos(lat2*p) * (1-Math.cos((lon2-lon1)*p))/2;
        return R * 2 * Math.asin(Math.sqrt(a));
    }

    // --- MAP INIT ---
    async function initializeMap() {
        if (mapInstance) { setTimeout(() => mapInstance.invalidateSize(), 10); return; }

        try {
            loadCSS('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
            loadCSS('https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.css');
            await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
            await loadScript('https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.js');

            const mapContainer = document.getElementById('map-widget-map');
            if (!mapContainer) return;

            mapInstance = L.map(mapContainer).setView([-23.55052, -46.633308], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(position => {
                    const { latitude, longitude } = position.coords;
                    widgetUserCoords = { lat: latitude, lng: longitude };
                    mapInstance.setView([latitude, longitude], 15);
                    
                    if(userMarker) mapInstance.removeLayer(userMarker);
                    userMarker = L.marker([latitude, longitude]).addTo(mapInstance).bindPopup('<b>Você está aqui!</b>').openPopup();

                    // Reverse Nominatim + Tradução
                    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`)
                        .then(res => res.json())
                        .then(async data => {
                            if (data && data.address) {
                                const cleanAddr = formatCleanAddress(data.address);
                                const translatedAddress = await translateText(cleanAddr || data.display_name);
                                document.getElementById('widget-user-address').textContent = translatedAddress;
                            }
                        });
                });
            }

            // --- BUSCA (NOMINATIM + TRADUÇÃO) ---
            const searchForm = document.getElementById('widget-search-form-map');
            const resultsList = document.getElementById('widget-search-results-list');

            searchForm.addEventListener('submit', function(event) {
                event.preventDefault();
                const query = document.getElementById('widget-search-input-map').value;
                
                if (!query || !widgetUserCoords) {
                    alert('Aguarde sua localização para buscar.');
                    return;
                }

                searchMarkers.forEach(m => mapInstance.removeLayer(m));
                searchMarkers = [];
                if (routingControl) { mapInstance.removeControl(routingControl); routingControl = null; }
                resultsList.innerHTML = '<p style="padding:10px;">Buscando...</p>';

                // RAIO 3.5KM (0.032)
                const delta = 0.032;
                const viewbox = [
                    widgetUserCoords.lng - delta, 
                    widgetUserCoords.lat + delta, 
                    widgetUserCoords.lng + delta, 
                    widgetUserCoords.lat - delta
                ].join(',');

                const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&viewbox=${viewbox}&bounded=1&limit=15&addressdetails=1&layer=address,poi`;

                fetch(url)
                .then(res => res.json())
                .then(data => {
                    resultsList.innerHTML = '';
                    if (data.length === 0) {
                        resultsList.innerHTML = '<p style="padding:10px;">Nada encontrado próximo (3.5km).</p>';
                        return;
                    }

                    // Ordenar por distância
                    data.forEach(place => {
                        place.distanceVal = calculateDistance(widgetUserCoords.lat, widgetUserCoords.lng, place.lat, place.lon);
                    });
                    data.sort((a, b) => a.distanceVal - b.distanceVal);

                    data.forEach(async place => {
                        const el = document.createElement('div');
                        el.className = 'widget-result-item';
                        
                        // Nomes brutos
                        const rawName = place.address.amenity || place.address.shop || place.display_name.split(',')[0];
                        const rawCleanAddr = formatCleanAddress(place.address);

                        el.innerHTML = `<h5>${rawName}</h5><p>${rawCleanAddr}</p>`;
                        resultsList.appendChild(el);

                        // Marcador
                        const marker = L.marker([place.lat, place.lon]).addTo(mapInstance)
                            .bindPopup(`<b>${rawName}</b><br>${rawCleanAddr}`);
                        searchMarkers.push(marker);

                        el.addEventListener('click', () => {
                            if(routingControl) mapInstance.removeControl(routingControl);
                            searchMarkers.forEach(m => mapInstance.removeLayer(m));
                            
                            // Rotas
                            routingControl = L.Routing.control({
                                waypoints: [ L.latLng(widgetUserCoords.lat, widgetUserCoords.lng), L.latLng(place.lat, place.lon) ],
                                routeWhileDragging: false, language: 'pt',
                                router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }),
                                createMarker: () => null, show: true
                            }).addTo(mapInstance);
                        });

                        // TRADUÇÃO
                        try {
                            const [transName, transAddr] = await Promise.all([translateText(rawName), translateText(rawCleanAddr)]);
                            el.innerHTML = `
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <h5>${transName}</h5>
                                    <span style="font-size:0.8em; color:#666; background:#eee; padding:2px 6px; border-radius:4px;">${place.distanceVal.toFixed(2)} km</span>
                                </div>
                                <p>${transAddr}</p>
                            `;
                            marker.setPopupContent(`<b>${transName}</b><br>${transAddr}`);
                        } catch(e) {}
                    });

                    if(searchMarkers.length > 0) {
                        const group = new L.featureGroup(searchMarkers.concat(userMarker));
                        mapInstance.fitBounds(group.getBounds().pad(0.2));
                    }
                })
                .catch(err => {
                    console.error(err);
                    resultsList.innerHTML = '<p style="padding:10px;">Erro ao buscar.</p>';
                });
            });

        } catch (e) { console.error(e); }
    }
});