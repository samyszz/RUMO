// js/sair-excluir-conta.js

document.addEventListener('DOMContentLoaded', () => {
    // Pega as instâncias de Auth e Firestore do objeto firebase global
    const auth = firebase.auth();
    const db = firebase.firestore();

    const logoutBtn = document.getElementById('logout-btn');
    const deleteAccountBtn = document.getElementById('delete-account-btn');

    // --- LÓGICA PARA SAIR (LOGOUT) ---
    logoutBtn.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja sair da sua conta?')) {
            auth.signOut().then(() => { // Usamos auth.signOut()
                localStorage.removeItem('userId');
                alert('Você saiu da sua conta.');
                window.location.href = 'login.html';
            }).catch((error) => {
                console.error('Erro ao fazer logout:', error);
                alert('Ocorreu um erro ao tentar sair.');
            });
        }
    });

    // --- LÓGICA PARA EXCLUIR CONTA ---
    deleteAccountBtn.addEventListener('click', () => { // Removido o 'async'
        const user = auth.currentUser;
        if (!user) {
            alert('Nenhum usuário logado para excluir.');
            return;
        }

        const confirmText = "EXCLUIR";
        const promptResult = prompt(`Esta ação é irreversível. Para confirmar, digite "${confirmText}" na caixa abaixo.`);

        if (promptResult === confirmText) {
            // Passo 1: Excluir a "ficha" do usuário no Firestore
            db.collection("users").doc(user.uid).delete().then(() => {
                // Passo 2: Excluir o usuário do "guarda-costas" (Authentication)
                return user.delete();
            }).then(() => {
                localStorage.removeItem('userId');
                alert('Sua conta foi excluída permanentemente.');
                window.location.href = 'index.html';
            }).catch((error) => {
                console.error("Erro ao excluir conta: ", error);
                if (error.code === 'auth/requires-recent-login') {
                    alert('Por segurança, você precisa fazer login novamente antes de excluir sua conta.');
                    auth.signOut();
                    window.location.href = 'login.html';
                } else {
                    alert('Ocorreu um erro ao excluir sua conta.');
                }
            });
        } else {
            alert('Ação cancelada. Sua conta não foi excluída.');
        }
    });
});