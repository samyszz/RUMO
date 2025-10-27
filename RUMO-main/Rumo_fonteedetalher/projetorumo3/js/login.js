document.addEventListener('DOMContentLoaded', function() {
    
    // --- LÓGICA DE LOGIN ---
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

    // --- LÓGICA DE LOGIN SOCIAL (Exemplo Google) ---
    // (Descomente e ajuste se quiser adicionar login social)

    /*
    const googleLoginButtons = document.querySelectorAll('.google-login-btn');
    
    googleLoginButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            const provider = new firebase.auth.GoogleAuthProvider();
            
            auth.signInWithPopup(provider)
                .then((result) => {
                    // Login social bem-sucedido
                    const user = result.user;
                    
                    // Verifica se é um novo usuário
                    if (result.additionalUserInfo.isNewUser) {
                        // Se for novo, salva informações básicas no Firestore
                        // 'db' e 'generateUsername' precisam estar disponíveis
                        db.collection('users').doc(user.uid).set({
                            nome: user.displayName,
                            nomeCompleto: user.displayName,
                            email: user.email,
                            userType: 'pf', // Padrão para login social
                            username: generateUsername(user.displayName || user.email),
                            profilePicture: user.photoURL || 'assets/imagens/avatar-padrao.png',
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        }, { merge: true }); // Merge true para não sobrescrever se já existir
                    }
                    
                    window.location.href = 'hub.html';
                    
                }).catch((error) => {
                    console.error("Erro no login com Google:", error);
                    alert('Erro ao tentar login com Google: ' + error.message);
                });
        });
    });
    */
    
    // (A função generateUsername do cadastro.js precisa estar acessível aqui se você usar o login social)
    // (Se o login.js for carregado antes do cadastro.js, copie a função generateUsername para cá também)
    /*
    function generateUsername(nameOrEmail) {
        if (!nameOrEmail) return 'user' + Math.random().toString(36).substr(2, 6);
        const base = nameOrEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        const suffix = Math.floor(Math.random() * 9000) + 1000;
        return (base || 'user') + suffix;
    }
    */
});