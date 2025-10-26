document.addEventListener("DOMContentLoaded", () => {
    const carouselContainer = document.querySelector(".carousel-container");
    const prevButton = document.getElementById("prev-slide");
    const nextButton = document.getElementById("next-slide");

    // Verifica se os elementos do carrossel existem antes de adicionar os eventos
    if (carouselContainer && prevButton && nextButton) {
        
        // Função para rolar o carrossel
        const scrollCarousel = (direction) => {
            const card = carouselContainer.querySelector(".carousel-card");
            if (card) {
                const cardWidth = card.offsetWidth;
                const gap = 30; // O gap definido no seu CSS
                
                // Rola o contêiner pelo tamanho de um card + o espaço entre eles
                carouselContainer.scrollBy({
                    left: (cardWidth + gap) * direction,
                    behavior: "smooth"
                });
            }
        };

        // Adiciona o evento de clique para o botão de "próximo"
        nextButton.addEventListener("click", () => {
            scrollCarousel(1); // Rola para a direita
        });

        // Adiciona o evento de clique para o botão de "anterior"
        prevButton.addEventListener("click", () => {
            scrollCarousel(-1); // Rola para a esquerda
        });
    }
});
// --- REGISTRO DO SERVICE WORKER (PWA) ---

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('Service Worker registrado com sucesso:', registration.scope);
            })
            .catch(error => {
                console.log('Falha ao registrar Service Worker:', error);
            });
    });
}
