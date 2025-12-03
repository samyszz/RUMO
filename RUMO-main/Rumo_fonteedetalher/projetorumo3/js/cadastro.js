/* js/cadastro.js */

// --- Definição Simplificada dos Idiomas ---
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

// Agora é async para traduzir o "Selecione..."
async function populateLanguageDropdown(selectElement) {
    if (!selectElement) return;
    
    selectElement.innerHTML = '';
    
    // Tradução do placeholder
    let defaultText = 'Selecione o idioma...';
    if (window.i18n && typeof i18n.translateText === 'function') {
        defaultText = await i18n.translateText(defaultText);
    }

    // Opção padrão
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = defaultText;
    defaultOption.disabled = true;
    defaultOption.selected = true;
    selectElement.appendChild(defaultOption);

    // Loop simples (sem categorias/optgroup)
    languages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.code; // Valor simples: 'pt', 'en', etc.
        option.textContent = `${lang.flag} ${lang.name}`;
        selectElement.appendChild(option);
    });
    
    // Detecta mudança para tirar o disabled do placeholder
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

// Função auxiliar para traduzir texto se a API estiver disponível
async function t(text) {
    if (window.i18n && typeof i18n.translateText === 'function') {
        return await i18n.translateText(text);
    }
    return text;
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

    // --- Lógica da Barra de Senha (COM TRADUÇÃO) ---
    const atualizarBarraSenha = (input, bar, textEl) => {
        const handler = async () => {
            const senha = input.value;
            const forca = verificarForcaSenha(senha);
            
            // Se vazio, reseta
            if (senha.length === 0) {
                bar.style.width = '0%';
                bar.style.backgroundColor = 'transparent'; 
                textEl.textContent = '';
                return;
            }

            let msg = '';
            let color = '';
            let width = '';

            // Lógica de cores e textos
            if (forca < 3) {
                width = '30%';
                color = '#d32f2f'; // Vermelho
                msg = 'Muito Fraca (Adicione maiúsculas/números)';
            } else if (forca >= 3 && forca < 5) {
                width = '60%';
                color = '#f57c00'; // Laranja
                msg = 'Média';
            } else {
                width = '100%';
                color = '#2ecc71'; // Verde
                msg = 'Forte';
            }

            // Aplica estilos visuais (instantâneo)
            bar.style.width = width;
            bar.style.backgroundColor = color;
            textEl.style.color = color;

            // Aplica tradução no texto (assíncrono)
            const translatedMsg = await t(msg);
            textEl.textContent = translatedMsg;
        };
        input.addEventListener('input', handler);
        input.addEventListener('keyup', handler);
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
            if(e.target.value.length < 14) {
                cpfInput.classList.remove('invalid');
                toggleError('error-cpf', false);
            }
        });
        
        const validarCpfHandler = async () => {
            if (cpfInput.value.length === 14) {
                if (!validarCPF(cpfInput.value)) {
                    cpfInput.classList.add('invalid');
                    cpfInput.classList.remove('valid');
                    const msg = await t('CPF Inválido. Verifique os dígitos.');
                    toggleError('error-cpf', true, msg);
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
        input.addEventListener('blur', async () => {
            if(input.value && !validarEmail(input.value)) {
                input.classList.add('invalid');
                const msg = await t('Formato de e-mail inválido.');
                toggleError(errorId, true, msg);
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
        const check = async () => {
            if(conf.value && pass.value !== conf.value) {
                conf.classList.add('invalid');
                const msg = await t('As senhas não conferem.');
                toggleError(errorId, true, msg);
            } else {
                conf.classList.remove('invalid');
                toggleError(errorId, false);
            }
        };
        conf.addEventListener('input', check);
        pass.addEventListener('input', check);
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
                statusCnpj.textContent = await t('Verificando na Receita...');
                statusCnpj.classList.add('visible');
                
                const res = await consultarCNPJ(cnpjInput.value);
                
                if (res.erro) {
                    cnpjInput.classList.add('invalid');
                    cnpjInput.classList.remove('valid');
                    statusCnpj.textContent = ''; 
                    const msgErro = await t(res.msg);
                    toggleError('error-cnpj', true, msgErro); 
                } else {
                    cnpjInput.classList.remove('invalid');
                    cnpjInput.classList.add('valid');
                    toggleError('error-cnpj', false);
                    statusCnpj.style.color = '#2ecc71';
                    const validoTxt = await t('Válido');
                    statusCnpj.textContent = `${validoTxt}: ${res.dados.razao_social}`;
                    
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

    // --- SUBMIT PF (COM BLOQUEIO E TRADUÇÃO) ---
    if (formPF) {
        formPF.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btnSubmit = document.getElementById('btn-submit-pf');
            const originalBtnText = btnSubmit.innerText; // Guarda texto original (ex: Cadastrar)
            
            const cpfVal = document.getElementById('cpf-input').value;
            const passVal = document.getElementById('senha-pf').value;
            const confVal = document.getElementById('conf-senha-pf').value;
            const emailVal = document.getElementById('email-pf').value;
            const nomeVal = formPF.querySelector('input[name="nome"]').value;
            const idiomaVal = selectPF.value;

            // Verificações
            if (!validarCPF(cpfVal)) { 
                const msg = await t('CPF Inválido. Corrija antes de continuar.');
                toggleError('error-cpf', true, msg); 
                return; 
            }
            if (verificarForcaSenha(passVal) < 3) {
                const msg = await t('Sua senha é muito fraca. O cadastro foi bloqueado por segurança.');
                alert(msg);
                return;
            }
            if (passVal !== confVal) {
                const msg = await t('Senhas não conferem.');
                toggleError('error-conf-senha-pf', true, msg);
                return;
            }
            if (!idiomaVal) { 
                const msg = await t('Selecione um idioma.');
                alert(msg); 
                return; 
            }

            // Tudo certo, prossegue
            btnSubmit.innerText = await t('Criando conta...');
            btnSubmit.disabled = true;

            try {
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
                
                const msgSucesso = await t('Cadastro realizado com sucesso!');
                alert(msgSucesso);
                window.location.href = 'hub.html';
            } catch (error) {
                console.error(error);
                btnSubmit.innerText = originalBtnText;
                btnSubmit.disabled = false;
                await tratarErrosFirebase(error);
            }
        });
    }

    // --- SUBMIT PJ (COM BLOQUEIO E TRADUÇÃO) ---
    if (formPJ) {
        formPJ.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btnSubmit = document.getElementById('btn-submit-pj');
            const originalBtnText = btnSubmit.innerText;

            const cnpjVal = document.getElementById('cnpj-input').value;
            const passVal = document.getElementById('senha-pj').value;
            const confVal = document.getElementById('conf-senha-pj').value;
            const emailVal = document.getElementById('email-pj').value;
            const nomeVal = document.getElementById('nome-empresa').value;
            const idiomaVal = selectPJ.value;

            // Verifica senha
            if (verificarForcaSenha(passVal) < 3) {
                const msg = await t('Sua senha é muito fraca. Cadastro bloqueado.');
                alert(msg);
                return;
            }
            if (passVal !== confVal) {
                const msg = await t('Senhas não conferem.');
                toggleError('error-conf-senha-pj', true, msg);
                return;
            }

            // Verifica CNPJ
            btnSubmit.innerText = await t('Verificando CNPJ...');
            btnSubmit.disabled = true;
            
            const resCnpj = await consultarCNPJ(cnpjVal);
            if(resCnpj.erro) {
                const msg = await t('CNPJ inválido/inativo. Cadastro bloqueado.');
                toggleError('error-cnpj', true, msg);
                btnSubmit.innerText = originalBtnText;
                btnSubmit.disabled = false;
                return;
            }

            try {
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
                
                const msgSucesso = await t('Cadastro PJ realizado!');
                alert(msgSucesso);
                window.location.href = 'hub.html';
            } catch (error) {
                console.error(error);
                btnSubmit.innerText = originalBtnText;
                btnSubmit.disabled = false;
                await tratarErrosFirebase(error);
            }
        });
    }
});

function generateUsername(val) {
    if (!val) return 'user' + Math.floor(Math.random()*1000);
    return val.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random()*9000);
}

async function tratarErrosFirebase(error) {
    let msg = 'Erro: ' + error.message;
    
    // Mensagens comuns traduzidas na hora
    if (error.code === 'auth/email-already-in-use') {
        msg = 'E-mail já cadastrado.';
    } else if (error.code === 'auth/weak-password') {
        msg = 'Senha fraca (Firebase).';
    } else if (error.code === 'auth/invalid-email') {
        msg = 'E-mail inválido.';
    }

    if (window.i18n && typeof i18n.translateText === 'function') {
        msg = await i18n.translateText(msg);
    }
    alert(msg);
}