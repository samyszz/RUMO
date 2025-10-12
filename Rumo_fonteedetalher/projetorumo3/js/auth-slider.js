document.addEventListener('DOMContentLoaded', function() {
    // Seleciona os botões e o container principal pelos seus IDs
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');
    const container = document.getElementById('container-wrapper');

    // Verifica se todos os elementos necessários existem na página
    if (signUpButton && signInButton && container) {
        
        // Adiciona um evento de clique ao botão 'Cadastro'
        // Quando clicado, adiciona a classe que ativa a animação para mostrar o formulário de cadastro
        signUpButton.addEventListener('click', () => {
            container.classList.add('right-panel-active');
        });

        // Adiciona um evento de clique ao botão 'Login'
        // Quando clicado, remove a classe, fazendo a animação reverter para mostrar o formulário de login
        signInButton.addEventListener('click', () => {
            container.classList.remove('right-panel-active');
        });
    }
});