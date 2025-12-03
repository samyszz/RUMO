document.addEventListener('DOMContentLoaded', function() {
    
    // --- LÓGICA DE LOGIN (EMAIL/SENHA) ---
    const loginForm = document.getElementById('login-form-main');
    
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = loginForm.querySelector('input[name="email"]').value;
            const password = loginForm.querySelector('input[name="password"]').value;

            if (!email || !password) {
                alert('Por favor, preencha o e-mail e a senha.');
                return;
            }

            // 'auth' deve estar definido globalmente por firebase-config.js
            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // Login bem-sucedido
                    console.log('Login bem-sucedido:', userCredential.user.email);
                    window.location.href = 'hub.html'; // Redireciona para o hub
                })
                .catch((error) => {
                    console.error("Erro no login:", error);
                    
                    // Melhora a mensagem de erro para o usuário
                    let mensagemErro = 'Ocorreu um erro ao tentar fazer login.';
                    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                        mensagemErro = 'E-mail ou senha incorretos. Por favor, tente novamente.';
                    } else if (error.code === 'auth/invalid-email') {
                        mensagemErro = 'O formato do e-mail é inválido.';
                    }
                    
                    alert(mensagemErro);
                });
        });
    }

    // --- LÓGICA DE LOGIN SOCIAL (Google e Facebook) ---
    
    // Função centralizada para tratar login social
    // js/login.js - Substitua a função handleSocialLogin por esta:

const handleSocialLogin = (provider) => {
    auth.signInWithPopup(provider)
        .then(async (result) => {
            // SIMPLES: Se entrou por rede social, GRAVA que é PF no banco agora.
            await db.collection('users').doc(result.user.uid).set({
                userType: 'pf', // <--- O carimbo de Pessoa Física
                email: result.user.email,
                nome: result.user.displayName || "Usuário",
                photoURL: result.user.photoURL
            }, { merge: true }); // 'merge' garante que não apague outros dados se já existirem

            // Tudo certo, manda pro Hub
            window.location.href = 'hub.html';
        })
        .catch((error) => {
            console.error("Erro no login:", error);
            alert("Não foi possível entrar com a rede social.");
        });
};
    // Configuração dos Botões Google
    const googleLoginButtons = document.querySelectorAll('.google-login-btn');
    googleLoginButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const provider = new firebase.auth.GoogleAuthProvider();
            handleSocialLogin(provider);
        });
    });

    // Configuração dos Botões Facebook
    const facebookLoginButtons = document.querySelectorAll('.facebook-login-btn');
    facebookLoginButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const provider = new firebase.auth.FacebookAuthProvider();
            handleSocialLogin(provider);
        });
    });
    
    // Função auxiliar para gerar username (Duplicada aqui para garantir funcionamento independente do cadastro.js)
    function generateUsername(nameOrEmail) {
        if (!nameOrEmail) return 'user' + Math.floor(Math.random() * 9000) + 1000;
        // Pega a parte antes do @ ou limpa o nome
        const base = nameOrEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        const suffix = Math.floor(Math.random() * 9000) + 1000;
        return (base || 'user') + suffix;
    }
});