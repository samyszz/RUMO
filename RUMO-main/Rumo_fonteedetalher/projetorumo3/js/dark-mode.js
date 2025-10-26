
document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');
    const ondaCima = document.getElementById('onda-cima');
    const ondaBaixo = document.getElementById('onda-baixo');
    const currentTheme = localStorage.getItem('theme');

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            if (ondaCima) ondaCima.src = 'ondacimadark.png';
            if (ondaBaixo) ondaBaixo.src = 'ondabaixodark.png';
        } else {
            document.body.classList.remove('dark-mode');
            if (ondaCima) ondaCima.src = 'ondacima.png';
            if (ondaBaixo) ondaBaixo.src = 'ondabaixo.png';
        }
    };

    applyTheme(currentTheme || 'light');

    themeToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-mode');
            const newTheme = isDark ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);  // Atualiza também as imagens
        });
    });
});
