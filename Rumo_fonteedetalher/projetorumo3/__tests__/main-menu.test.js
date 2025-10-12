/** @jest-environment jsdom */

const fs = require('fs');
const path = require('path');

// Helper to load the script as executed in the DOM
function loadScript(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const scriptEl = document.createElement('script');
  scriptEl.textContent = code;
  document.body.appendChild(scriptEl);
}

describe('main-menu behavior', () => {
  const scriptPath = path.resolve(__dirname, '../js/main-menu.js');

  beforeEach(() => {
    // Minimal DOM matching expected structure
    document.documentElement.innerHTML = `
      <header id="main-header">
        <div class="container">
          <nav id="main-nav">
            <ul>
              <li><a href="#">Home</a></li>
              <li><a href="#">HUB</a></li>
            </ul>
          </nav>
          <button class="hamburger-menu" id="hamburger-menu" aria-label="Abrir menu" aria-controls="main-nav" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
        </div>
      </header>
    `;

    // Load the script into the jsdom environment
    loadScript(scriptPath);

    // Simulate DOMContentLoaded event so listeners run
    const evt = new Event('DOMContentLoaded', { bubbles: true });
    document.dispatchEvent(evt);
  });

  test('clicking hamburger opens the menu and updates aria', () => {
    const hamburger = document.getElementById('hamburger-menu');
    const header = document.getElementById('main-header');
    const mainNav = document.getElementById('main-nav');

    expect(hamburger.getAttribute('aria-expanded')).toBe('false');
    expect(header.classList.contains('nav-open')).toBe(false);

    // click hamburger
    hamburger.click();

    expect(header.classList.contains('nav-open')).toBe(true);
    expect(hamburger.getAttribute('aria-expanded')).toBe('true');
    expect(mainNav.getAttribute('aria-hidden')).toBe('false');
  });

  test('pressing Escape closes the menu', () => {
    const hamburger = document.getElementById('hamburger-menu');
    const header = document.getElementById('main-header');

    // open first
    hamburger.click();
    expect(header.classList.contains('nav-open')).toBe(true);

    // press Escape
    const esc = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(esc);

    expect(header.classList.contains('nav-open')).toBe(false);
    expect(hamburger.getAttribute('aria-expanded')).toBe('false');
  });

});
