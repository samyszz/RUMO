document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form-main');
    const googleLoginBtn = document.getElementById('google-login-btn');
    const facebookLoginBtn = document.getElementById('facebook-login-btn');
    const instagramLoginBtn = document.getElementById('instagram-login-btn');

    // --- LOGIN COM E-MAIL E SENHA ---
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('input[name="email"]').value;
            const password = loginForm.querySelector('input[name="password"]').value;

            auth.signInWithEmailAndPassword(email, password)
                .then(() => {
                    // Replaced showNotification with alert for now
                    alert('Login realizado com sucesso!');
                    window.location.href = 'hub.html';
                })
                .catch((error) => {
                    console.error("Erro no login:", error);
                    alert('Erro ao fazer login: ' + error.message);
                });
        });
    }

    // --- LOGIN COM GOOGLE ---
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();

            auth.signInWithPopup(provider)
                .then((result) => {
                    const user = result.user;
                    const userRef = db.collection('users').doc(user.uid);

                    // Verifica se o utilizador já existe no Firestore
                    return userRef.get().then(doc => {
                        if (!doc.exists) {
                            // Se for um novo utilizador, cria o seu perfil como Pessoa Física
                            const username = generateUsername(user.displayName || user.email || user.uid);
                            userRef.set({
                                nome: user.displayName || '',
                                nomeCompleto: user.displayName || '',
                                email: user.email || '',
                                username: username,
                                profilePicture: user.photoURL || '',
                                userType: 'pf',
                                provider: 'google'
                            });
                        } else {
                            // Se o utilizador já existe, verifica se tem userType definido
                            const data = doc.data();
                            if (!data.userType) {
                                // Se não tem, define como Pessoa Física
                                userRef.update({
                                    userType: 'pf'
                                });
                            }
                            // Update basic profile data if missing
                            const updates = {};
                            if (!data.username) updates.username = generateUsername(user.displayName || user.email || user.uid);
                            if (!data.profilePicture && user.photoURL) updates.profilePicture = user.photoURL;
                            if (!data.email && user.email) updates.email = user.email;
                            if (Object.keys(updates).length) userRef.update(updates);
                        }
                    });
                })
                .then(() => {
                    alert('Login com Google realizado com sucesso!');
                    window.location.href = 'hub.html';
                })
                .catch((error) => {
                    console.error("Erro no login com Google:", error);
                    alert('Erro ao fazer login com Google: ' + error.message);
                });
        });
    }

    // --- LOGIN COM FACEBOOK ---
    if (facebookLoginBtn) {
        facebookLoginBtn.addEventListener('click', () => {
            const provider = new firebase.auth.FacebookAuthProvider();

            auth.signInWithPopup(provider)
                .then((result) => {
                    const user = result.user;
                    const userRef = db.collection('users').doc(user.uid);

                    return userRef.get().then(doc => {
                        const displayName = user.displayName || '';
                        const username = generateUsername(displayName || user.email || user.uid);

                        if (!doc.exists) {
                            // Novo usuário vindo do Facebook -> Pessoa Física
                            return userRef.set({
                                nome: displayName,
                                nomeCompleto: displayName,
                                email: user.email || '',
                                username: username,
                                profilePicture: user.photoURL || '',
                                userType: 'pf',
                                provider: 'facebook'
                            });
                        } else {
                            // Atualiza campos mínimos se estiverem faltando
                            const data = doc.data();
                            const updates = {};
                            if (!data.username) updates.username = username;
                            if (!data.profilePicture && user.photoURL) updates.profilePicture = user.photoURL;
                            if (!data.email && user.email) updates.email = user.email;
                            if (!data.userType) updates.userType = 'pf';
                            if (Object.keys(updates).length) return userRef.update(updates);
                        }
                    });
                })
                .then(() => {
                    alert('Login com Facebook realizado com sucesso!');
                    window.location.href = 'hub.html';
                })
                .catch((error) => {
                    console.error('Erro no login com Facebook:', error);
                    alert('Erro ao fazer login com Facebook: ' + error.message);
                });
        });
    }

    // --- LOGIN COM INSTAGRAM (NOTA) ---
    if (instagramLoginBtn) {
        instagramLoginBtn.addEventListener('click', () => {
            // Instagram não tem suporte direto no Firebase JS SDK para "Sign in with Instagram".
            // Requer backend com OAuth e troca de token. Aqui mostramos uma mensagem ao utilizador.
            alert('Login com Instagram requer integração de backend. Entre em contato com o administrador para habilitar.');
        });
    }
});

// --- HELPERS ---
function generateUsername(nameOrEmail) {
    if (!nameOrEmail) return 'user' + Math.random().toString(36).substr(2, 6);
    // Remove espaços e caracteres não alfanuméricos
    const base = nameOrEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const suffix = Math.floor(Math.random() * 9000) + 1000;
    return (base || 'user') + suffix;
}
