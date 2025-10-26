document.addEventListener('DOMContentLoaded', () => {

    // --- VARIÁVEIS GLOBAIS DO WIDGET ---
    let mapInstance;
    let userMarker;
    let searchMarkers = [];
    let widgetUserCoords = null;
    let routingControl = null; 

    // --- HTML E CSS INJETADOS ---
    const mapWidgetHTML = `
        <style>
            /* --- Estilos do Modal (Baseados em utils.css) --- */
            
            /* O Fundo escuro */
            .widget-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.6);
                z-index: 1000;
            }

            /* A Janela principal do Modal (estilo location-content) */
            .map-widget-content {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 1001;
                width: 90%;
                max-width: 600px; /* Mais largo para o mapa e rotas */
                max-height: 90vh;
                display: flex;
                flex-direction: column;

                /* Estilos de location-content */
                background-color: #daf3ed;
                border: 6px solid #659474;
                border-radius: 20px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                overflow: hidden; /* Garante que o conteúdo não vaze */
            }

            /* Cabeçalho do Modal (estilo location-header) */
            .map-widget-content .widget-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 20px;
                padding: 18px 25px; /* Mais padding */

                /* Estilos de location-header */
                background-color: #9eddd5;
                border-bottom: 6px solid #659474;
                color: #053536;
            }
            .widget-header h3 { 
                margin: 0; 
                font-size: 1.3rem; 
                font-family: 'Nunito-Black', sans-serif;
                font-weight: 800;
            }
            .widget-header i { font-size: 1.5rem; }
            .close-widget-btn { 
                background: none; 
                border: none; 
                font-size: 28px; 
                cursor: pointer; 
                color: #053536;
                opacity: 0.7;
                transition: opacity 0.2s;
            }
            .close-widget-btn:hover { opacity: 1; }

            /* Corpo do modal onde o conteúdo fica */
            .widget-body {
                padding: 20px;
                display: flex;
                flex-direction: column;
                gap: 15px;
                overflow-y: auto; /* Permite scroll se necessário */
                flex-grow: 1;
            }

            /* --- Dark Mode (Baseado nos seus estilos) --- */
            body.dark-mode .map-widget-content {
                background-color: #4192899f;
                border: 6px solid #317067;
                color: #d6fafc;
            }
            body.dark-mode .map-widget-content .widget-header {
                background-color: #419289;
                border-bottom: 6px solid #317067;
                color: #d6fafc;
            }
            body.dark-mode .close-widget-btn {
                color: #d6fafc;
            }

            /* --- Estilos da Busca (Copiados de utils.css) --- */
            .widget-search-bar-map {
                display: flex;
                align-items: center;
                background-color: #ffea97;
                border: 2px solid #cdbc7b;
                border-radius: 25px;
                padding: 8px 15px;
            }
            .widget-search-bar-map i { color: #8c7f4a; margin-right: 10px; }
            .widget-search-bar-map input {
                border: none; outline: none; flex-grow: 1;
                font-size: 15px; /* <-- FONTE DIMINUÍDA (era 16px) */
                background-color: transparent;
                color: #826414; font-family: 'Nunito-Black', sans-serif;
            }
             .widget-search-bar-map input::placeholder { color: #8c7f4a; opacity: 0.8; }
            .widget-search-bar-map .btn-search-map {
                border: none; background-color: #053536; color: white;
                padding: 8px 15px; border-radius: 20px; cursor: pointer;
                margin-left: 10px; transition: background-color 0.3s;
                font-family: 'Nunito-Black', sans-serif;
            }
            .widget-search-bar-map .btn-search-map:hover { background-color: #042a2b; }

            #map-widget-map {
                height: 400px; width: 100%;
                border-radius: 15px;
                border: 1px solid #659474;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
                z-index: 0; /* Garante que o mapa fique abaixo dos controles */
            }

            #widget-search-results-list {
                max-height: 200px;
                overflow-y: auto;
            }
            .widget-result-item {
                background-color: #cae8ff; border: 2px solid #739d9f;
                border-radius: 12px; padding: 12px 15px;
                margin-bottom: 10px; cursor: pointer;
                transition: background-color 0.2s, transform 0.2s;
            }
            .widget-result-item:hover { background-color: #b8d9f2; transform: translateY(-2px); }
            .widget-result-item h5 { margin: 0 0 5px 0; color: #053536; font-size: 1rem; }
            .widget-result-item p { margin: 0; font-size: 0.85em; color: #333; }

            .widget-body p#widget-address-container {
                margin: 5px 0 0 0;
            }

            /* --- Dark Mode para Busca (Copiado de utils.css) --- */
            body.dark-mode .widget-search-bar-map { background-color: #4f4a3a; border-color: #8c7f4a; }
            body.dark-mode .widget-search-bar-map i,
            body.dark-mode .widget-search-bar-map input { color: #f0e6c5; }
            body.dark-mode .widget-search-bar-map input::placeholder { color: #f0e6c5; }
            body.dark-mode #map-widget-map { border-color: #317067; }
            body.dark-mode .widget-result-item { background-color: #3a4f60; border-color: #739d9f; }
            body.dark-mode .widget-result-item:hover { background-color: #4a637a; }
            body.dark-mode .widget-result-item h5 { color: #cae8ff; }
            body.dark-mode .widget-result-item p { color: #ccc; }
            
            /* CSS para o painel de rotas */
            .leaflet-routing-container {
                /* Remove o fundo branco padrão para integrar melhor */
                background-color: var(--card-hub-bg, #ade6ec) !important;
                border: 1px solid var(--border-color, #85cbcb);
                color: var(--text-color, #0a4849);
            }
            body.dark-mode .leaflet-routing-container {
                background-color: var(--card-hub-bg, #2a5a5a) !important;
                border: 1px solid var(--border-color, #0e3b3b);
                color: var(--text-color, #cce5e2);
            }
            .leaflet-routing-container h2 {
                 color: var(--text-color, #0a4849) !important;
            }
            body.dark-mode .leaflet-routing-container h2 {
                color: var(--text-color, #cce5e2) !important;
            }

            /* --- BLOCO RESPONSIVO ATUALIZADO --- */
            @media (max-width: 480px) {
                .widget-search-bar-map {
                    position: relative; /* Necessário para o botão absoluto */
                    padding: 6px 10px;  /* Padding um pouco menor */
                }

                .widget-search-bar-map input {
                    /* Adiciona espaço à direita para o botão não sobrepor o texto */
                    padding-right: 90px; 
                }
                
                .widget-search-bar-map i {
                     margin-right: 5px; /* Menos margem no ícone */
                }

                .widget-search-bar-map .btn-search-map {
                    position: absolute;   /* Sobrepõe a barra */
                    right: 8px;           /* Alinha à direita, dentro da barra */
                    top: 50%;
                    transform: translateY(-50%);
                    margin-left: 0;       /* Remove a margem antiga */
                    padding: 6px 12px;    /* Botão um pouco menor */
                    font-size: 0.85rem;   /* Texto do botão menor */
                }
            }
            /* --- FIM DA REGRA RESPONSIVA --- */

        </style>

        <div class="map-widget-container">
            <div class="widget-overlay" id="map-overlay" style="display: none;"></div>
            
            <button id="map-widget-btn" class="map-widget-btn">
                <i class="fas fa-map-marker-alt"></i>
                <span class="widget-tooltip map-tooltip">Veja sua localização!</span>
            </button>

            <div id="map-widget-content" class="map-widget-content" style="display: none;">
                
                <div class="widget-header">
                    <i class="fas fa-map-marker-alt"></i>
                    <h3>Sua localização e Rotas</h3>
                    <button id="close-map-widget" class="close-widget-btn">&times;</button>
                </div>
                
                <div class="widget-body">
                    <form id="widget-search-form-map" class="widget-search-bar-map" action="#">
                        <i class="fas fa-search"></i>
                        <input type="text" id="widget-search-input-map" placeholder="Pesquisar por locais...">
                        <button type="submit" class="btn-search-map">Buscar</button>
                    </form>

                    <div id="map-widget-map"></div>

                    <div id="widget-search-results-list"></div>

                    <p id="widget-address-container">
                        <strong>Endereço:</strong> <span id="widget-user-address">Carregando...</span>
                    </p>
                </div>
            </div>
        </div>
    `;

    // HTML do Widget de Telefone (sem alterações)
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

    // Lógica do widget de telefone (sem alterações)
    const phoneBtn = document.getElementById('phone-widget-btn');
    const phoneContent = document.getElementById('phone-widget-content');
    const closePhoneBtn = document.getElementById('close-phone-widget');
    const phoneOverlay = document.getElementById('phone-overlay');
    const openPhoneModal = () => { phoneOverlay.style.display = 'block'; phoneContent.style.display = 'flex'; };
    const closePhoneModal = () => { phoneOverlay.style.display = 'none'; phoneContent.style.display = 'none'; };
    phoneBtn.addEventListener('click', openPhoneModal);
    closePhoneBtn.addEventListener('click', closePhoneModal);
    phoneOverlay.addEventListener('click', closePhoneModal);

    // --- Funções do Mapa (Leaflet + Roteamento) ---

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    function loadCSS(href) {
        if (document.querySelector(`link[href="${href}"]`)) {
            return;
        }
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }

    async function initializeMap() {
        if (mapInstance) {
            setTimeout(() => mapInstance.invalidateSize(), 10);
            return;
        }

        try {
            loadCSS('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
            loadCSS('https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.css');

            await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
            await loadScript('https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.js');

            const mapContainer = document.getElementById('map-widget-map');
            if (!mapContainer || !L.Routing) return; 

            mapInstance = L.map(mapContainer).setView([-23.55052, -46.633308], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);
            
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(position => {
                    const { latitude, longitude } = position.coords;
                    widgetUserCoords = { lat: latitude, lng: longitude };

                    mapInstance.setView([latitude, longitude], 15);
                    
                    if (userMarker) mapInstance.removeLayer(userMarker);
                    userMarker = L.marker([latitude, longitude]).addTo(mapInstance)
                        .bindPopup('<b>Você está aqui!</b>').openPopup();
                    
                    // Fetch (versão final para Netlify)
                    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`, {
                        referrerPolicy: "strict-origin-when-cross-origin" 
                    })
                        .then(res => res.json())
                        .then(data => {
                            const addressSpan = document.getElementById('widget-user-address');
                            if (data && data.address) {
                                const addr = data.address;
                                const rua = addr.road || "";
                                const numero = addr.house_number || "";
                                const bairro = addr.suburb || "";
                                const cidade = addr.city || addr.town || "";
                                const parte1 = `${rua}${numero ? ', ' + numero : ''}`;
                                const enderecoFinal = [parte1, bairro, cidade].filter(Boolean).join(' - ');
                                addressSpan.textContent = enderecoFinal || data.display_name;
                            }
                        }).catch(error => {
                            console.error('Erro ao buscar endereço:', error);
                            document.getElementById('widget-user-address').textContent = 'Não foi possível obter o endereço.';
                        });
                }, () => {
                     document.getElementById('widget-user-address').textContent = 'Não foi possível obter sua localização.';
                });
            }

            const searchForm = document.getElementById('widget-search-form-map');
            const resultsList = document.getElementById('widget-search-results-list');

            searchForm.addEventListener('submit', function(event) {
                event.preventDefault();
                const query = document.getElementById('widget-search-input-map').value;
                
                if (!query) return;
                if (!widgetUserCoords) {
                    alert('Aguarde até obtermos sua localização para buscar.');
                    return;
                }

                searchMarkers.forEach(marker => mapInstance.removeLayer(marker));
                searchMarkers = [];
                if (routingControl) {
                    mapInstance.removeControl(routingControl);
                    routingControl = null;
                }

                resultsList.innerHTML = '<p style="padding: 10px; text-align: center;">Buscando...</p>';

                const viewbox = [widgetUserCoords.lng - 0.1, widgetUserCoords.lat + 0.1, widgetUserCoords.lng + 0.1, widgetUserCoords.lat - 0.1].join(',');
                const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&viewbox=${viewbox}&bounded=1&limit=5&addressdetails=1`;
                
                // Fetch (versão final para Netlify)
                fetch(url, {
                    referrerPolicy: "strict-origin-when-cross-origin" 
                })
                .then(response => response.json())
                .then(data => {
                    if (data.length === 0) {
                        resultsList.innerHTML = '<p style="padding: 10px; text-align: center;">Nenhum resultado encontrado perto de você.</p>';
                        return;
                    }
                    resultsList.innerHTML = ''; 

                    data.forEach(place => {
                        const placeName = place.address.amenity || place.address.shop || place.address.tourism || place.display_name.split(',')[0];
                        
                        const listItem = document.createElement('div');
                        listItem.className = 'widget-result-item';
                        listItem.innerHTML = `<h5>${placeName}</h5><p>${place.display_name}</p>`;
                        
                        listItem.addEventListener('click', () => {
                            if (!widgetUserCoords) {
                                alert('Sua localização ainda não foi encontrada.');
                                return;
                            }
                            
                            if (routingControl) {
                                mapInstance.removeControl(routingControl);
                            }
                            searchMarkers.forEach(marker => mapInstance.removeLayer(marker));
                            searchMarkers = [];
                            resultsList.innerHTML = ''; 

                            routingControl = L.Routing.control({
                                waypoints: [
                                    L.latLng(widgetUserCoords.lat, widgetUserCoords.lng), 
                                    L.latLng(place.lat, place.lon)                      
                                ],
                                routeWhileDragging: false, 
                                language: 'pt', 
                                router: L.Routing.osrmv1({
                                    serviceUrl: 'https://router.project-osrm.org/route/v1'
                                }),
                                createMarker: function() { return null; }, 
                                show: true 
                            }).addTo(mapInstance);

                            mapInstance.fitBounds([
                                [widgetUserCoords.lat, widgetUserCoords.lng],
                                [place.lat, place.lon]
                            ], { padding: [50, 50] });
                        });

                        resultsList.appendChild(listItem);
                    });
                }).catch(error => {
                    console.error('Erro na busca de locais:', error);
                    resultsList.innerHTML = '<p style="padding: 10px; text-align: center;">Ocorreu um erro ao buscar.</p>';
                });
            });

        } catch (error) {
            console.error("Falha ao carregar scripts do mapa:", error);
            const mapContainer = document.getElementById('map-widget-map');
            if (mapContainer) {
                mapContainer.innerHTML = "<p>Erro ao carregar o mapa. Tente recarregar a página.</p>";
            }
        }
    }
});