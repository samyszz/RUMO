window.addEventListener('load', function() {
    const loader = document.getElementById('loading-screen');
    if (loader) {
         // Pode aumentar o tempo aqui no setTimeout se quiser que o GIF dure mais
        setTimeout(function() {
            loader.classList.add('hide');
        }, 1000); // Exemplo: espera 1 segundo extra antes de sumir
    }
});