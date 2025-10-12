document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form-main');
    const googleLoginBtn = document.getElementById('google-login-btn');

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
                            userRef.set({
                                nome: user.displayName,
                                email: user.email,
                                userType: 'pf'
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
});
