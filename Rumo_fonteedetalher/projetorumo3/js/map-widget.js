

document.addEventListener('DOMContentLoaded', () => {
    // HTML do Widget de Mapa (com overlay)
    const mapWidgetHTML = `
        <div class="map-widget-container">
            <div class="widget-overlay" id="map-overlay" style="display: none;"></div>
            <button id="map-widget-btn" class="map-widget-btn">
                <i class="fas fa-map-marker-alt"></i>
                <span class="widget-tooltip map-tooltip">Veja sua localização!</span>
            </button>
            <div id="map-widget-content" class="map-widget-content" style="display: none;">
                <div class="widget-header">
                    <h3>Sua localização atual</h3>
                    <button id="close-map-widget" class="close-widget-btn">&times;</button>
                </div>
                <div id="map-widget-map" style="height: 300px; width: 100%;"></div>
                <p><strong>Endereço:</strong> <span id="widget-user-address">Carregando...</span></p>
            </div>
        </div>
    `;

    // HTML do Widget de Telefone (com overlay)
    const phoneWidgetHTML = `
        <div class="phone-widget-container">
            <div class="widget-overlay" id="phone-overlay" style="display: none;"></div>
            <button id="phone-widget-btn" class="phone-widget-btn">
                <i class="fas fa-phone-alt"></i>
                <span class="widget-tooltip phone-tooltip">Telefones de Emergência</span>
            </button>
            <div id="phone-widget-content" class="phone-widget-content" style="display: none;">
                <div class="widget-header">
                    <h3>Telefones Úteis</h3>
                    <button id="close-phone-widget" class="close-widget-btn">&times;</button>
                </div>
                <ul class="phone-list">
                    <li><a href="tel:190"><strong>190</strong> - Polícia Militar</a></li>
                    <li><a href="tel:192"><strong>192</strong> - SAMU (Ambulância)</a></li>
                    <li><a href="tel:193"><strong>193</strong> - Bombeiros</a></li>
                    <li><a href="tel:199"><strong>199</strong> - Defesa Civil</a></li>
                    <li><a href="tel:188"><strong>188</strong> - CVV (Apoio Emocional)</a></li>
                </ul>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', mapWidgetHTML);
    document.body.insertAdjacentHTML('beforeend', phoneWidgetHTML);

    // --- Lógica para os Widgets ---

    const mapBtn = document.getElementById('map-widget-btn');
    const mapContent = document.getElementById('map-widget-content');
    const closeMapBtn = document.getElementById('close-map-widget');
    const mapOverlay = document.getElementById('map-overlay');
    
    const openMapModal = () => {
        mapOverlay.style.display = 'block';
        mapContent.style.display = 'flex';
        initializeMap();
    };
    const closeMapModal = () => {
        mapOverlay.style.display = 'none';
        mapContent.style.display = 'none';
    };
    mapBtn.addEventListener('click', openMapModal);
    closeMapBtn.addEventListener('click', closeMapModal);
    mapOverlay.addEventListener('click', closeMapModal);

    const phoneBtn = document.getElementById('phone-widget-btn');
    const phoneContent = document.getElementById('phone-widget-content');
    const closePhoneBtn = document.getElementById('close-phone-widget');
    const phoneOverlay = document.getElementById('phone-overlay');

    const openPhoneModal = () => {
        phoneOverlay.style.display = 'block';
        phoneContent.style.display = 'flex';
    };
    const closePhoneModal = () => {
        phoneOverlay.style.display = 'none';
        phoneContent.style.display = 'none';
    };
    phoneBtn.addEventListener('click', openPhoneModal);
    closePhoneBtn.addEventListener('click', closePhoneModal);
    phoneOverlay.addEventListener('click', closePhoneModal);

    // --- Funções do Mapa (Leaflet) ---
    let mapInstance;
    function initializeMap() {
        if (mapInstance) {
            setTimeout(() => mapInstance.invalidateSize(), 10);
            return;
        }
        const leafletScript = document.createElement('script');
        leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        document.head.appendChild(leafletScript);
        leafletScript.onload = () => {
            const mapContainer = document.getElementById('map-widget-map');
            if (!mapContainer) return;
            mapInstance = L.map(mapContainer).setView([-23.55052, -46.633308], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(position => {
                    const { latitude, longitude } = position.coords;
                    mapInstance.setView([latitude, longitude], 17);
                    L.marker([latitude, longitude]).addTo(mapInstance).bindPopup('<b>Você está aqui!</b>').openPopup();
                    
                    // A MUDANÇA ESTÁ AQUI DENTRO
                    try {
                        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`)
                            .then(res => {
                                if (!res.ok) {
                                    // Se a resposta não for bem-sucedida (como um erro 403), lança um erro
                                    throw new Error('Falha na rede ou erro do servidor');
                                }
                                return res.json();
                            })
                            .then(data => {
                                const addressSpan = document.getElementById('widget-user-address');
                                if (data && data.address) {
                                    const addr = data.address;
                                    addressSpan.textContent = `${addr.road || ""}${addr.house_number ? ', ' + addr.house_number : ''}`;
                                }
                            })
                            .catch(error => {
                                // Captura erros de rede ou da promessa
                                console.error('Erro ao buscar endereço:', error);
                                const addressSpan = document.getElementById('widget-user-address');
                                addressSpan.textContent = 'Não foi possível obter o endereço.';
                            });
                    } catch (error) {
                        // Captura outros erros inesperados
                        console.error('Erro inesperado na função de geolocalização:', error);
                    }
                });
            }
        };
        const leafletCSS = document.createElement('link');
        leafletCSS.rel = 'stylesheet';
        leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(leafletCSS);
    }
});