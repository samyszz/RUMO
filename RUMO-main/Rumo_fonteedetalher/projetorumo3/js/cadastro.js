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
            const senha = formPF.querySelector('input[name="senha"]').value;
            // ... (resto do formulário PF)

            // (Lógica de cadastro PF por e-mail)
            auth.createUserWithEmailAndPassword(email, senha)
                .then((userCredential) => {
                    const user = userCredential.user;
                    return db.collection('users').doc(user.uid).set({
                        nome: nome,
                        nomeCompleto: nome,
                        email: email,
                        // idioma: idioma,
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
                    alert('Erro ao cadastrar: ' + error.message);
                });
        });
    }

    // --- 3. CADASTRO DE PESSOA JURÍDICA (PJ) ---
    if (formPJ) {
        formPJ.addEventListener('submit', (e) => {
            e.preventDefault();

            const nomeEmpresa = formPJ.querySelector('input[name="nome_empresa"]').value;
            const email = formPJ.querySelector('input[name="email_comercial"]').value;
            const senha = formPJ.querySelector('input[name="senha_pj"]').value;
            // ... (resto do formulário PJ)

            auth.createUserWithEmailAndPassword(email, senha)
                .then((userCredential) => {
                    const user = userCredential.user;
                    return db.collection('users').doc(user.uid).set({
                        nome: nomeEmpresa, // Salva o nome da empresa
                        nomeCompleto: nomeEmpresa,
                        // cnpj: cnpj,
                        email: email,
                        // idioma: idioma,
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
                    alert('Erro ao cadastrar: ' + error.message);
                });
        });
    }

    // ... (Resto do seu código de 'cadastro.js', como a função de idioma)
    // (Vou omitir o código de 'languages' e 'populateLanguageDropdown' que já estava lá)
});

// Função auxiliar (se não estiver no seu cadastro.js, adicione)
function generateUsername(nameOrEmail) {
    if (!nameOrEmail) return 'user' + Math.random().toString(36).substr(2, 6);
    const base = nameOrEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const suffix = Math.floor(Math.random() * 9000) + 1000;
    return (base || 'user') + suffix;
}