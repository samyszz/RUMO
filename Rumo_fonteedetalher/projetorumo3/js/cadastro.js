document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');
    

    // Lógica para alternar as abas PF e PJ
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(item => item.classList.remove('active'));
            contents.forEach(item => item.classList.remove('active'));
            tab.classList.add('active');
            const contentId = tab.getAttribute('data-tab');
            document.getElementById(contentId).classList.add('active');
        });
    });

    const languages = {
        "Espanhol": ["Venezuela", "Bolívia", "Paraguai", "Peru", "Argentina", "Colômbia", "Chile"],
        "Crioulo Haitiano": ["Haiti"],
        "Francês": ["Haiti", "República Democrática do Congo", "Senegal", "África Ocidental"],
        "Inglês": ["Nigéria", "Gana", "África do Sul"],
        "Árabe": ["Síria", "Líbano", "Palestina"],
        "Mandarim (Chinês)": ["China"],
        "Coreano": ["Coreia do Sul"],
        "Japonês": ["Japão"],
        "Guarani": ["Paraguai", "Bolívia"],
        "Quéchua": ["Bolívia", "Peru"],
        "Português": ["Angola","Brasil", "Moçambique", "Cabo Verde", "Portugal", "Guiné-Bissau", "Timor-Leste"]
    };

    // Lógica para popular os dropdowns de idioma
    function populateLanguageDropdowns() {
        const dropdowns = document.querySelectorAll('.language-dropdown');
        dropdowns.forEach(dropdown => {
            dropdown.innerHTML = '<option value="" disabled selected>Selecione um idioma</option>';
            for (const language in languages) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = language;
                languages[language].forEach(country => {
                    const option = document.createElement('option');
                    option.value = `${language}-${country}`;
                    option.textContent = `${language} - ${country}`;
                    optgroup.appendChild(option);
                });
                dropdown.appendChild(optgroup);
            }
        });
    }
    populateLanguageDropdowns();

    const formPF = document.getElementById('pf');
    const formPJ = document.getElementById('pj');

    if (formPF) {
        formPF.addEventListener('submit', (e) => {
            e.preventDefault();
            const senha = formPF.querySelector('input[name="senha"]').value;
            const confirmarSenha = formPF.querySelector('input[name="confirmar_senha"]').value;

            if (senha !== confirmarSenha) {
                alert('As senhas não coincidem!');
                return;
            }

            const email = formPF.querySelector('input[name="email"]').value;
            const nome = formPF.querySelector('input[name="nome"]').value;
            
            auth.createUserWithEmailAndPassword(email, senha)
                .then(cred => {
                    // Salva o tipo de usuário no localStorage logo após o cadastro
                    localStorage.setItem('userType', 'pf');
                    
                    return db.collection('users').doc(cred.user.uid).set({
                        nome: nome, email: email, userType: 'pf'
                    });
                }).then(() => {
                    alert('Cadastro realizado com sucesso!');
                    window.location.href = 'hub.html';
                }).catch(err => alert(err.message));
        });
    }

    if (formPJ) {
        formPJ.addEventListener('submit', (e) => {
            e.preventDefault();
            const senha = formPJ.querySelector('input[name="senha_pj"]').value;
            const confirmarSenha = formPJ.querySelector('input[name="confirmar_senha_pj"]').value;

            if (senha !== confirmarSenha) {
                alert('As senhas não coincidem!');
                return;
            }

            const email = formPJ.querySelector('input[name="email_comercial"]').value;
            const nomeEmpresa = formPJ.querySelector('input[name="nome_empresa"]').value;
            const cnpj = formPJ.querySelector('input[name="cnpj"]').value;

            auth.createUserWithEmailAndPassword(email, senha)
                .then(cred => {
                    // Salva o tipo de usuário no localStorage logo após o cadastro
                    localStorage.setItem('userType', 'pj');

                    return db.collection('users').doc(cred.user.uid).set({
                        nome: nomeEmpresa, email: email, cnpj: cnpj, userType: 'pj'
                    });
                }).then(() => {
                    alert('Cadastro de Pessoa Jurídica realizado com sucesso!');
                    window.location.href = 'hub.html';
                }).catch(err => alert(err.message));
        });
    }
});