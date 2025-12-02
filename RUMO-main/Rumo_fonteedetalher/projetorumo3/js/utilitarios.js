/* js/utilitarios.js - Ferramentas (Mapa, Moedas, Medidas, Idiomas, Docs) */

document.addEventListener('DOMContentLoaded', function () {

    // ==================================================
    // 1. LÓGICA DO ACORDEÃO + MODAL DE AVISO
    // ==================================================
    const dropdownHeaders = document.querySelectorAll('.tool-header');
    const modalOverlay = document.getElementById('docs-warning-modal');
    const modalBtn = document.getElementById('docs-modal-confirm-btn');
    const modalCheck = document.getElementById('docs-modal-check');
    
    let map; 
    let userMarker;
    let searchMarkers = [];
    let userCoords;

    function openDropdown(header) {
        const content = header.nextElementSibling;
        header.classList.add('active');
        content.style.display = header.classList.contains('docs-header') ? 'flex' : 'block';
        
        // Inicia o mapa apenas se a aba de localização for aberta
        if (header.classList.contains('location-header') && !map) {
            initMap();
        }
    }

    function closeOthers(currentHeader) {
        dropdownHeaders.forEach(h => {
            if (h !== currentHeader) {
                h.classList.remove('active');
                h.nextElementSibling.style.display = 'none';
            }
        });
    }

    dropdownHeaders.forEach(header => {
        header.addEventListener('click', function (e) {
            e.preventDefault(); 
            const isActive = this.classList.contains('active');
            const isDocs = this.classList.contains('docs-header');

            if (isActive) {
                this.classList.remove('active');
                this.nextElementSibling.style.display = 'none';
                return;
            }

            closeOthers(this);

            if (isDocs) {
                const hideWarning = localStorage.getItem('hide_docs_warning');
                if (!hideWarning && modalOverlay) {
                    modalOverlay.style.display = 'flex';
                    return; 
                }
            }
            openDropdown(this);
        });
    });

    if (modalBtn) {
        modalBtn.addEventListener('click', () => {
            if (modalCheck && modalCheck.checked) {
                localStorage.setItem('hide_docs_warning', 'true');
            }
            if (modalOverlay) modalOverlay.style.display = 'none';
            const docsHeader = document.querySelector('.docs-header');
            if (docsHeader) openDropdown(docsHeader);
        });
    }
    
    // ==================================================
    // 2. MAPA (Com tratamento de erro CORS)
    // ==================================================
    function initMap() {
        const mapContainer = document.getElementById('map');
        if (!mapContainer) return;

        // Inicializa o mapa com Leaflet
        map = L.map('map').setView([0, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(onLocationSuccess, onLocationError);
        } else {
            const addrEl = document.getElementById('user-address');
            if(addrEl) addrEl.textContent = 'Geolocalização não suportada pelo navegador.';
        }
    }

    function onLocationSuccess(position) {
        userCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        
        // Centraliza e adiciona marcador
        map.setView([userCoords.lat, userCoords.lng], 15);
        userMarker = L.marker([userCoords.lat, userCoords.lng]).addTo(map)
            .bindPopup('<b>Você está aqui!</b>').openPopup();
        
        const addrEl = document.getElementById('user-address');
        if (addrEl) addrEl.textContent = "Buscando endereço...";

        // Tenta buscar o endereço (Reverse Geocoding)
        // NOTA: Em localhost, isso pode falhar por CORS (bloqueio do navegador).
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userCoords.lat}&lon=${userCoords.lng}&addressdetails=1`;

        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error("Erro na resposta da API");
                return response.json();
            })
            .then(data => {
                if (!addrEl) return;
                if (data && data.address) {
                    const addr = data.address;
                    const rua = addr.road || "";
                    const numero = addr.house_number || "";
                    const bairro = addr.suburb || "";
                    const cidade = addr.city || addr.town || "";
                    
                    // Formata endereço bonitinho
                    const parte1 = `${rua}${numero ? ', ' + numero : ''}`;
                    const enderecoFinal = [parte1, bairro, cidade].filter(Boolean).join(' - ');
                    addrEl.textContent = enderecoFinal || data.display_name;
                } else {
                    addrEl.textContent = data.display_name || 'Endereço não encontrado.';
                }
            })
            .catch(error => {
                // Tratamento silencioso do erro CORS para não sujar o console com vermelho
                console.warn("Aviso: Não foi possível obter o endereço textual (provavelmente bloqueio CORS em localhost). O mapa visual continua funcionando.");
                if (addrEl) addrEl.textContent = "Localização obtida (Endereço indisponível offline/local).";
            });
    }

    function onLocationError(error) {
        // Erro ao obter permissão de GPS
        const addrEl = document.getElementById('user-address');
        let msg = "Erro desconhecido.";
        if (error.code === 1) msg = "Permissão de localização negada.";
        if (error.code === 2) msg = "Localização indisponível.";
        if (error.code === 3) msg = "Tempo limite esgotado.";
        
        if(addrEl) addrEl.textContent = msg;
        console.warn(`Erro Geolocation: ${msg}`);
    }
    
    // Busca no Mapa
    const searchForm = document.getElementById('search-form-map');
    if(searchForm) {
        searchForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const query = document.getElementById('search-input-map').value;
            const resultsList = document.getElementById('search-results-list');
            
            if (!query || !userCoords) {
                alert('Aguarde a localização ser detectada para buscar locais próximos.');
                return;
            }
            
            // Limpa marcadores anteriores
            searchMarkers.forEach(marker => map.removeLayer(marker));
            searchMarkers = [];
            resultsList.innerHTML = '<p style="padding:10px;">Buscando...</p>';
            
            // Área de busca próxima ao usuário
            const viewbox = [userCoords.lng - 0.1, userCoords.lat + 0.1, userCoords.lng + 0.1, userCoords.lat - 0.1].join(',');
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&viewbox=${viewbox}&bounded=1&limit=5&addressdetails=1`;
            
            fetch(url)
                .then(res => res.json())
                .then(data => {
                    resultsList.innerHTML = ''; // Limpa "Buscando..."
                    
                    if (data.length === 0) {
                        resultsList.innerHTML = '<p style="padding: 10px;">Sem resultados próximos.</p>';
                        return;
                    }
                    
                    data.forEach(place => {
                        const marker = L.marker([place.lat, place.lon]).addTo(map).bindPopup(`<b>${place.display_name}</b>`);
                        searchMarkers.push(marker);
                        
                        const listItem = document.createElement('div');
                        listItem.className = 'result-item';
                        // Pega o nome mais relevante (loja, amenidade ou turismo)
                        const placeName = place.address.amenity || place.address.shop || place.address.tourism || place.display_name.split(',')[0];
                        
                        listItem.innerHTML = `<h5>${placeName}</h5><p style="font-size:0.8rem; color:#666;">${place.display_name}</p>`;
                        listItem.addEventListener('click', () => {
                            map.setView([place.lat, place.lon], 17);
                            marker.openPopup();
                        });
                        resultsList.appendChild(listItem);
                    });
                    
                    // Ajusta zoom para mostrar todos os resultados
                    const group = new L.featureGroup(searchMarkers.concat(userMarker));
                    map.fitBounds(group.getBounds().pad(0.2));
                })
                .catch(err => {
                    console.warn("Erro na busca (CORS):", err);
                    resultsList.innerHTML = '<p style="padding: 10px; color: red;">Erro ao buscar (Bloqueio de segurança do navegador).</p>';
                });
        });
    }

    // ==================================================
    // 3. CONVERSOR DE MOEDAS
    // ==================================================
    const fromCurrency = document.getElementById('from-currency');
    const toCurrency = document.getElementById('to-currency');
    const amountCurrency = document.getElementById('amount-currency');
    const convertButton = document.querySelector('.currency-content .btn-converter');
    const resultCurrencyBox = document.querySelector('.currency-content .result-box span');

    // Função auxiliar para buscar taxas
    async function fetchRates(base) {
        try {
            const res = await fetch(`https://api.frankfurter.app/latest?from=${base}`);
            if(!res.ok) throw new Error('API Error');
            const data = await res.json();
            return data.rates;
        } catch (err) { 
            return null; 
        }
    }

    if (convertButton) {
        convertButton.addEventListener('click', async function () {
            const amount = parseFloat(amountCurrency.value);
            const from = fromCurrency.value;
            const to = toCurrency.value;
            
            if (isNaN(amount) || amount <= 0) {
                if(resultCurrencyBox) resultCurrencyBox.textContent = `${to} 0.00`;
                return;
            }
            
            // Texto de carregamento
            if(resultCurrencyBox) resultCurrencyBox.textContent = "...";

            let rate = 1; 
            // Tenta buscar taxa real se estiver online
            if(navigator.onLine && from !== to) {
                 const rates = await fetchRates(from);
                 if(rates && rates[to]) rate = rates[to];
                 else {
                     // Fallback manual simples se a API falhar (apenas exemplo)
                     if(from === 'USD' && to === 'BRL') rate = 5.0;
                     if(from === 'BRL' && to === 'USD') rate = 0.2;
                     if(from === 'EUR' && to === 'BRL') rate = 5.5;
                 }
            }
            
            const total = (amount * rate).toFixed(2);
            if(resultCurrencyBox) resultCurrencyBox.textContent = `${to} ${total}`;
        });
    }
    const currencyForm = document.querySelector('.currency-content .converter-form');
    if (currencyForm) currencyForm.addEventListener('submit', e => e.preventDefault());


    // ==================================================
    // 4. CONVERSOR DE MEDIDAS
    // ==================================================
    const unitOptions = {
        length: [ { label: 'Metro (m)', value: 'm' }, { label: 'Quilômetro (km)', value: 'km' }, { label: 'Centímetro (cm)', value: 'cm' } ],
        weight: [ { label: 'Quilograma (kg)', value: 'kg' }, { label: 'Grama (g)', value: 'g' }, { label: 'Tonelada (t)', value: 't' } ],
        temperature: [ { label: 'Celsius (°C)', value: 'C' }, { label: 'Fahrenheit (°F)', value: 'F' }, { label: 'Kelvin (K)', value: 'K' } ]
    };
    
    // Fatores de conversão (baseado na unidade padrão de cada tipo: m, kg, C)
    const lengthFactors = { m: 1, km: 1000, cm: 0.01 };
    const weightFactors = { kg: 1, g: 0.001, t: 1000 };

    function populateUnits(type) {
        const fromUnitSelect = document.getElementById('from-unit');
        const toUnitSelect = document.getElementById('to-unit');
        if (!fromUnitSelect || !toUnitSelect) return;
        
        fromUnitSelect.innerHTML = ''; 
        toUnitSelect.innerHTML = '';
        
        unitOptions[type].forEach(opt => {
            const o1 = document.createElement('option'); o1.value = opt.value; o1.textContent = opt.label; fromUnitSelect.appendChild(o1);
            const o2 = document.createElement('option'); o2.value = opt.value; o2.textContent = opt.label; toUnitSelect.appendChild(o2);
        });
    }

    function convertUnits(type, amt, from, to) {
        if (from === to) return amt;
        
        if (type === 'length') {
            const inMeters = amt * lengthFactors[from];
            return inMeters / lengthFactors[to];
        }
        if (type === 'weight') {
            const inKg = amt * weightFactors[from];
            return inKg / weightFactors[to];
        }
        if (type === 'temperature') {
            let c = amt;
            // Converte tudo para Celsius primeiro
            if (from === 'F') c = (amt - 32) * 5/9;
            if (from === 'K') c = amt - 273.15;
            
            // De Celsius para destino
            if (to === 'F') return c * 9/5 + 32;
            if (to === 'K') return c + 273.15;
            return c;
        }
        return amt;
    }

    const mBtn = document.querySelector('.measure-content .btn-converter');
    const mType = document.getElementById('unit-type');
    const mInput = document.getElementById('amount-measure');
    const mRes = document.querySelector('.measure-content .result-box span');

    if (mType) {
        populateUnits(mType.value);
        mType.addEventListener('change', () => populateUnits(mType.value));
    }
    
    if (mBtn && mInput) {
        mBtn.addEventListener('click', () => {
            const val = parseFloat(mInput.value);
            const fromU = document.getElementById('from-unit').value;
            const toU = document.getElementById('to-unit').value;
            
            if(isNaN(val)) { 
                if(mRes) mRes.textContent = '---'; 
                return; 
            }
            
            const result = convertUnits(mType.value, val, fromU, toU);
            if(mRes) mRes.textContent = result.toFixed(2);
        });
    }

    // ==================================================
    // 5. IDIOMAS (PADRONIZADO)
    // ==================================================
    const languages = [
        { code: "pt", name: "Português", flag: "🇧🇷" },
        { code: "es", name: "Espanhol",  flag: "🇪🇸" },
        { code: "en", name: "Inglês",    flag: "🇺🇸" },
        { code: "fr", name: "Francês",   flag: "🇫🇷" },
        { code: "zh", name: "Mandarim",  flag: "🇨🇳" },
        { code: "ja", name: "Japonês",   flag: "🇯🇵" },
        { code: "ht", name: "Crioulo",   flag: "🇭🇹" },
        { code: "qu", name: "Quéchua",   flag: "🇧🇴" },
        { code: "ar", name: "Árabe",     flag: "🇸🇾" },
        { code: "ko", name: "Coreano",   flag: "🇰🇷" },
        { code: "gn", name: "Guarani",   flag: "🇵🇾" }
    ];
    
    function populateUtilsLanguageDropdown() {
        const dropdown = document.getElementById('language-select-utils');
        if (dropdown) {
            dropdown.innerHTML = '<option value="" disabled>Selecione um idioma...</option>';
            
            let currentLang = localStorage.getItem('rumo_lang') || 'pt';
            if(currentLang.includes('-')) currentLang = currentLang.split('-')[0];

            languages.forEach(lang => {
                const option = document.createElement('option');
                option.value = lang.code;
                option.textContent = `${lang.flag} ${lang.name}`;
                if (lang.code === currentLang) option.selected = true;
                dropdown.appendChild(option);
            });

            dropdown.addEventListener('change', () => {
                const selectedLang = dropdown.value;
                if (typeof window.setLanguage === 'function') {
                    window.setLanguage(selectedLang);
                } else {
                    localStorage.setItem('rumo_lang', selectedLang);
                    location.reload();
                }
            });
        }
    }
    populateUtilsLanguageDropdown();

    // ==================================================
    // 6. COFRE DE DOCUMENTOS (CRUD)
    // ==================================================
    const docForm = document.getElementById('add-doc-form');
    const docList = document.getElementById('doc-list');
    const savedDocs = JSON.parse(localStorage.getItem('userDocuments')) || [];

    const renderDocs = () => {
        if (!docList) return;
        docList.innerHTML = savedDocs.length === 0 ? '<p>Nenhum documento.</p>' : '';
        savedDocs.forEach((doc, index) => {
            const docElement = document.createElement('div');
            docElement.classList.add('doc-item');
            const expiryDate = new Date(doc.expiry);
            const today = new Date(); today.setHours(0, 0, 0, 0);
            
            let statusClass = 'ok', statusText = 'Válido';
            if (expiryDate < today) { statusClass = 'expired'; statusText = 'Expirado'; } 
            
            docElement.innerHTML = `
                <div class="doc-info">
                    <h4>${doc.type}</h4>
                    <p>Validade: ${expiryDate.toLocaleDateString()}</p>
                </div>
                <div class="doc-status ${statusClass}">${statusText}</div>
                <button class="btn-delete-doc" data-index="${index}"><i class="fas fa-trash-alt"></i></button>
            `;
            docList.appendChild(docElement);
        });
    };

    if (docForm) {
        docForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const type = document.getElementById('doc-type').value;
            const issue = document.getElementById('doc-issue-date').value;
            const expiry = document.getElementById('doc-expiry-date').value;

            savedDocs.push({ type, issue, expiry });
            localStorage.setItem('userDocuments', JSON.stringify(savedDocs));
            renderDocs();
            docForm.reset();
        });
    }

    if (docList) {
        docList.addEventListener('click', (e) => {
            const button = e.target.closest('.btn-delete-doc');
            if (button) {
                if (confirm('Deseja excluir este documento?')) {
                    savedDocs.splice(button.getAttribute('data-index'), 1);
                    localStorage.setItem('userDocuments', JSON.stringify(savedDocs));
                    renderDocs();
                }
            }
        });
    }
    renderDocs();
});