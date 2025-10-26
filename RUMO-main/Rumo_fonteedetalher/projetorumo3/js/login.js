document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form-main');
    
    // Seleciona TODOS os botões sociais (nos painéis de Login E Cadastro)
    const googleLoginBtns = document.querySelectorAll('.google-login-btn');
    const facebookLoginBtns = document.querySelectorAll('.facebook-login-btn');
    const instagramLoginBtns = document.querySelectorAll('.instagram-login-btn');

    // --- 1. LOGIN COM E-MAIL E SENHA (Para PF ou PJ) ---
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('input[name="email"]').value;
            const password = loginForm.querySelector('input[name="password"]').value;

            auth.signInWithEmailAndPassword(email, password)
                .then(() => {
                    alert('Login realizado com sucesso!');
                    window.location.href = 'hub.html';
                })
                .catch((error) => {
                    console.error("Erro no login:", error);
                    alert('Erro ao fazer login: ' + error.message);
                });
        });
    }

    // --- 2. LOGIN COM GOOGLE ---
    googleLoginBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); 
            const provider = new firebase.auth.GoogleAuthProvider();
            handleSocialLogin(provider);
        });
    });

    // --- 3. LOGIN COM FACEBOOK ---
    facebookLoginBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const provider = new firebase.auth.FacebookAuthProvider();
            handleSocialLogin(provider);
        });
    });

    // --- 4. LOGIN COM INSTAGRAM (Aviso) ---
    instagramLoginBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Login com Instagram não está disponível no momento.');
        });
    });
});

/**
 * Função unificada para lidar com o login social (Google, Facebook)
 * @param {firebase.auth.AuthProvider} provider O provedor de autenticação (Google, Facebook)
 */
function handleSocialLogin(provider) {
    auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            const userRef = db.collection('users').doc(user.uid);

            return userRef.get().then(doc => {
                if (!doc.exists) {
                    // --- REGRA: NOVO USUÁRIO SOCIAL É SEMPRE 'pf' ---
                    const username = generateUsername(user.displayName || user.email || user.uid);
                    return userRef.set({
                        nome: user.displayName || '', // Puxa o nome da rede social
                        nomeCompleto: user.displayName || '', // Puxa o nome da rede social
                        email: user.email || '',
                        username: username,
                        profilePicture: user.photoURL || 'assets/imagens/avatar-padrao.png',
                        userType: 'pf', // REGRA: Definido como Pessoa Física
                        provider: provider.providerId,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } else {
                    // --- REGRA: USUÁRIO EXISTENTE ---
                    const data = doc.data();
                    const updates = {};
                    
                    // Se o usuário já existe mas não tem 'userType', define como 'pf' (corrige contas antigas)
                    if (!data.userType) {
                        updates.userType = 'pf';
                    }
                    // Se não tiver nome, puxa da rede social
                    if (!data.nome && user.displayName) {
                        updates.nome = user.displayName;
                        updates.nomeCompleto = user.displayName;
                    }
                    if (!data.profilePicture && user.photoURL) {
                        updates.profilePicture = user.photoURL;
                    }
                    
                    if (Object.keys(updates).length > 0) {
                        return userRef.update(updates);
                    }
                }
            });
        })
        .then(() => {
            alert('Login social realizado com sucesso!');
            window.location.href = 'hub.html';
        })
        .catch((error) => {
            console.error("Erro no login social:", error);
            if (error.code === 'auth/account-exists-with-different-credential') {
                alert('Erro: Você já possui uma conta com este e-mail usando um método diferente (ex: E-mail e Senha).');
            } else {
                alert('Erro ao fazer login social: ' + error.message);
            }
        });
}

/**
 * Função auxiliar para gerar um nome de usuário
 */
function generateUsername(nameOrEmail) {
    if (!nameOrEmail) return 'user' + Math.random().toString(36).substr(2, 6);
    const base = nameOrEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const suffix = Math.floor(Math.random() * 9000) + 1000;
    return (base || 'user') + suffix;
}