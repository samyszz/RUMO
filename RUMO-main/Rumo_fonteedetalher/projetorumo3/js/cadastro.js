// --- NOVO: Definição dos idiomas ---
// (Você pode adicionar ou remover idiomas desta lista)
const languages = [
    { code: 'pt-BR', name: 'Português (Brasil)' },
    { code: 'en', name: 'English (Inglês)' },
    { code: 'es', name: 'Español (Espanhol)' },
    { code: 'fr', name: 'Français (Francês)' },
    { code: 'ht', name: 'Kreyòl ayisyen (Crioulo Haitiano)' },
    { code: 'ar', name: 'العربية (Árabe)' },
    { code: 'zh', name: '中文 (Mandarim)' },
    { code: 'ko', name: '한국어 (Coreano)' },
    { code: 'ja', name: '日本語 (Japonês)' },
    { code: 'gn', name: 'Avañe\'ẽ (Guarani)' },
    { code: 'qu', name: 'Runa Simi (Quechua)' }
];

/**
 * --- NOVO: Função para popular o dropdown de idiomas ---
 * @param {HTMLSelectElement} selectElement O elemento <select> a ser preenchido
 */
function populateLanguageDropdown(selectElement) {
    if (!selectElement) return;

    // Adiciona uma opção padrão "Selecione"
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Selecione o idioma...';
    defaultOption.disabled = true; // Impede que seja selecionada após uma escolha
    defaultOption.selected = true; // Vem selecionada por padrão
    selectElement.appendChild(defaultOption);

    // Adiciona os idiomas da lista
    languages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.code;
        option.textContent = lang.name;
        selectElement.appendChild(option);
    });
    
    // Tenta selecionar o idioma padrão do navegador se disponível
    const browserLang = navigator.language || navigator.userLanguage;
    if (languages.some(l => l.code === browserLang)) {
        selectElement.value = browserLang;
    } else {
        // Se não, seleciona pt-BR como fallback se existir
        if (languages.some(l => l.code === 'pt-BR')) {
            selectElement.value = 'pt-BR';
        }
    }
    
    // Remove o 'disabled' da opção padrão se nada for selecionado
    // (Isso força o 'required' do HTML a funcionar)
    if (selectElement.value === '') {
        defaultOption.disabled = false;
    }
    selectElement.addEventListener('change', () => {
         if (selectElement.value !== '') {
             defaultOption.disabled = true;
         }
    });
}


document.addEventListener('DOMContentLoaded', function() {
    const registerContainer = document.querySelector('.register-container');
    if (!registerContainer) return; // Sai se não estiver no painel de cadastro

    const tabs = registerContainer.querySelectorAll('.tab-button');
    const contents = registerContainer.querySelectorAll('.tab-content');
    const formPF = document.getElementById('pf');
    const formPJ = document.getElementById('pj');

    // --- NOVO: Seletores dos botões sociais ---
    const socialContainer = registerContainer.querySelector('.social-container');
    const socialText = registerContainer.querySelector('.social-text');

    // --- NOVO: Popula os dropdowns de idioma ---
    const selectPF = document.getElementById('language-select-pf');
    const selectPJ = document.getElementById('language-select-pj');
    populateLanguageDropdown(selectPF);
    populateLanguageDropdown(selectPJ);
    // --- FIM DA ATUALIZAÇÃO DO IDIOMA ---


    // --- 1. Lógica para alternar as abas PF e PJ ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(item => item.classList.remove('active'));
            contents.forEach(item => item.classList.remove('active'));
            tab.classList.add('active');
            const contentId = tab.getAttribute('data-tab');
            document.getElementById(contentId).classList.add('active');

            // --- REGRA DE NEGÓCIO: Esconde social para PJ ---
            if (contentId === 'pj') {
                if (socialContainer) socialContainer.style.display = 'none';
                if (socialText) socialText.style.display = 'none';
            } else {
                if (socialContainer) socialContainer.style.display = 'flex'; // 'flex' ou 'block'
                if (socialText) socialText.style.display = 'block';
            }
        });
    });

    // --- 2. CADASTRO DE PESSOA FÍSICA (PF) ---
    if (formPF) {
        formPF.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const nome = formPF.querySelector('input[name="nome"]').value;
            const email = formPF.querySelector('input[name="email"]').value;
            const idioma = selectPF.value; // Pega o valor do select
            const senha = formPF.querySelector('input[name="senha"]').value;
            const confirmarSenha = formPF.querySelector('input[name="confirmar_senha"]').value; // Pega a confirmação

            // --- CORREÇÃO: Validação de Senha ---
            if (senha !== confirmarSenha) {
                alert('As senhas não coincidem. Por favor, tente novamente.');
                return; // Para a execução
            }
            if (!idioma) {
                alert('Por favor, selecione um idioma.');
                return;
            }
            // --- FIM DA CORREÇÃO ---

            // (Lógica de cadastro PF por e-mail)
            auth.createUserWithEmailAndPassword(email, senha)
                .then((userCredential) => {
                    const user = userCredential.user;
                    return db.collection('users').doc(user.uid).set({
                        nome: nome,
                        nomeCompleto: nome,
                        email: email,
                        idioma: idioma, // Salva o idioma
                        userType: 'pf', // Define como PF
                        username: generateUsername(nome || email),
                        profilePicture: 'assets/imagens/avatar-padrao.png',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                })
                .then(() => {
                    alert('Cadastro de Pessoa Física realizado com sucesso!');
                    window.location.href = 'hub.html';
                })
                .catch((error) => {
                    console.error("Erro no cadastro PF:", error);
                    // Traduz mensagens comuns de erro do Firebase
                    if (error.code === 'auth/email-already-in-use') {
                        alert('Erro: Este e-mail já está em uso.');
                    } else if (error.code === 'auth/weak-password') {
                        alert('Erro: A senha é muito fraca. Tente uma senha com pelo menos 6 caracteres.');
                    } else {
                        alert('Erro ao cadastrar: ' + error.message);
                    }
                });
        });
    }

    // --- 3. CADASTRO DE PESSOA JURÍDICA (PJ) ---
    if (formPJ) {
        formPJ.addEventListener('submit', (e) => {
            e.preventDefault();

            const nomeEmpresa = formPJ.querySelector('input[name="nome_empresa"]').value;
            const cnpj = formPJ.querySelector('input[name="cnpj"]').value; // Pega o CNPJ
            const email = formPJ.querySelector('input[name="email_comercial"]').value;
            const idioma = selectPJ.value; // Pega o valor do select
            const senha = formPJ.querySelector('input[name="senha_pj"]').value;
            const confirmarSenha = formPJ.querySelector('input[name="confirmar_senha_pj"]').value; // Pega a confirmação

            // --- CORREÇÃO: Validação de Senha ---
            if (senha !== confirmarSenha) {
                alert('As senhas não coincidem. Por favor, tente novamente.');
                return; // Para a execução
            }
            if (!idioma) {
                alert('Por favor, selecione um idioma.');
                return;
            }
            // --- FIM DA CORREÇÃO ---

            auth.createUserWithEmailAndPassword(email, senha)
                .then((userCredential) => {
                    const user = userCredential.user;
                    return db.collection('users').doc(user.uid).set({
                        nome: nomeEmpresa, // Salva o nome da empresa
                        nomeCompleto: nomeEmpresa,
                        cnpj: cnpj, // Salva o CNPJ
                        email: email,
                        idioma: idioma, // Salva o idioma
                        userType: 'pj', // Define como PJ
                        username: generateUsername(nomeEmpresa || email),
                        profilePicture: 'assets/imagens/avatar-padrao.png',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                })
                .then(() => {
                    alert('Cadastro de Pessoa Jurídica realizado com sucesso!');
                    window.location.href = 'hub.html';
                })
                .catch((error) => {
                    console.error("Erro no cadastro PJ:", error);
                     if (error.code === 'auth/email-already-in-use') {
                        alert('Erro: Este e-mail já está em uso.');
                    } else if (error.code === 'auth/weak-password') {
                        alert('Erro: A senha é muito fraca. Tente uma senha com pelo menos 6 caracteres.');
                    } else {
                        alert('Erro ao cadastrar: ' + error.message);
                    }
                });
        });
    }

});

// Função auxiliar (se não estiver no seu cadastro.js, adicione)
function generateUsername(nameOrEmail) {
    if (!nameOrEmail) return 'user' + Math.random().toString(36).substr(2, 6);
    // Remove caracteres especiais, pega o email antes do @, e força minúsculas
    const base = nameOrEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const suffix = Math.floor(Math.random() * 9000) + 1000; // Sufixo de 4 dígitos
    // Garante que a base não esteja vazia
    return (base || 'user') + suffix;
}