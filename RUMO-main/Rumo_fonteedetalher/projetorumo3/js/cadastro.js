// --- Definição dos idiomas (Padronizado com Header e Utils) ---
const languages = {
    "Português": [
        { name: "Brasil", flag: "\uD83C\uDDE7\uD83C\uDDF7" },       // 🇧🇷
        { name: "Portugal", flag: "\uD83C\uDDF5\uD83C\uDDF9" },     // 🇵🇹
        { name: "Angola", flag: "\uD83C\uDDE6\uD83C\uDDF4" },       // 🇦🇴
        { name: "Moçambique", flag: "\uD83C\uDDF2\uD83C\uDDFF" },   // 🇲🇿
        { name: "Cabo Verde", flag: "\uD83C\uDDE8\uD83C\uDDFB" },   // 🇨🇻
        { name: "Guiné-Bissau", flag: "\uD83C\uDDEC\uD83C\uDDFC" }, // 🇬🇼
        { name: "Timor-Leste", flag: "\uD83C\uDDF9\uD83C\uDDF1" }   // 🇹🇱
    ],
    "Espanhol": [
        { name: "Espanha", flag: "\uD83C\uDDEA\uD83C\uDDF8" },      // 🇪🇸
        { name: "Venezuela", flag: "\uD83C\uDDFB\uD83C\uDDEA" },    // 🇻🇪
        { name: "Bolívia", flag: "\uD83C\uDDE7\uD83C\uDDF4" },      // 🇧🇴
        { name: "Paraguai", flag: "\uD83C\uDDF5\uD83C\uDDFE" },     // 🇵🇾
        { name: "Peru", flag: "\uD83C\uDDF5\uD83C\uDDEA" },         // 🇵🇪
        { name: "Argentina", flag: "\uD83C\uDDE6\uD83C\uDDF7" },    // 🇦🇷
        { name: "Colômbia", flag: "\uD83C\uDDE8\uD83C\uDDF4" },     // 🇨🇴
        { name: "Chile", flag: "\uD83C\uDDE8\uD83C\uDDF1" }         // 🇨🇱
    ],
    "Inglês": [
        { name: "Estados Unidos", flag: "\uD83C\uDDFA\uD83C\uDDF8" }, // 🇺🇸
        { name: "Reino Unido", flag: "\uD83C\uDDEC\uD83C\uDDE7" },    // 🇬🇧
        { name: "Nigéria", flag: "\uD83C\uDDF3\uD83C\uDDEC" },        // 🇳🇬
        { name: "Gana", flag: "\uD83C\uDDEC\uD83C\uDDED" },           // 🇬🇭
        { name: "África do Sul", flag: "\uD83C\uDDFF\uD83C\uDDE6" }   // 🇿🇦
    ],
    "Francês": [
        { name: "França", flag: "\uD83C\uDDEB\uD83C\uDDF7" },         // 🇫🇷
        { name: "Haiti", flag: "\uD83C\uDDED\uD83C\uDDF9" },          // 🇭🇹
        { name: "RDC", flag: "\uD83C\uDDE8\uD83C\uDDE9" },            // 🇨🇩
        { name: "Senegal", flag: "\uD83C\uDDF8\uD83C\uDDF3" },        // 🇸🇳
        { name: "África Ocidental", flag: "\uD83C\uDF0D" }            // 🌍
    ],
    "Crioulo Haitiano": [
        { name: "Haiti", flag: "\uD83C\uDDED\uD83C\uDDF9" }          // 🇭🇹
    ],
    "Árabe": [
        { name: "Síria", flag: "\uD83C\uDDF8\uD83C\uDDFE" },          // 🇸🇾
        { name: "Líbano", flag: "\uD83C\uDDF1\uD83C\uDDE7" },         // 🇱🇧
        { name: "Palestina", flag: "\uD83C\uDDF5\uD83C\uDDF8" }       // 🇵🇸
    ],
    "Mandarim (Chinês)": [
        { name: "China", flag: "\uD83C\uDDE8\uD83C\uDDF3" }           // 🇨🇳
    ],
    "Coreano": [
        { name: "Coreia do Sul", flag: "\uD83C\uDDF0\uD83C\uDDF7" }   // 🇰🇷
    ],
    "Japonês": [
        { name: "Japão", flag: "\uD83C\uDDEF\uD83C\uDDF5" }           // 🇯🇵
    ],
    "Guarani": [
        { name: "Paraguai", flag: "\uD83C\uDDF5\uD83C\uDDFE" },       // 🇵🇾
        { name: "Bolívia", flag: "\uD83C\uDDE7\uD83C\uDDF4" }         // 🇧🇴
    ],
    "Quéchua": [
        { name: "Bolívia", flag: "\uD83C\uDDE7\uD83C\uDDF4" },        // 🇧🇴
        { name: "Peru", flag: "\uD83C\uDDF5\uD83C\uDDEA" }            // 🇵🇪
    ]
};

const langCodeMap = {
    "Português": "pt", "Espanhol": "es", "Inglês": "en", "Francês": "fr",
    "Crioulo Haitiano": "ht", "Árabe": "ar", "Mandarim (Chinês)": "zh",
    "Coreano": "ko", "Japonês": "ja", "Guarani": "gn", "Quéchua": "qu"
};

function populateLanguageDropdown(selectElement) {
    if (!selectElement) return;
    
    // Reseta e adiciona opção padrão
    selectElement.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Selecione o idioma...';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    selectElement.appendChild(defaultOption);

    // Itera sobre as chaves do objeto (Idioma)
    for (const languageName in languages) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = languageName;
        
        const langCodeBase = langCodeMap[languageName] || 'pt';

        // Itera sobre os países dentro daquele idioma
        languages[languageName].forEach(region => {
            const option = document.createElement('option');
            
            // Gera valor ex: pt-brasil
            const regionSlug = region.name.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            option.value = `${langCodeBase}-${regionSlug}`;
            
            // Exibe Bandeira + Nome
            option.textContent = `${region.flag} ${region.name}`;
            
            optgroup.appendChild(option);
        });
        selectElement.appendChild(optgroup);
    }
    
    // Tenta detectar idioma do navegador
    selectElement.addEventListener('change', () => {
         if (selectElement.value !== '') defaultOption.disabled = true;
    });
}

// --- FUNÇÕES DE VALIDAÇÃO (MATEMÁTICAS E REGEX) ---

function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf == '') return false;
    // Elimina CPFs com todos os digitos iguais e valida tamanho
    if (cpf.length != 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    
    let add = 0;
    for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev == 10 || rev == 11) rev = 0;
    if (rev != parseInt(cpf.charAt(9))) return false;
    
    add = 0;
    for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev == 10 || rev == 11) rev = 0;
    if (rev != parseInt(cpf.charAt(10))) return false;
    return true;
}

function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function verificarForcaSenha(senha) {
    let forca = 0;
    if (senha.length >= 6) forca += 1; // Mínimo aceitável
    if (senha.length >= 10) forca += 1; // Bom tamanho
    if (senha.match(/[a-z]/)) forca += 1; // Minúscula
    if (senha.match(/[A-Z]/)) forca += 1; // Maiúscula
    if (senha.match(/[0-9]/)) forca += 1; // Número
    if (senha.match(/[^a-zA-Z0-9]/)) forca += 1; // Símbolo

    return forca; // Retorna pontuação de 0 a 6
}

async function consultarCNPJ(cnpj) {
    const limpo = cnpj.replace(/[^\d]+/g, '');
    if (limpo.length !== 14) return { erro: true, msg: 'CNPJ incompleto' };

    try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${limpo}`);
        if (!response.ok) throw new Error('Não encontrado');
        const dados = await response.json();
        
        // Verifica status na receita
        if (dados.descricao_situacao_cadastral !== "ATIVA") {
             return { erro: true, msg: `CNPJ ${dados.descricao_situacao_cadastral}` };
        }
        return { erro: false, dados: dados };
    } catch (error) {
        return { erro: true, msg: 'CNPJ inválido ou inexistente' };
    }
}

// Máscaras de digitação
function mascaraCPF(valor) {
    return valor.replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
}

function mascaraCNPJ(valor) {
    return valor.replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
}

// Função auxiliar para mostrar/esconder erros
function toggleError(elementId, show, message = '') {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (show) {
        el.textContent = message;
        el.classList.add('visible');
    } else {
        el.classList.remove('visible');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const registerContainer = document.querySelector('.register-container');
    if (!registerContainer) return;

    // Elementos de UI
    const tabs = registerContainer.querySelectorAll('.tab-button');
    const contents = registerContainer.querySelectorAll('.tab-content');
    const formPF = document.getElementById('pf');
    const formPJ = document.getElementById('pj');
    const selectPF = document.getElementById('language-select-pf');
    const selectPJ = document.getElementById('language-select-pj');

    // Popula idiomas
    populateLanguageDropdown(selectPF);
    populateLanguageDropdown(selectPJ);

    // --- Lógica da Barra de Senha ---
    // Esta função atualiza a cor e o texto em tempo real
    const atualizarBarraSenha = (input, bar, text) => {
        const handler = () => {
            const senha = input.value;
            const forca = verificarForcaSenha(senha);
            
            // Se vazio, reseta
            if (senha.length === 0) {
                bar.style.width = '0%';
                bar.style.backgroundColor = 'transparent'; 
                text.textContent = '';
                return;
            }

            // Lógica de cores: Vermelho (Fraca/Bloqueante), Laranja (Média), Verde (Forte)
            if (forca < 3) {
                bar.style.width = '30%';
                bar.style.backgroundColor = '#d32f2f'; // Vermelho
                text.textContent = 'Muito Fraca (Adicione maiúsculas/números)';
                text.style.color = '#d32f2f';
            } else if (forca >= 3 && forca < 5) {
                bar.style.width = '60%';
                bar.style.backgroundColor = '#f57c00'; // Laranja
                text.textContent = 'Média';
                text.style.color = '#f57c00';
            } else {
                bar.style.width = '100%';
                bar.style.backgroundColor = '#2ecc71'; // Verde
                text.textContent = 'Forte';
                text.style.color = '#2ecc71';
            }
        };
        input.addEventListener('input', handler);
        input.addEventListener('keyup', handler); // Garante update rápido
    };

    // Aplica aos campos de senha
    const senhaPf = document.getElementById('senha-pf');
    const senhaPj = document.getElementById('senha-pj');
    if(senhaPf) atualizarBarraSenha(senhaPf, document.getElementById('bar-pf'), document.getElementById('text-pf'));
    if(senhaPj) atualizarBarraSenha(senhaPj, document.getElementById('bar-pj'), document.getElementById('text-pj'));

    // --- Validação em Tempo Real: CPF ---
    const cpfInput = document.getElementById('cpf-input');
    if (cpfInput) {
        cpfInput.addEventListener('input', (e) => {
            e.target.value = mascaraCPF(e.target.value);
            // Remove erro enquanto digita se o formato ainda for incompleto
            if(e.target.value.length < 14) {
                cpfInput.classList.remove('invalid');
                toggleError('error-cpf', false);
            }
        });
        
        // Valida pra valer no BLUR (quando sai do campo) ou se completou 14 chars
        const validarCpfHandler = () => {
            if (cpfInput.value.length === 14) {
                if (!validarCPF(cpfInput.value)) {
                    cpfInput.classList.add('invalid');
                    cpfInput.classList.remove('valid');
                    toggleError('error-cpf', true, 'CPF Inválido. Verifique os dígitos.');
                } else {
                    cpfInput.classList.remove('invalid');
                    cpfInput.classList.add('valid');
                    toggleError('error-cpf', false);
                }
            }
        };
        cpfInput.addEventListener('blur', validarCpfHandler);
    }

    // --- Validação em Tempo Real: Email ---
    const validarEmailVisual = (input, errorId) => {
        input.addEventListener('blur', () => {
            if(input.value && !validarEmail(input.value)) {
                input.classList.add('invalid');
                toggleError(errorId, true, 'Formato de e-mail inválido.');
            } else {
                input.classList.remove('invalid');
                toggleError(errorId, false);
            }
        });
    };
    validarEmailVisual(document.getElementById('email-pf'), 'error-email-pf');
    validarEmailVisual(document.getElementById('email-pj'), 'error-email-pj');

    // --- Validação em Tempo Real: Confirmação de Senha ---
    const validarConfSenha = (passId, confId, errorId) => {
        const pass = document.getElementById(passId);
        const conf = document.getElementById(confId);
        const check = () => {
            if(conf.value && pass.value !== conf.value) {
                conf.classList.add('invalid');
                toggleError(errorId, true, 'As senhas não conferem.');
            } else {
                conf.classList.remove('invalid');
                toggleError(errorId, false);
            }
        };
        conf.addEventListener('input', check);
        pass.addEventListener('input', check); // Checa se mudar a senha original também
    };
    validarConfSenha('senha-pf', 'conf-senha-pf', 'error-conf-senha-pf');
    validarConfSenha('senha-pj', 'conf-senha-pj', 'error-conf-senha-pj');


    // --- Validação em Tempo Real: CNPJ ---
    const cnpjInput = document.getElementById('cnpj-input');
    const statusCnpj = document.getElementById('status-cnpj');
    if (cnpjInput) {
        cnpjInput.addEventListener('input', (e) => {
            e.target.value = mascaraCNPJ(e.target.value);
            if(e.target.value.length < 18) {
                cnpjInput.classList.remove('invalid');
                toggleError('error-cnpj', false);
                statusCnpj.textContent = '';
                statusCnpj.classList.remove('visible');
            }
        });

        cnpjInput.addEventListener('blur', async () => {
            if (cnpjInput.value.length === 18) {
                statusCnpj.textContent = 'Verificando na Receita...';
                statusCnpj.classList.add('visible');
                
                const res = await consultarCNPJ(cnpjInput.value);
                
                if (res.erro) {
                    cnpjInput.classList.add('invalid');
                    cnpjInput.classList.remove('valid');
                    statusCnpj.textContent = ''; 
                    toggleError('error-cnpj', true, res.msg); // Mostra o erro vermelho
                } else {
                    cnpjInput.classList.remove('invalid');
                    cnpjInput.classList.add('valid');
                    toggleError('error-cnpj', false);
                    statusCnpj.style.color = '#2ecc71';
                    statusCnpj.textContent = `Válido: ${res.dados.razao_social}`;
                    // Preenche nome
                    const nomeEmpresa = document.getElementById('nome-empresa');
                    if(nomeEmpresa && !nomeEmpresa.value) {
                        nomeEmpresa.value = res.dados.nome_fantasia || res.dados.razao_social;
                    }
                }
            }
        });
    }


    // --- Sistema de Abas ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(item => item.classList.remove('active'));
            contents.forEach(item => item.classList.remove('active'));
            tab.classList.add('active');
            const contentId = tab.getAttribute('data-tab');
            document.getElementById(contentId).classList.add('active');
            
            // Esconde social se for PJ (Controla visibilidade, a lógica está no login.js)
            const social = document.querySelector('.social-container');
            const socialTxt = document.querySelector('.social-text');
            if(contentId === 'pj') {
                if(social) social.style.display = 'none';
                if(socialTxt) socialTxt.style.display = 'none';
            } else {
                if(social) social.style.display = 'flex';
                if(socialTxt) socialTxt.style.display = 'block';
            }
        });
    });

    // --- SUBMIT PF (COM BLOQUEIO SE HOUVER ERRO) ---
    if (formPF) {
        formPF.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btnSubmit = document.getElementById('btn-submit-pf');
            const cpfVal = document.getElementById('cpf-input').value;
            const passVal = document.getElementById('senha-pf').value;
            const confVal = document.getElementById('conf-senha-pf').value;
            const emailVal = document.getElementById('email-pf').value;
            const nomeVal = formPF.querySelector('input[name="nome"]').value;
            const idiomaVal = selectPF.value;

            // Verificação Final antes de enviar
            if (!validarCPF(cpfVal)) { 
                toggleError('error-cpf', true, 'CPF Inválido. Corrija antes de continuar.'); 
                return; 
            }
            if (verificarForcaSenha(passVal) < 3) {
                alert('Sua senha é muito fraca. O cadastro foi bloqueado por segurança.');
                return;
            }
            if (passVal !== confVal) {
                toggleError('error-conf-senha-pf', true, 'Senhas não conferem.');
                return;
            }
            if (!idiomaVal) { alert('Selecione um idioma.'); return; }

            // Tudo certo, prossegue
            btnSubmit.innerText = 'Criando conta...';
            btnSubmit.disabled = true;

            try {
                // Criação manual (E-mail/Senha)
                const userCredential = await auth.createUserWithEmailAndPassword(emailVal, passVal);
                await db.collection('users').doc(userCredential.user.uid).set({
                    nome: nomeVal,
                    nomeCompleto: nomeVal,
                    cpf: cpfVal.replace(/[^\d]+/g, ''),
                    email: emailVal,
                    idioma: idiomaVal,
                    userType: 'pf',
                    username: generateUsername(nomeVal || emailVal),
                    profilePicture: 'assets/imagens/avatar-padrao.png',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert('Cadastro realizado com sucesso!');
                window.location.href = 'hub.html';
            } catch (error) {
                console.error(error);
                btnSubmit.innerText = 'Cadastrar';
                btnSubmit.disabled = false;
                tratarErrosFirebase(error);
            }
        });
    }

    // --- SUBMIT PJ ---
    if (formPJ) {
        formPJ.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btnSubmit = document.getElementById('btn-submit-pj');
            const cnpjVal = document.getElementById('cnpj-input').value;
            const passVal = document.getElementById('senha-pj').value;
            const confVal = document.getElementById('conf-senha-pj').value;
            const emailVal = document.getElementById('email-pj').value;
            const nomeVal = document.getElementById('nome-empresa').value;
            const idiomaVal = selectPJ.value;

            // Verifica senha
            if (verificarForcaSenha(passVal) < 3) {
                alert('Sua senha é muito fraca. Cadastro bloqueado.');
                return;
            }
            if (passVal !== confVal) {
                toggleError('error-conf-senha-pj', true, 'Senhas não conferem.');
                return;
            }

            // Verifica CNPJ novamente (bloqueante)
            btnSubmit.innerText = 'Verificando CNPJ...';
            btnSubmit.disabled = true;
            
            const resCnpj = await consultarCNPJ(cnpjVal);
            if(resCnpj.erro) {
                toggleError('error-cnpj', true, 'CNPJ inválido/inativo. Cadastro bloqueado.');
                btnSubmit.innerText = 'Cadastrar';
                btnSubmit.disabled = false;
                return;
            }

            try {
                // Criação manual PJ
                const userCredential = await auth.createUserWithEmailAndPassword(emailVal, passVal);
                await db.collection('users').doc(userCredential.user.uid).set({
                    nome: nomeVal,
                    nomeCompleto: nomeVal,
                    cnpj: cnpjVal.replace(/[^\d]+/g, ''),
                    razaoSocial: resCnpj.dados.razao_social,
                    email: emailVal,
                    idioma: idiomaVal,
                    userType: 'pj',
                    username: generateUsername(nomeVal || emailVal),
                    profilePicture: 'assets/imagens/avatar-padrao.png',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert('Cadastro PJ realizado!');
                window.location.href = 'hub.html';
            } catch (error) {
                console.error(error);
                btnSubmit.innerText = 'Cadastrar';
                btnSubmit.disabled = false;
                tratarErrosFirebase(error);
            }
        });
    }
});

function generateUsername(val) {
    if (!val) return 'user' + Math.floor(Math.random()*1000);
    return val.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random()*9000);
}

function tratarErrosFirebase(error) {
    if (error.code === 'auth/email-already-in-use') alert('E-mail já cadastrado.');
    else if (error.code === 'auth/weak-password') alert('Senha fraca (Firebase).');
    else alert('Erro: ' + error.message);
}