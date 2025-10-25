document.addEventListener('DOMContentLoaded', function () {

    // --- LÓGICA DO ACORDEÃO (DROPDOWNS) ---
    const dropdownHeaders = document.querySelectorAll('.tool-header');
    let map; 
    let userMarker;
    let searchMarkers = [];
    let userCoords;
    let routingControl = null; // Variável para guardar o controlo da rota

    dropdownHeaders.forEach(header => {
        header.addEventListener('click', function () {
            const content = this.nextElementSibling;
            const isActive = this.classList.contains('active');

            dropdownHeaders.forEach(h => {
                if (h !== this) {
                    h.classList.remove('active');
                    h.nextElementSibling.style.display = 'none';
                }
            });

            if (isActive) {
                this.classList.remove('active');
                content.style.display = 'none';
            } else {
                this.classList.add('active');
                content.style.display = this.classList.contains('docs-header') ? 'flex' : 'block';
                
                // Inicializa o mapa apenas quando necessário e se o Leaflet estiver carregado
                if (this.classList.contains('location-header') && typeof L !== 'undefined' && !map) {
                    initMap();
                } else if (this.classList.contains('location-header') && map) {
                    // Se o mapa já existe, apenas invalida o tamanho para garantir a renderização
                    setTimeout(() => map.invalidateSize(), 10);
                }
            }
        });
    });
    
    // --- INÍCIO DA SEÇÃO DO MAPA ---
    function initMap() {
        // Verifica se o elemento 'map' existe antes de criar o mapa
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            console.error("Elemento 'map' não encontrado no DOM.");
            return; 
        }

        map = L.map('map').setView([0, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(onLocationSuccess, onLocationError);
        } else {
            document.getElementById('user-address').textContent = 'Geolocalização não suportada.';
        }
        
        // Ativa o formulário de busca APÓS inicializar o mapa
        setupSearchForm(); 
    }

    function onLocationSuccess(position) {
        userCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        if (!map) return; // Garante que o mapa existe

        map.setView([userCoords.lat, userCoords.lng], 15);
        
        if (userMarker) map.removeLayer(userMarker); // Remove marcador antigo
        userMarker = L.marker([userCoords.lat, userCoords.lng]).addTo(map)
            .bindPopup('<b>Você está aqui!</b>').openPopup();
        
        // Busca de endereço (Geocoding reverso)
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userCoords.lat}&lon=${userCoords.lng}&addressdetails=1`, {
            referrerPolicy: "strict-origin-when-cross-origin" 
        })
            .then(response => response.json())
            .then(data => {
                const addressSpan = document.getElementById('user-address');
                if(!addressSpan) return; // Verifica se o elemento existe

                if (data && data.address) {
                    const addr = data.address;
                    const rua = addr.road || "";
                    const numero = addr.house_number || "";
                    const bairro = addr.suburb || "";
                    const cidade = addr.city || addr.town || "";
                    const parte1 = `${rua}${numero ? ', ' + numero : ''}`;
                    const enderecoFinal = [parte1, bairro, cidade].filter(Boolean).join(' - ');
                    addressSpan.textContent = enderecoFinal || data.display_name;
                } else {
                    addressSpan.textContent = data.display_name || 'Endereço não encontrado.';
                }
            }).catch(error => {
                console.error('Erro ao buscar endereço:', error);
                 const addressSpan = document.getElementById('user-address');
                 if(addressSpan) addressSpan.textContent = 'Não foi possível obter o endereço.';
            });
    }

    function onLocationError(error) {
        alert(`Erro ao obter localização: ${error.message}`);
         const addressSpan = document.getElementById('user-address');
         if(addressSpan) addressSpan.textContent = 'Não foi possível obter sua localização.';
    }
    
    // Função separada para configurar o formulário de busca
    function setupSearchForm() {
        const searchForm = document.getElementById('search-form-map');
        const resultsList = document.getElementById('search-results-list');
        
        if (!searchForm || !resultsList) {
            console.error("Formulário de busca ou lista de resultados não encontrados.");
            return;
        }

        searchForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const query = document.getElementById('search-input-map').value;
            
            if (!query) {
                alert('Digite um termo de busca.');
                return;
            }
             if (!userCoords) {
                alert('Aguarde até obtermos sua localização para buscar.');
                return;
            }
            if (!map) return; // Garante que o mapa existe

            // Limpa marcadores e rotas anteriores
            searchMarkers.forEach(marker => map.removeLayer(marker));
            searchMarkers = [];
            if (routingControl) {
                map.removeControl(routingControl);
                routingControl = null;
            }
            
            resultsList.innerHTML = '<p style="padding: 10px; text-align: center;">Buscando...</p>';

            const viewbox = [userCoords.lng - 0.1, userCoords.lat + 0.1, userCoords.lng + 0.1, userCoords.lat - 0.1].join(',');
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&viewbox=${viewbox}&bounded=1&limit=10&addressdetails=1`;
            
            fetch(url, {
                referrerPolicy: "strict-origin-when-cross-origin" 
            })
            .then(response => response.json())
            .then(data => {
                if (data.length === 0) {
                    resultsList.innerHTML = '<p style="padding: 10px; text-align: center;">Nenhum resultado encontrado perto de você.</p>';
                    return;
                }
                resultsList.innerHTML = ''; // Limpa o "Buscando..."

                data.forEach(place => {
                    const placeName = place.address.amenity || place.address.shop || place.address.tourism || place.display_name.split(',')[0];
                    
                    const listItem = document.createElement('div');
                    listItem.className = 'result-item'; // Usa a classe CSS de utils.css
                    listItem.innerHTML = `<h5>${placeName}</h5><p>${place.display_name}</p>`;
                    
                    // *** A LÓGICA DE CLIQUE FOI ATUALIZADA AQUI ***
                    listItem.addEventListener('click', () => {
                        if (!userCoords) {
                            alert('Sua localização ainda não foi encontrada para traçar a rota.');
                            return;
                        }
                        if (!map || typeof L.Routing === 'undefined') {
                             console.error("Mapa ou Routing Machine não inicializados.");
                             return;
                        }
                        
                        // Limpa rotas e marcadores de busca antigos
                        if (routingControl) {
                            map.removeControl(routingControl);
                        }
                        searchMarkers.forEach(marker => map.removeLayer(marker));
                        searchMarkers = [];
                        resultsList.innerHTML = ''; // Esconde a lista de resultados

                        // Cria a rota
                        routingControl = L.Routing.control({
                            waypoints: [
                                L.latLng(userCoords.lat, userCoords.lng), // Ponto A (Usuário)
                                L.latLng(place.lat, place.lon)           // Ponto B (Destino)
                            ],
                            routeWhileDragging: false, 
                            language: 'pt', 
                            router: L.Routing.osrmv1({
                                serviceUrl: 'https://router.project-osrm.org/route/v1'
                            }),
                            createMarker: function() { return null; }, // Não cria marcadores A e B padrão
                            show: true // Mostra o painel de instruções da rota
                        }).addTo(map);

                        // Ajusta o zoom para a rota (opcional, pode ser automático)
                        map.fitBounds([
                            [userCoords.lat, userCoords.lng],
                            [place.lat, place.lon]
                        ], { padding: [50, 50] });
                    });

                    resultsList.appendChild(listItem);
                });
                
                // Opcional: ajustar o zoom para mostrar os resultados iniciais
                // const initialMarkersGroup = L.featureGroup(data.map(p => L.marker([p.lat, p.lon])));
                // if (userMarker) initialMarkersGroup.addLayer(userMarker);
                // if (initialMarkersGroup.getLayers().length > 0) {
                //     map.fitBounds(initialMarkersGroup.getBounds().pad(0.3));
                // }

            }).catch(error => {
                console.error('Erro na busca de locais:', error);
                resultsList.innerHTML = '<p style="padding: 10px; text-align: center;">Ocorreu um erro ao buscar.</p>';
            });
        });
    }
    // --- FIM DA SEÇÃO DO MAPA ---
    // --- LÓGICA DO CONVERSOR DE MOEDA ---
    const currencyForm = document.querySelector('.currency-content .converter-form');
    if (currencyForm) {
        const convertButton = currencyForm.querySelector('.btn-converter');
        const fromCurrency = document.getElementById('from-currency');
        const toCurrency = document.getElementById('to-currency');
        const amountCurrency = document.getElementById('amount-currency');
        const resultCurrencyBox = currencyForm.querySelector('.result-box span');
        const rates = { 'USD': { 'BRL': 5.25, 'EUR': 0.92, 'USD': 1 }, 'EUR': { 'BRL': 5.70, 'USD': 1.08, 'EUR': 1 }, 'BRL': { 'USD': 0.19, 'EUR': 0.175, 'BRL': 1 } };
        convertButton.addEventListener('click', () => {
            const amount = parseFloat(amountCurrency.value);
            const from = fromCurrency.value;
            const to = toCurrency.value;
            if (isNaN(amount) || amount <= 0) { resultCurrencyBox.textContent = `${to} 0.00`; return; }
            const rate = rates[from][to];
            const result = amount * rate;
            resultCurrencyBox.textContent = `${to} ${result.toFixed(2)}`;
        });
    }

    // --- LÓGICA DO CONVERSOR DE MEDIDAS ---
    const measureForm = document.querySelector('.measure-content .converter-form');
    if (measureForm) {
        const convertButton = measureForm.querySelector('.btn-converter');
        const amountMeasure = document.getElementById('amount-measure');
        const fromUnitSelect = measureForm.querySelectorAll('.measure-selects select')[0];
        const toUnitSelect = measureForm.querySelectorAll('.measure-selects select')[1];
        const resultMeasureBox = measureForm.querySelector('.result-box span');
        const lengthFactors = { 'Metro (m)': 1, 'Quilômetro (km)': 1000, 'Centímetro (cm)': 0.01, 'Milímetro (mm)': 0.001 };
        convertButton.addEventListener('click', () => {
            const amount = parseFloat(amountMeasure.value);
            const fromUnit = fromUnitSelect.value;
            const toUnit = toUnitSelect.value;
            if (isNaN(amount)) { resultMeasureBox.textContent = '0'; return; }
            const valueInMeters = amount * lengthFactors[fromUnit];
            const result = valueInMeters / lengthFactors[toUnit];
            resultMeasureBox.textContent = `${result.toFixed(2)} ${toUnit.split('(')[1].replace(')','')}`;
        });
    }

    // --- LÓGICA DO DROPDOWN DE IDIOMAS ---
    const languages = { "Espanhol": ["Venezuela", "Bolívia", "Paraguai", "Peru", "Argentina", "Colômbia", "Chile"], "Crioulo Haitiano": ["Haiti"], "Francês": ["Haiti", "República Democrática do Congo", "Senegal", "África Ocidental"], "Inglês": ["Nigéria", "Gana", "África do Sul"], "Árabe": ["Síria", "Líbano", "Palestina"], "Mandarim (Chinês)": ["China"], "Coreano": ["Coreia do Sul"], "Japonês": ["Japão"], "Guarani": ["Paraguai", "Bolívia"], "Quéchua": ["Bolívia", "Peru"], "Português": ["Angola", "Moçambique", "Cabo Verde", "Portugal", "Guiné-Bissau", "Timor-Leste"] };
    function populateLanguageDropdown() {
        const dropdown = document.getElementById('language-select-utils');
        if (dropdown) {
            dropdown.innerHTML = '<option value="pt-br" selected>Português - Brasil</option>';
            for (const language in languages) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = language;
                languages[language].forEach(country => {
                    const option = document.createElement('option');
                    option.value = `${language.toLowerCase().replace(/\s/g, '_')}-${country.toLowerCase()}`;
                    option.textContent = `${language} - ${country}`;
                    optgroup.appendChild(option);
                });
                dropdown.appendChild(optgroup);
            }
        }
    }
    populateLanguageDropdown();

    // --- LÓGICA DO COFRE DE DOCUMENTOS ---
    const docForm = document.getElementById('add-doc-form');
    const docList = document.getElementById('doc-list');
    const savedDocs = JSON.parse(localStorage.getItem('userDocuments')) || [];
    const renderDocs = () => {
        if (!docList) return;
        docList.innerHTML = savedDocs.length === 0 ? '<p>Nenhum documento adicionado ainda.</p>' : '';
        savedDocs.forEach((doc, index) => {
            const docElement = document.createElement('div');
            docElement.classList.add('doc-item');
            const expiryDate = new Date(doc.expiry);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let statusClass = 'ok', statusText = 'Válido';
            const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            if (expiryDate < today) { statusClass = 'expired'; statusText = 'Expirado'; } 
            else if (diffDays <= 30) { statusClass = 'warning'; statusText = 'Expira em breve'; }
            docElement.innerHTML = `<div class="doc-info"><h4>${doc.type}</h4><p>Validade: ${new Date(doc.expiry).toLocaleDateString()}</p></div><div class="doc-status ${statusClass}">${statusText}</div><button class="btn-delete-doc" data-index="${index}" title="Excluir documento"><i class="fas fa-trash-alt"></i></button>`;
            docList.appendChild(docElement);
        });
    };
    if (docForm) {
        docForm.addEventListener('submit', (e) => {
            e.preventDefault();
            savedDocs.push({ type: document.getElementById('doc-type').value, issue: document.getElementById('doc-issue-date').value, expiry: document.getElementById('doc-expiry-date').value });
            localStorage.setItem('userDocuments', JSON.stringify(savedDocs));
            renderDocs();
            docForm.reset();
        });
    }
    if (docList) {
        docList.addEventListener('click', (e) => {
            const button = e.target.closest('.btn-delete-doc');
            if (button) {
                const docIndex = button.getAttribute('data-index');
                if (confirm('Tem certeza que deseja excluir este documento?')) {
                    savedDocs.splice(docIndex, 1);
                    localStorage.setItem('userDocuments', JSON.stringify(savedDocs));
                    renderDocs();
                }
            }
        });
    }
    renderDocs();
});