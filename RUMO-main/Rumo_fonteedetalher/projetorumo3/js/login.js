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
    const handleSocialLogin = (provider) => {
        auth.signInWithPopup(provider)
            .then(async (result) => {
                // Login social bem-sucedido
                const user = result.user;
                
                // Verifica se é um novo usuário (Primeiro acesso)
                if (result.additionalUserInfo.isNewUser) {
                    console.log("Novo usuário social detectado. Registrando como Pessoa Física...");
                    
                    // Se for novo, salva informações básicas no Firestore
                    // REGRA: Login social é automaticamente 'pf'
                    try {
                        await db.collection('users').doc(user.uid).set({
                            nome: user.displayName,
                            nomeCompleto: user.displayName,
                            email: user.email,
                            userType: 'pf', // Automático para login social
                            username: generateUsername(user.displayName || user.email),
                            profilePicture: user.photoURL || 'assets/imagens/avatar-padrao.png',
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        }, { merge: true });
                    } catch (firestoreError) {
                        console.error("Erro ao salvar usuário no Firestore:", firestoreError);
                    }
                }
                
                // Redireciona para o hub
                window.location.href = 'hub.html';
                
            }).catch((error) => {
                console.error("Erro no login social:", error);
                
                let msg = 'Erro ao tentar login social: ' + error.message;
                
                if (error.code === 'auth/account-exists-with-different-credential') {
                    msg = 'Já existe uma conta com este e-mail associada a outro método de login (ex: Facebook/Senha). Use o método original.';
                } else if (error.code === 'auth/popup-closed-by-user') {
                    msg = 'O login foi cancelado.';
                } else if (error.code === 'auth/cancelled-popup-request') {
                    return; // Ignora múltiplos cliques
                }
                
                alert(msg);
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