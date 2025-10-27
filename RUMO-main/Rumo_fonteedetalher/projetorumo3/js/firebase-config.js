
// A sua configuração do Firebase com as suas chaves
const firebaseConfig = {
    apiKey: "AIzaSyDKf6qEIiXaEMangXYsbca2T85FaRtE0QI",
    authDomain: "projetorumo3-9eba6.firebaseapp.com",
    projectId: "projetorumo3-9eba6",
    storageBucket: "projetorumo3-9eba6.appspot.com",
    messagingSenderId: "492672652548",
    appId: "1:492672652548:web:3f6749b5201be6e5e72c51",
    measurementId: "G-YZJC6E8S4D"
};

// Inicializa o Firebase, tornando-o disponível globalmente
firebase.initializeApp(firebaseConfig);

// Disponibiliza as ferramentas para acesso fácil em outros scripts
var auth = firebase.auth();
var db = firebase.firestore();

/*
Note: The export statement is not supported in non-module scripts.
Since your HTML includes Firebase scripts without type="module",
remove the export statement and rely on global variables.
*/

// Export { auth, db }; // Removed to avoid syntax error
// --- HABILITA O MODO OFFLINE DO FIRESTORE ---
// (Adicione esta linha!)
db.enablePersistence({ synchronizeTabs: true }) // synchronizeTabs é bom se o usuário abrir várias abas
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            // Provavelmente múltiplas abas abertas, o que é ok.
            console.warn('Persistência do Firestore falhou, talvez por múltiplas abas.');
        } else if (err.code == 'unimplemented') {
            // Navegador não suporta (muito raro hoje em dia)
            console.warn('Este navegador não suporta persistência offline do Firestore.');
        }
    });
// --- FIM DA MUDANÇA ---