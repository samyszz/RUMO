// Using global auth and db from firebase-config.js
// import { auth, db } from './firebase-config.js';
// import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
// import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Seleciona os elementos do menu que vamos manipular
const menuSignup = document.getElementById('menu-signup');
const menuProfile = document.getElementById('menu-profile');
const profilePic = menuProfile ? menuProfile.querySelector('.header-profile-pic') : null;

// O "Vigia" do Firebase
firebase.auth().onAuthStateChanged(async (user) => {
  if (user) {
    // 1. SE UM USUÁRIO ESTÁ LOGADO...
    
    // Esconde o botão "Criar conta" e mostra o espaço da foto do perfil
    if (menuSignup) menuSignup.classList.add('hidden');
    if (menuProfile) menuProfile.classList.remove('hidden');

    // Guarda o ID na memória para outras páginas usarem
    localStorage.setItem('userId', user.uid);

    // Busca a "ficha" do usuário no Firestore para pegar a URL da foto
    try {
        const docRef = firebase.firestore().collection("users").doc(user.uid);
        const docSnap = await docRef.get();

        if (docSnap.exists && docSnap.data().photoURL) {
            // Se encontrou a ficha e ela tem uma foto, usa essa foto
            if (profilePic) profilePic.src = docSnap.data().photoURL;
        } else {
            // Se não, usa a foto padrão que já está no HTML
            console.log("Usuário sem foto de perfil definida.");
        }
    } catch (error) {
        console.error("Erro ao buscar foto do perfil:", error);
    }

  } else {
    // 2. SE NINGUÉM ESTÁ LOGADO...

    // Mostra o botão "Criar conta" e esconde a foto do perfil
    if (menuSignup) menuSignup.classList.remove('hidden');
    if (menuProfile) menuProfile.classList.add('hidden');

    // Limpa o ID da memória
    localStorage.removeItem('userId');
  }
});


// Função de Logout (Sair)
window.logout = () => {
  firebase.auth().signOut().then(() => {
    alert('Você saiu da sua conta.');
    localStorage.removeItem('userId'); // Limpa o ID ao sair
    window.location.href = 'login.html';
  }).catch((error) => {
    console.error('Erro ao fazer logout:', error);
  });
};
