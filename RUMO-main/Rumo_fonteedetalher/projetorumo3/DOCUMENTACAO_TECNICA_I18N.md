# 📖 Documentação Técnica - Sistema de Internacionalização I18N

## Visão Geral

O sistema de internacionalização da R.U.M.O foi implementado com:
- **11 idiomas** suportados
- **Arquitetura baseada em JSON** para traduções
- **Sistema simples e escalável** usando `data-i18n` attributes
- **Sincronização de estado** via localStorage

## Arquitetura

### 1. Estrutura de Arquivos

```
projetorumo3/
├── js/
│   ├── i18n.js                    # Core do sistema
│   ├── main-menu.js               # Integração com menu
│   └── [...outros scripts]
├── locales/                        # Arquivos de tradução
│   ├── brasil.json                # Português (Brasil)
│   ├── ingles.json                # English
│   ├── espanhol.json              # Español
│   ├── frances.json               # Français
│   ├── mandarim.json              # 中文
│   ├── japones.json               # 日本語
│   ├── crioulo-haitiano.json      # Kreyòl
│   ├── arabe.json                 # العربية
│   ├── coreano.json               # 한국어
│   ├── guarani.json               # Guarani
│   └── quechua.json               # Quechua
└── [pages].html                    # HTMLs com data-i18n
```

### 2. Fluxo de Funcionamento

```
1. Page Load
   ↓
2. i18n.js initialized
   ├─ Lê localStorage.rumo_lang
   ├─ Define default como 'pt'
   └─ Carrega JSON correspondente
   ↓
3. applyTranslations()
   ├─ Procura por [data-i18n]
   ├─ Extrai chave (ex: "nav.home")
   ├─ Encontra valor em translations
   └─ Aplica ao elemento
   ↓
4. updateDropdowns()
   └─ populateLanguageSelect()
      └─ Cria options dinamicamente
   ↓
5. User selects language
   ↓
6. setLanguage(langCode)
   ├─ Carrega novo JSON
   ├─ Chama applyTranslations()
   ├─ Salva em localStorage
   ├─ Dispara evento 'languageChanged'
   └─ Page atualizada com novo idioma
```

## Como Funciona

### Classe I18N

**Arquivo:** `js/i18n.js`

#### Constructor
```javascript
constructor() {
    // Lê idioma salvo, ou padrão 'pt'
    this.currentLang = localStorage.getItem('rumo_lang') || 'pt';
    
    // Mapeia código → arquivo JSON
    this.fileMap = {
        'pt': 'brasil.json',
        'es': 'espanhol.json',
        // ... etc
    };
    
    // Mapeia código → imagem de banner
    this.bannerImageMap = { /* ... */ };
}
```

#### Métodos Principais

**`async init()`**
- Chamado automaticamente após instanciação
- Carrega JSON do idioma
- Aplica traduções
- Popula dropdowns

**`async loadTranslations(langCode)`**
- Faz fetch do arquivo JSON
- Parse e salva em `this.translations`
- Salva idioma em localStorage
- Define `document.documentElement.lang`

**`applyTranslations()`**
- Procura todos os elementos com `[data-i18n]`
- Para cada elemento:
  - Extrai valor do atributo
  - Navega pela estrutura JSON usando split('.')
  - Aplica valor ao elemento (innerHTML ou placeholder)

**`updateDropdowns()`**
- Encontra todos os selects de idioma
- Popula com `populateLanguageSelect()`
- Define valor selecionado

**`populateLanguageSelect(select)`** ⭐ **NOVO**
- Cria options para cada idioma
- Usa nomes nativos do idioma
- Adiciona ao select

#### Função Global

**`window.setLanguage(langCode)`**
- Chamada quando usuário seleciona idioma
- Carrega novo JSON
- Re-aplica todas as traduções
- Emite evento customizado `languageChanged`

### Estrutura JSON

**Padrão:** Hierarquias aninhadas usando pontos (dot notation)

**Exemplo - brasil.json:**
```json
{
  "nav": {
    "home": "Início",
    "hub": "HUB",
    "tools": "Utilidades"
  },
  "index": {
    "title": "R.U.M.O - Início",
    "card": {
      "documents": "Documentos",
      "tools": "Utilidades"
    }
  },
  "tutorial": {
    "title": "Tutorial — R.U.M.O",
    "faq_title": "Perguntas frequentes:"
  }
}
```

**Mapeamento HTML → JSON:**
```html
<!-- HTML -->
<h1 data-i18n="index.title">R.U.M.O - Início</h1>
<input placeholder="" data-i18n="nav.home">

<!-- Busca JSON -->
translations["index"]["title"]        → "R.U.M.O - Início"
translations["nav"]["home"]           → "Início"
```

### Suporte a Input/Textarea

O sistema detecta tipos de input e aplica corretamente:

```javascript
if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
    el.placeholder = value;  // ← Aplica a placeholder
} else {
    el.innerHTML = value;    // ← Aplica a innerHTML
}
```

## Como Adicionar Novos Idiomas

### Passo 1: Criar arquivo JSON
**Arquivo:** `locales/novo-idioma.json`

```json
{
  "nav": { /* copiado e traduzido de outro arquivo */ },
  "index": { /* ... */ },
  // ... todas as chaves de todos os outros arquivos
}
```

### Passo 2: Atualizar i18n.js

**Em `constructor()`:**
```javascript
this.fileMap = {
    // ... existentes
    'novo_codigo': 'novo-idioma.json'  // ← Adicionar
};

this.bannerImageMap = {
    // ... existentes
    'novo_codigo': 'banner-novo-idioma.png'  // ← Opcional
};
```

**Em `populateLanguageSelect()`:**
```javascript
const langNames = {
    // ... existentes
    'novo_codigo': 'Nome do Idioma (Native Name)'  // ← Adicionar
};
```

### Passo 3: Testar
```javascript
// No console do navegador
i18n.setLanguage('novo_codigo');
```

## Como Adicionar Novas Chaves de Tradução

### Passo 1: Adicionar ao HTML
```html
<button data-i18n="novo_espaco.nova_chave">Texto padrão PT</button>
```

### Passo 2: Adicionar a TODOS os 11 JSONs

**brasil.json:**
```json
{
  "novo_espaco": {
    "nova_chave": "Valor em português"
  }
}
```

**ingles.json:**
```json
{
  "novo_espaco": {
    "nova_chave": "Value in English"
  }
}
```

**(...) Repetir para os 9 outros idiomas**

### Passo 3: Recarregar página
- O sistema detectará automaticamente
- Ou chame: `i18n.applyTranslations()`

## Padrões Usados

### Nomenclatura de Chaves

```
[secao].[componente].[propriedade]

Exemplos:
- nav.home                    (Navegação)
- index.title                 (Página Index)
- index.card.documents        (Card de documentos)
- form.email_placeholder      (Placeholder de input)
- tutorial.faq_contact_q      (Pergunta FAQ)
- utilitarios.dashboard.title (Dashboard)
```

### Convenções

✓ Use **snake_case** para chaves
✓ Use **pontos** para hierarquias
✓ Mantenha ordem consistente entre idiomas
✓ Use placeholders para inputs
✓ Use innerHTML para divs/spans
✓ Traduce também: title, aria-label, placeholder

## Integração com Outros Scripts

### main-menu.js

Popula dropdown de idiomas no header:
```javascript
// Lê container de idioma
const langContainer = document.getElementById('header-lang-container');
const langSelect = langContainer.querySelector('#language-select-header');

// Popula dropdown
function populateLanguageDropdown() { /* ... */ }
populateLanguageDropdown();

// Ouve mudanças
langSelect.addEventListener('change', () => {
    const selectedLangCode = langSelect.value;
    setLanguage(selectedLangCode);  // ← Chama i18n global
});
```

### Event: languageChanged

Quando idioma muda, é disparado evento global:
```javascript
window.addEventListener('languageChanged', (event) => {
    console.log('Idioma mudou para:', event.detail);
    // Aqui você pode fazer ações adicionais
    // Ex: atualizar conteúdo dinâmico
});
```

## Testes Automatizados (Sugerido)

```javascript
// Testar todas as chaves em todos os idiomas
function validateAllTranslations() {
    const locales = ['pt', 'es', 'en', 'fr', 'zh', 'ja', 'ht', 'ar', 'ko', 'gn', 'qu'];
    const issues = [];
    
    for (const lang of locales) {
        i18n.currentLang = lang;
        await i18n.loadTranslations(lang);
        
        // Verificar chaves faltantes
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const keys = key.split('.');
            let value = i18n.translations;
            
            keys.forEach(k => { value = value ? value[k] : null; });
            
            if (!value) {
                issues.push(`${lang}: Chave faltante "${key}"`);
            }
        });
    }
    
    return issues;
}

// Chamar
validateAllTranslations().then(issues => {
    console.log(issues.length ? issues : '✓ Sem problemas');
});
```

## Performance

### Otimizações Implementadas

✓ **Lazy loading:** Carrega JSON sob demanda  
✓ **Caching:** Salva idioma em localStorage  
✓ **Cache de arquivo:** Service Worker cacheia JSONs  
✓ **Seletor eficiente:** `querySelectorAll` uma única vez  
✓ **Sem polling:** Usa event listeners, não timers  

### Tamanho dos Arquivos

- `brasil.json`: ~8 KB
- Cada idioma: ~8-10 KB (caracteres especiais aumentam pouco)
- `i18n.js`: ~3 KB (minificado)
- **Total:** ~100 KB para 11 idiomas

## Compatibilidade

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## RTL (Right-to-Left)

Para idiomas RTL como Árabe:

```html
<html dir="auto">  <!-- Detecta automaticamente -->
<!-- OU -->
<html dir="rtl">   <!-- Força RTL -->
```

O `document.documentElement.lang` é definido automaticamente.

## Debugging

### Verificar estado atual
```javascript
console.log(i18n.currentLang);           // Idioma atual
console.log(i18n.translations);         // Objeto de traduções
console.log(localStorage.getItem('rumo_lang'));  // Salvo
```

### Verificar elemento
```javascript
document.querySelector('[data-i18n="nav.home"]');  // Encontrar elemento
```

### Forçar re-aplicação
```javascript
i18n.applyTranslations();  // Re-aplica todas
```

### Ver evento
```javascript
window.addEventListener('languageChanged', (e) => {
    console.log('Novo idioma:', e.detail);
});
```

## Limitações Conhecidas

⚠️ **Conteúdo dinâmico:**
- Textos criados dinamicamente não são traduzidos automaticamente
- Solução: Chamar `i18n.applyTranslations()` após inserção

⚠️ **Banco de dados:**
- Posts, comentários, etc. precisam tradução separada (ou multi-linguagem)
- Considerar campo `lang` na Firestore

⚠️ **Formatos de data/hora:**
- Não há i18n automático de dates/times
- Sugerido usar `Intl` API do JavaScript

## Recursos Adicionais

### Arquivo de teste
Veja: `GUIA_TESTE_I18N.md`

### Resumo de mudanças
Veja: `INTERNACIONALIZACAO_RESUMO.md`

### API do Intl JavaScript (Futuro)
```javascript
// Datas
new Intl.DateTimeFormat('pt-BR').format(new Date());

// Números
new Intl.NumberFormat('pt-BR').format(1234.56);

// Moedas
new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
}).format(100);
```

---

**Versão:** 1.0  
**Última atualização:** 1º de Dezembro de 2025  
**Status:** ✅ Estável e Funcional
