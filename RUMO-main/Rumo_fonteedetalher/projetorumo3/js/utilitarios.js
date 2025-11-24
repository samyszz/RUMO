document.addEventListener('DOMContentLoaded', function () {

    // ==================================================
    // 1. LÓGICA DO ACORDEÃO + MODAL DE AVISO
    // ==================================================
    const dropdownHeaders = document.querySelectorAll('.tool-header');
    
    // Referências aos elementos do Modal
    const modalOverlay = document.getElementById('docs-warning-modal');
    const modalBtn = document.getElementById('docs-modal-confirm-btn');
    const modalCheck = document.getElementById('docs-modal-check');
    
    let map; 
    let userMarker;
    let searchMarkers = [];
    let userCoords;

    // Função auxiliar para abrir uma aba
    function openDropdown(header) {
        const content = header.nextElementSibling;
        header.classList.add('active');
        
        // O cofre usa display:flex, os outros display:block
        content.style.display = header.classList.contains('docs-header') ? 'flex' : 'block';
        
        // Se for o header de localização e o mapa não existir, inicia
        if (header.classList.contains('location-header') && !map) {
            initMap();
        }
    }

    // Função auxiliar para fechar todas as outras abas
    function closeOthers(currentHeader) {
        dropdownHeaders.forEach(h => {
            if (h !== currentHeader) {
                h.classList.remove('active');
                h.nextElementSibling.style.display = 'none';
            }
        });
    }

    // Loop principal dos headers
    dropdownHeaders.forEach(header => {
        header.addEventListener('click', function (e) {
            e.preventDefault(); // Importante para controlar o fluxo
            
            const isActive = this.classList.contains('active');
            const isDocs = this.classList.contains('docs-header');

            // Se já estiver aberto, fecha (comportamento toggle)
            if (isActive) {
                this.classList.remove('active');
                this.nextElementSibling.style.display = 'none';
                return;
            }

            // Fecha as outras abas primeiro
            closeOthers(this);

            // --- LÓGICA ESPECÍFICA DO COFRE ---
            if (isDocs) {
                // Verifica se o usuário já optou por não ver o aviso
                const hideWarning = localStorage.getItem('hide_docs_warning');
                
                if (!hideWarning && modalOverlay) {
                    // Se não salvou preferência, MOSTRA O MODAL e para aqui
                    modalOverlay.style.display = 'flex';
                    return; 
                }
            }

            // Se não for o cofre OU se o usuário já dispensou o aviso, abre normal
            openDropdown(this);
        });
    });

    // Lógica do Botão "Entendi" dentro do Modal
    if (modalBtn) {
        modalBtn.addEventListener('click', () => {
            // Salva no LocalStorage se o checkbox estiver marcado
            if (modalCheck && modalCheck.checked) {
                localStorage.setItem('hide_docs_warning', 'true');
            }
            
            // Esconde o modal
            if (modalOverlay) modalOverlay.style.display = 'none';
            
            // Abre a aba de documentos programaticamente após o aceite
            const docsHeader = document.querySelector('.docs-header');
            if (docsHeader) openDropdown(docsHeader);
        });
    }
    
    // ==================================================
    // 2. MAPA (CÓDIGO ORIGINAL MANTIDO)
    // ==================================================
    function initMap() {
        const mapContainer = document.getElementById('map');
        if (!mapContainer) return;

        map = L.map('map').setView([0, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(onLocationSuccess, onLocationError);
        } else {
            document.getElementById('user-address').textContent = 'Geolocalização não suportada.';
        }
    }

    function onLocationSuccess(position) {
        userCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        map.setView([userCoords.lat, userCoords.lng], 15);
        userMarker = L.marker([userCoords.lat, userCoords.lng]).addTo(map)
            .bindPopup('<b>Você está aqui!</b>').openPopup();
        
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userCoords.lat}&lon=${userCoords.lng}&addressdetails=1`)
            .then(response => response.json())
            .then(data => {
                if (data && data.address) {
                    const addr = data.address;
                    const rua = addr.road || "";
                    const numero = addr.house_number || "";
                    const bairro = addr.suburb || "";
                    const cidade = addr.city || addr.town || "";
                    const parte1 = `${rua}${numero ? ', ' + numero : ''}`;
                    const enderecoFinal = [parte1, bairro, cidade].filter(Boolean).join(' - ');
                    document.getElementById('user-address').textContent = enderecoFinal || data.display_name;
                } else {
                    document.getElementById('user-address').textContent = data.display_name || 'Endereço não encontrado.';
                }
            }).catch(error => {
                console.error('Erro ao buscar endereço:', error);
                document.getElementById('user-address').textContent = 'Não foi possível obter o endereço.';
            });
    }

    function onLocationError(error) {
        alert(`Erro ao obter localização: ${error.message}`);
        const addrEl = document.getElementById('user-address');
        if(addrEl) addrEl.textContent = 'Não foi possível obter sua localização.';
    }
    
    const searchForm = document.getElementById('search-form-map');
    if(searchForm) {
        searchForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const query = document.getElementById('search-input-map').value;
            const resultsList = document.getElementById('search-results-list');
            
            if (!query || !userCoords) {
                alert('Digite um termo de busca e permita o acesso à localização.');
                return;
            }
            
            searchMarkers.forEach(marker => map.removeLayer(marker));
            searchMarkers = [];
            resultsList.innerHTML = '';
            
            // Mantendo seu código original do mapa (Nominatim simples)
            const viewbox = [userCoords.lng - 0.1, userCoords.lat + 0.1, userCoords.lng + 0.1, userCoords.lat - 0.1].join(',');
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&viewbox=${viewbox}&bounded=1&limit=10&addressdetails=1`;
            
            fetch(url).then(response => response.json()).then(data => {
                if (data.length === 0) {
                    alert('Nenhum resultado encontrado perto de você.');
                    resultsList.innerHTML = '<p style="padding: 10px;">Nenhum resultado encontrado.</p>';
                    return;
                }
                data.forEach(place => {
                    const marker = L.marker([place.lat, place.lon]).addTo(map).bindPopup(`<b>${place.display_name}</b>`);
                    searchMarkers.push(marker);
                    const listItem = document.createElement('div');
                    listItem.className = 'result-item';
                    const placeName = place.address.amenity || place.address.shop || place.address.tourism || place.display_name.split(',')[0];
                    listItem.innerHTML = `<h5>${placeName}</h5><p>${place.display_name}</p>`;
                    listItem.addEventListener('click', () => {
                        map.setView([place.lat, place.lon], 17);
                        marker.openPopup();
                    });
                    resultsList.appendChild(listItem);
                });
                const group = new L.featureGroup(searchMarkers.concat(userMarker));
                map.fitBounds(group.getBounds().pad(0.5));
            }).catch(error => {
                console.error('Erro na busca de locais:', error);
                alert('Ocorreu um erro ao buscar os locais.');
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
    const updateInfoSpan = document.getElementById('currency-update-info');

    async function fetchRates(base) {
        try {
            if (base === "EUR") {
                const res = await fetch("https://api.frankfurter.app/latest?from=EUR&to=USD,BRL");
                const data = await res.json();
                localStorage.setItem(`currencyRates_${base}`, JSON.stringify({ USD: data.rates.USD, BRL: data.rates.BRL, EUR: 1 }));
                localStorage.setItem(`currencyUpdatedAt_${base}`, data.date || new Date().toISOString());
                return { USD: data.rates.USD, BRL: data.rates.BRL, EUR: 1 };
            } else if (base === "USD") {
                const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=EUR");
                const data = await res.json();
                const usdToEur = data.rates.EUR;
                const res2 = await fetch("https://api.frankfurter.app/latest?from=EUR&to=BRL");
                const data2 = await res2.json();
                const eurToBrl = data2.rates.BRL;
                localStorage.setItem(`currencyRates_${base}`, JSON.stringify({ EUR: usdToEur, BRL: usdToEur * eurToBrl, USD: 1 }));
                localStorage.setItem(`currencyUpdatedAt_${base}`, data2.date || new Date().toISOString());
                return { EUR: usdToEur, BRL: usdToEur * eurToBrl, USD: 1 };
            } else if (base === "BRL") {
                const res = await fetch("https://api.frankfurter.app/latest?from=BRL&to=EUR");
                const data = await res.json();
                const brlToEur = data.rates.EUR;
                const res2 = await fetch("https://api.frankfurter.app/latest?from=EUR&to=USD");
                const data2 = await res2.json();
                const eurToUsd = data2.rates.USD;
                localStorage.setItem(`currencyRates_${base}`, JSON.stringify({ EUR: brlToEur, USD: brlToEur * eurToUsd, BRL: 1 }));
                localStorage.setItem(`currencyUpdatedAt_${base}`, data2.date || new Date().toISOString());
                return { EUR: brlToEur, USD: brlToEur * eurToUsd, BRL: 1 };
            }
        } catch (err) { return null; }
    }

    function getRates(base) {
        const saved = localStorage.getItem(`currencyRates_${base}`);
        if (!saved || saved === "undefined") return null;
        try { return JSON.parse(saved); } catch (e) { return null; }
    }

    function showCurrencyUpdateInfo(base) {
        const dt = localStorage.getItem(`currencyUpdatedAt_${base}`);
        if (updateInfoSpan) {
            if (dt) {
                let raw = dt.split('T')[0];
                let parts = raw.split('-');
                let fmt = (parts.length === 3) ? `${parts[2]}/${parts[1]}/${parts[0]}` : new Date(dt).toLocaleDateString();
                updateInfoSpan.textContent = `Valores atualizados no dia ${fmt}`;
            } else {
                updateInfoSpan.textContent = "Valores padrão: nunca atualizados";
            }
        }
    }

    async function refreshRatesIfOnline(base) {
        if (navigator.onLine) await fetchRates(base);
        showCurrencyUpdateInfo(base);
    }

    if (fromCurrency) {
        refreshRatesIfOnline(fromCurrency.value);
        fromCurrency.addEventListener('change', () => refreshRatesIfOnline(fromCurrency.value));
    }

    if (convertButton) {
        convertButton.addEventListener('click', function () {
            const amount = parseFloat(amountCurrency.value);
            const from = fromCurrency.value;
            const to = toCurrency.value;
            const rates = getRates(from);
            if (!rates || !(to in rates) || isNaN(amount) || amount <= 0) {
                resultCurrencyBox.textContent = `${to} 0.00`;
                return;
            }
            const rate = rates[to];
            resultCurrencyBox.textContent = `${to} ${(amount * rate).toFixed(2)}`;
            showCurrencyUpdateInfo(from);
        });
    }

    const currencyForm = document.querySelector('.currency-content .converter-form');
    if (currencyForm) currencyForm.addEventListener('submit', e => e.preventDefault());

    // ==================================================
    // 4. CONVERSOR DE MEDIDAS
    // ==================================================
    const unitOptions = {
        length: [ { label: 'Metro (m)', value: 'm' }, { label: 'Quilômetro (km)', value: 'km' }, { label: 'Centímetro (cm)', value: 'cm' }, { label: 'Milímetro (mm)', value: 'mm' } ],
        weight: [ { label: 'Quilograma (kg)', value: 'kg' }, { label: 'Grama (g)', value: 'g' }, { label: 'Miligrama (mg)', value: 'mg' }, { label: 'Tonelada (t)', value: 't' } ],
        temperature: [ { label: 'Celsius (°C)', value: 'C' }, { label: 'Fahrenheit (°F)', value: 'F' }, { label: 'Kelvin (K)', value: 'K' } ]
    };
    const lengthFactors = { m: 1, km: 1000, cm: 0.01, mm: 0.001 };
    const weightFactors = { kg: 1, g: 0.001, mg: 0.000001, t: 1000 };

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
        if (type === 'length') return (amt * lengthFactors[from]) / lengthFactors[to];
        if (type === 'weight') return (amt * weightFactors[from]) / weightFactors[to];
        if (type === 'temperature') {
            let c;
            if (from === 'C') c = amt; else if (from === 'F') c = (amt - 32) * 5/9; else if (from === 'K') c = amt - 273.15;
            return (to === 'F') ? c * 9/5 + 32 : (to === 'K') ? c + 273.15 : c;
        }
        return 0;
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
        mInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); mBtn.click(); } });
        mBtn.addEventListener('click', () => {
            const val = parseFloat(mInput.value);
            if(isNaN(val)) { if(mRes) mRes.textContent = '0'; return; }
            const res = convertUnits(mType.value, val, document.getElementById('from-unit').value, document.getElementById('to-unit').value);
            if(mRes) mRes.textContent = res ? res.toFixed(2) : 'Inválido';
        });
    }

    // ==================================================
    // 5. IDIOMAS
    // ==================================================
    const languages = { "Espanhol": ["Venezuela", "Bolívia", "Paraguai", "Peru", "Argentina", "Colômbia", "Chile"], "Crioulo Haitiano": ["Haiti"], "Francês": ["Haiti", "República Democrática do Congo", "Senegal", "África Ocidental"], "Inglês": ["Nigéria", "Gana", "África do Sul"], "Árabe": ["Síria", "Líbano", "Palestina"], "Mandarim (Chinês)": ["China"], "Coreano": ["Coreia do Sul"], "Japonês": ["Japão"], "Guarani": ["Paraguai", "Bolívia"], "Quéchua": ["Bolívia", "Peru"], "Português": ["Angola", "Moçambique", "Cabo Verde", "Portugal", "Guiné-Bissau", "Timor-Leste"] };
    
    function populateLanguageDropdown() {
        const dropdown = document.getElementById('language-select-utils');
        if (dropdown) {
            dropdown.innerHTML = '<option value="pt-br" selected>Português - Brasil</option>';
            for (const lang in languages) {
                const optgroup = document.createElement('optgroup'); optgroup.label = lang;
                languages[lang].forEach(country => {
                    const option = document.createElement('option');
                    option.value = `${lang.toLowerCase().replace(/\s/g, '_')}-${country.toLowerCase()}`;
                    option.textContent = `${lang} - ${country}`;
                    optgroup.appendChild(option);
                });
                dropdown.appendChild(optgroup);
            }
        }
    }
    populateLanguageDropdown();

    // ==================================================
    // 6. COFRE DE DOCUMENTOS (CRUD)
    // ==================================================
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
            const today = new Date(); today.setHours(0, 0, 0, 0);
            let statusClass = 'ok', statusText = 'Válido';
            const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            if (expiryDate < today) { statusClass = 'expired'; statusText = 'Expirado'; } 
            else if (diffDays <= 30) { statusClass = 'warning'; statusText = 'Expira em breve'; }
            
            docElement.innerHTML = `<div class="doc-info"><h4>${doc.type}</h4><p>Validade: ${expiryDate.toLocaleDateString()}</p></div><div class="doc-status ${statusClass}">${statusText}</div><button class="btn-delete-doc" data-index="${index}" title="Excluir documento"><i class="fas fa-trash-alt"></i></button>`;
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