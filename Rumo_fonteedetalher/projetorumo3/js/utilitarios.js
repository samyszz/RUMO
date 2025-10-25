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
                // Garante que L (Leaflet) está definido globalmente
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
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            console.error("Elemento 'map' não encontrado no DOM.");
            return; 
        }
         // Garante que L exista antes de criar o mapa
        if (typeof L === 'undefined') {
             console.error("Leaflet (L) não está definido. Verifique a ordem de carregamento dos scripts.");
             return;
        }

        map = L.map('map').setView([0, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(onLocationSuccess, onLocationError);
        } else {
             const addressSpan = document.getElementById('user-address');
             if (addressSpan) addressSpan.textContent = 'Geolocalização não suportada.';
        }
        
        // Ativa o formulário de busca APÓS inicializar o mapa base
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
        
        // Busca de endereço (Geocoding reverso) - Versão Netlify
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userCoords.lat}&lon=${userCoords.lng}&addressdetails=1`, {
            referrerPolicy: "strict-origin-when-cross-origin",
            headers: { 
              'User-Agent': 'RUMO/1.0 (https://redeunificadademobilidadeeorientacao.netlify.app/; contact@example.com)' // Substitua pelo seu URL/email
            } 
        })
            .then(response => { 
                if (!response.ok) {
                    // Não mostra alert, apenas loga o erro no console
                    console.error(`HTTP error! status: ${response.status} ao buscar endereço.`);
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                const addressSpan = document.getElementById('user-address');
                if(!addressSpan) return; 

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
                // Não mostra alert, apenas loga o erro no console
                console.error('Catch: Erro ao buscar endereço:', error.message);
                 const addressSpan = document.getElementById('user-address');
                 if(addressSpan) addressSpan.textContent = 'Não foi possível obter o endereço.';
            });
    }

    function onLocationError(error) {
        // alert(`Erro ao obter localização: ${error.message}`); // Comentado
        console.warn(`Erro ao obter localização: ${error.message}`);
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
                // alert('Digite um termo de busca.'); // Usar notificação mais suave se tiver
                return;
            }
             if (!userCoords) {
                alert('Aguarde até obtermos sua localização para buscar.'); // Mantém este alerta
                return;
            }
            if (!map) { // Garante que o mapa existe
                 console.error("Variável 'map' não está definida ao tentar buscar.");
                 return;
            }

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
            
            // Fetch da busca - Versão Netlify
            fetch(url, {
                referrerPolicy: "strict-origin-when-cross-origin",
                headers: { 
                  'User-Agent': 'RUMO/1.0 (https://redeunificadademobilidadeeorientacao.netlify.app/; contact@example.com)' // Substitua pelo seu URL/email
                } 
            })
            .then(response => { 
                if (!response.ok) {
                     // Não mostra alert, apenas loga o erro no console
                     console.error(`HTTP error! status: ${response.status} ao buscar locais.`);
                     throw new Error(`HTTP error! status: ${response.status}`);
                 }
                return response.json();
            })
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
                    
                    // Evento de clique no resultado
                    listItem.addEventListener('click', () => {
                        // *** VERIFICAÇÃO ADICIONADA AQUI ***
                        if (!map || typeof L.Routing === 'undefined') {
                             console.error("Mapa ou Routing Machine não inicializados ao clicar no resultado.");
                             alert("O mapa ainda não está pronto para traçar rotas. Tente novamente em alguns segundos."); // Informa o usuário
                             return; // Impede a execução do resto do código
                        }
                         if (!userCoords) {
                            alert('Sua localização ainda não foi encontrada para traçar a rota.');
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
                                serviceUrl: 'https://router.project-osrm.org/route/v1' // Sem proxy
                            }),
                            createMarker: function() { return null; }, 
                            show: true 
                        }).addTo(map);

                        // Ajusta o zoom para a rota 
                        map.fitBounds([
                            [userCoords.lat, userCoords.lng],
                            [place.lat, place.lon]
                        ], { padding: [50, 50] });
                    });

                    resultsList.appendChild(listItem);
                });

            }).catch(error => {
                // Não mostra alert, apenas loga o erro no console
                console.error('Catch: Erro na busca de locais:', error.message);
                resultsList.innerHTML = '<p style="padding: 10px; text-align: center;">Ocorreu um erro ao buscar.</p>';
            });
        });
    }
    // --- FIM DA SEÇÃO DO MAPA ---

    // --- LÓGICA DO CONVERSOR DE MOEDA ---
    // (Código existente - sem alterações)
    const currencyForm = document.querySelector('.currency-content .converter-form');
    if (currencyForm) {
        const convertButton = currencyForm.querySelector('.btn-converter');
        const fromCurrency = document.getElementById('from-currency');
        const toCurrency = document.getElementById('to-currency');
        const amountCurrency = document.getElementById('amount-currency');
        const resultCurrencyBox = currencyForm.querySelector('.result-box span');
        const rates = { 
            'USD': { 'BRL': 5.25, 'EUR': 0.92, 'USD': 1 }, 
            'EUR': { 'BRL': 5.70, 'USD': 1.08, 'EUR': 1 }, 
            'BRL': { 'USD': 0.19, 'EUR': 0.175, 'BRL': 1 } 
        };
        convertButton.addEventListener('click', () => {
            const amount = parseFloat(amountCurrency.value);
            const from = fromCurrency.value;
            const to = toCurrency.value;
            if (isNaN(amount) || amount <= 0) { 
                resultCurrencyBox.textContent = `${to} 0.00`; return; 
            }
            const rate = rates[from] ? rates[from][to] : undefined; 
            if (rate === undefined) {
                 resultCurrencyBox.textContent = `Taxa não encontrada`; return; 
            }
            const result = amount * rate;
            resultCurrencyBox.textContent = `${to} ${result.toFixed(2)}`;
        });
    }

    // --- LÓGICA DO CONVERSOR DE MEDIDAS ---
    // (Código existente - sem alterações)
    const measureForm = document.querySelector('.measure-content .converter-form');
    if (measureForm) {
        const convertButton = measureForm.querySelector('.btn-converter');
        const amountMeasure = document.getElementById('amount-measure');
        const fromUnitSelect = measureForm.querySelectorAll('.measure-selects select')[0];
        const toUnitSelect = measureForm.querySelectorAll('.measure-selects select')[1];
        const resultMeasureBox = measureForm.querySelector('.result-box span');
        const lengthFactors = { 
            'Metro (m)': 1, 'Quilômetro (km)': 1000, 
            'Centímetro (cm)': 0.01, 'Milímetro (mm)': 0.001 
        };
        convertButton.addEventListener('click', () => {
            const amount = parseFloat(amountMeasure.value);
            const fromUnit = fromUnitSelect.value;
            const toUnit = toUnitSelect.value;
            
            if (isNaN(amount)) { 
                resultMeasureBox.textContent = 'Valor inválido'; return; 
            }
            if (!lengthFactors[fromUnit] || !lengthFactors[toUnit]) {
                 resultMeasureBox.textContent = 'Unidade inválida'; return;
            }
            const valueInBaseUnit = amount * lengthFactors[fromUnit];
            const result = valueInBaseUnit / lengthFactors[toUnit];
            const toUnitSymbolMatch = toUnit.match(/\(([^)]+)\)/);
            const toUnitSymbol = toUnitSymbolMatch ? toUnitSymbolMatch[1] : '';
            resultMeasureBox.textContent = `${result.toFixed(2)} ${toUnitSymbol}`;
        });
    }

    // --- LÓGICA DO DROPDOWN DE IDIOMAS ---
    // (Código existente - sem alterações)
    const languages = { "Espanhol": ["Venezuela", "Bolívia", "Paraguai", "Peru", "Argentina", "Colômbia", "Chile"], "Crioulo Haitiano": ["Haiti"], "Francês": ["Haiti", "República Democrática do Congo", "Senegal", "África Ocidental"], "Inglês": ["Nigéria", "Gana", "África do Sul"], "Árabe": ["Síria", "Líbano", "Palestina"], "Mandarim (Chinês)": ["China"], "Coreano": ["Coreia do Sul"], "Japonês": ["Japão"], "Guarani": ["Paraguai", "Bolívia"], "Quéchua": ["Bolívia", "Peru"], "Português": ["Angola", "Moçambique", "Cabo Verde", "Portugal", "Guiné-Bissau", "Timor-Leste"] };
    function populateLanguageDropdown() {
        const dropdown = document.getElementById('language-select-utils');
        if (dropdown) {
            dropdown.innerHTML = '<option value="pt-br" selected data-i18n="header.lang.pt_br">Português - Brasil</option>'; 
            for (const language in languages) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = language; 
                languages[language].forEach(country => {
                    const option = document.createElement('option');
                    const langCode = language.substring(0,2).toLowerCase();
                    const countryCode = country.substring(0,2).toLowerCase();
                    option.value = `${langCode}-${countryCode}`; 
                    option.textContent = `${language} - ${country}`;
                    optgroup.appendChild(option);
                });
                dropdown.appendChild(optgroup);
            }
            dropdown.addEventListener('change', (event) => {
                 const selectedLang = event.target.value;
                 console.log("Idioma selecionado em Utilitários:", selectedLang);
                 // if (typeof changeLanguage === 'function') changeLanguage(selectedLang); 
            });
        }
    }
    populateLanguageDropdown();

    // --- LÓGICA DO COFRE DE DOCUMENTOS ---
    // (Código existente - sem alterações)
    const docForm = document.getElementById('add-doc-form');
    const docList = document.getElementById('doc-list');
    let savedDocs = [];
    try {
        const storedDocs = localStorage.getItem('userDocuments');
        savedDocs = storedDocs ? JSON.parse(storedDocs) : [];
        if (!Array.isArray(savedDocs)) savedDocs = []; 
    } catch (e) {
        console.error("Erro ao ler documentos do localStorage:", e);
        savedDocs = [];
    }

    const renderDocs = () => {
        if (!docList) return;
        docList.innerHTML = savedDocs.length === 0 
            ? '<p data-i18n="utilitarios.docs.no_docs">Nenhum documento adicionado ainda.</p>' 
            : '';
        savedDocs.forEach((doc, index) => {
            if (!doc || typeof doc.type !== 'string' || typeof doc.expiry !== 'string') {
                 console.warn("Documento inválido encontrado no índice:", index, doc);
                 return; 
            }
            const docElement = document.createElement('div');
            docElement.classList.add('doc-item');
            const expiryDate = new Date(doc.expiry);
            const issueDate = doc.issue ? new Date(doc.issue) : null; 
            const today = new Date();
            today.setHours(0, 0, 0, 0); 
            let statusClass = 'ok';
            let statusTextKey = 'utilitarios.docs.status_valid'; 
            if (isNaN(expiryDate.getTime())) {
                 statusClass = 'expired'; 
                 statusTextKey = 'utilitarios.docs.status_invalid_date';
            } else {
                 const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                 if (expiryDate < today) { 
                     statusClass = 'expired'; 
                     statusTextKey = 'utilitarios.docs.status_expired'; 
                 } else if (diffDays <= 30) { 
                     statusClass = 'warning'; 
                     statusTextKey = 'utilitarios.docs.status_warning'; 
                 }
            }
            const formattedExpiry = !isNaN(expiryDate.getTime()) ? expiryDate.toLocaleDateString() : 'Inválida';
            const formattedIssue = issueDate && !isNaN(issueDate.getTime()) ? issueDate.toLocaleDateString() : 'N/A';
            docElement.innerHTML = `
                <div class="doc-info">
                    <h4>${doc.type}</h4>
                    <p><span data-i18n="utilitarios.docs.issue_date_label">Emissão</span>: ${formattedIssue}</p>
                    <p><span data-i18n="utilitarios.docs.expiry_date_label">Validade</span>: ${formattedExpiry}</p>
                </div>
                <div class="doc-status ${statusClass}" data-i18n="${statusTextKey}">${statusTextKey.split('.').pop()}</div> 
                <button class="btn-delete-doc" data-index="${index}" title="Excluir documento" data-i18n="utilitarios.docs.delete_title" aria-label="Excluir ${doc.type}">
                    <i class="fas fa-trash-alt"></i>
                </button>`;
            docList.appendChild(docElement);
        });
        if (typeof updateTranslations === 'function') {
           updateTranslations();
        }
    };

    if (docForm) {
        docForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const docTypeInput = document.getElementById('doc-type');
            const docIssueDateInput = document.getElementById('doc-issue-date');
            const docExpiryDateInput = document.getElementById('doc-expiry-date');
            if (!docTypeInput.value || !docExpiryDateInput.value) {
                // alert("Por favor, preencha pelo menos o Tipo e a Data de Validade."); 
                return;
            }
            savedDocs.push({ 
                type: docTypeInput.value, 
                issue: docIssueDateInput.value, 
                expiry: docExpiryDateInput.value 
            });
            try {
                 localStorage.setItem('userDocuments', JSON.stringify(savedDocs));
            } catch (error) {
                 console.error("Erro ao salvar documentos no localStorage:", error);
                 // alert("Não foi possível salvar o documento. O armazenamento pode estar cheio.");
                 savedDocs.pop(); 
                 return;
            }
            renderDocs();
            docForm.reset();
        });
    }

    if (docList) {
        docList.addEventListener('click', (e) => {
            const button = e.target.closest('.btn-delete-doc');
            if (button) {
                const docIndex = parseInt(button.getAttribute('data-index'), 10); 
                const confirmMsgKey = 'utilitarios.docs.delete_confirm';
                const confirmMsg = typeof i18next !== 'undefined' ? i18next.t(confirmMsgKey) : 'Tem certeza que deseja excluir este documento?';
                if (!isNaN(docIndex) && confirm(confirmMsg)) {
                    savedDocs.splice(docIndex, 1);
                    try {
                        localStorage.setItem('userDocuments', JSON.stringify(savedDocs));
                    } catch (error) {
                        console.error("Erro ao salvar após exclusão:", error);
                    }
                    renderDocs();
                }
            }
        });
    }
    renderDocs(); 

    // --- Estilos para o Painel de Rotas (Opcional, pode ir no CSS) ---
     const styleSheet = document.createElement("style");
     styleSheet.type = "text/css";
     styleSheet.innerText = `
        .leaflet-routing-container {
            background-color: var(--card-hub-bg, #ade6ec) !important;
            border: 1px solid var(--border-color, #85cbcb);
            color: var(--text-color, #0a4849);
             border-radius: 8px; /* Opcional */
             box-shadow: 0 2px 5px rgba(0,0,0,0.1); /* Opcional */
        }
        body.dark-mode .leaflet-routing-container {
            background-color: var(--card-hub-bg, #2a5a5a) !important;
            border: 1px solid var(--border-color, #0e3b3b);
            color: var(--text-color, #cce5e2);
        }
        .leaflet-routing-container h2, .leaflet-routing-alt h3 { 
             color: var(--text-color, #0a4849) !important;
             font-family: 'Nunito-Black', sans-serif; /* Opcional */
             font-size: 1.1rem !important; /* Opcional */
             margin-bottom: 10px !important;
        }
        body.dark-mode .leaflet-routing-container h2, 
        body.dark-mode .leaflet-routing-alt h3 {
            color: var(--text-color, #cce5e2) !important;
        }
        .leaflet-routing-instruction { /* Opcional */
             font-size: 0.9rem;
        }
     `;
     document.head.appendChild(styleSheet);

}); // Fim do DOMContentLoaded