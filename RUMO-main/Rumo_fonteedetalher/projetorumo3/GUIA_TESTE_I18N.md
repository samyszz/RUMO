# 🧪 Guia de Teste - Internacionalização R.U.M.O

## Como Testar a Internacionalização

### 1. **Teste Básico - Seletor de Idiomas no Header**

#### Passo 1: Abra qualquer página
- Acesse `index.html`
- Ou cualquer outra página: `hub.html`, `auth.html`, `utilitarios.html`, etc.

#### Passo 2: Localize o seletor de idiomas
- Procure pelo ícone 🌐 no header (canto superior direito)
- Clique no botão com ícone de idioma

#### Passo 3: Teste a seleção
- Você verá um dropdown com 11 idiomas
- Tente seleionar cada um:
  - ✓ Português (Brasil)
  - ✓ Español (Español)
  - ✓ English (English)
  - ✓ Français (Français)
  - ✓ 中文 (Mandarim)
  - ✓ 日本語 (Japonês)
  - ✓ Kreyòl (Crioulo Haitiano)
  - ✓ العربية (Árabe)
  - ✓ 한국어 (Coreano)
  - ✓ Guarani (Guarani)
  - ✓ Quechua (Quechua)

### 2. **Teste de Renderização de Textos**

#### Em `index.html` (Home):
- [x] Navegação muda para idioma selecionado
- [x] Título da página ("R.U.M.O - Início" em PT, "R.U.M.O - Home" em EN, etc)
- [x] Cards mudam de texto (Documentos → Documents, Utilidades → Utilities, etc)
- [x] Botão Tutorial muda ("Tutorial" em PT → "Tutorial" em EN, etc)

#### Em `hub.html` (Feed):
- [x] Placeholder da busca muda ("Pesquisar..." → "Search...", etc)
- [x] Botão de novo post ("+ Nova Publicação" → "+ New Post", etc)
- [x] Filtros mudam ("Todos" → "All", "Notícia" → "News", etc)

#### Em `auth.html` (Autenticação):
- [x] Títulos de abas (PF/PJ → Individual/Legal Entity)
- [x] Placeholders dos inputs
- [x] Botões de submit
- [x] Mensagens de erro

### 3. **Teste no Tutorial**
- Abra `tutorial.html`
- Selecione diferentes idiomas no header
- Verifique:
  - [x] Título da página muda
  - [x] Mensagem de boas-vindas ("Olá" → "Hello", etc)
  - [x] Títulos dos botões de navegação
  - [x] Perguntas frequentes (3 questões e respostas)
  - [x] Título FAQ ("Perguntas frequentes:" → "Frequently asked questions:", etc)

### 4. **Teste em Utilidades**
- Abra `utilitarios.html`
- Selecione um idioma diferente
- Verifique:
  - [x] Título principal "Com quais utilidades podemos te ajudar?" muda
  - [x] Nomes dos conversores (Moeda, Medida, Localização, etc)
  - [x] Placeholders dos inputs
  - [x] Botões de ação

### 5. **Teste de Persistência**
- Selecione um idioma (ex: Inglês)
- Recarregue a página (F5)
- O idioma deve ser mantido (salvo no localStorage)
- Navegue para outra página
- O idioma deve ser mantido em toda a plataforma

### 6. **Teste de Caracteres Especiais**
- Selecione **Árabe** 🇸🇦
  - Texto deve aparecer da direita para esquerda
  - Caracteres especiais: ❌ ✅ العربية
  
- Selecione **Mandarim** 🇨🇳
  - Caracteres devem ser: 中文
  
- Selecione **Japonês** 🇯🇵
  - Caracteres devem ser: 日本語
  
- Selecione **Coreano** 🇰🇷
  - Caracteres devem ser: 한국어

### 7. **Teste de Dashboard** (Se existir login)
- Faça login como uma empresa (PJ)
- Acesse o dashboard
- Selecione diferentes idiomas
- Verifique que todos os textos do dashboard são traduzidos:
  - [x] "Painel de Controle" → "Control Panel"
  - [x] "Alcance de perfis" → "Profile reach"
  - [x] Nomes das abas, métricas, etc.

## 📋 Checklist de Validação

### Estrutura de Tradução
- [ ] Todos os 11 idiomas aparecem no dropdown
- [ ] Nenhuma tradução aparece em branco/undefined
- [ ] Não há erros no console (F12 > Console)

### Funcionalidade
- [ ] Seleção de idioma persiste ao recarregar
- [ ] Seleção de idioma persiste ao mudar de página
- [ ] Dropdown se fecha após selecionar um idioma
- [ ] Header visual mostra idioma atual

### Compatibilidade
- [ ] Funciona em Chrome
- [ ] Funciona em Firefox
- [ ] Funciona em Safari
- [ ] Funciona em Edge
- [ ] Funciona em dispositivos móveis

### Renderização
- [ ] Texto não fica cortado
- [ ] Espaçamento correto em todos os idiomas
- [ ] Caracteres especiais renderizam corretamente
- [ ] RTL (árabe) está ativado quando necessário

## 🐛 Se Encontrar Problemas

### Problema: Idioma não está mudando
**Solução:**
1. Abra o console (F12)
2. Procure por erros de fetch em `locales/`
3. Verifique se os arquivos JSON existem e são válidos
4. Procure por erros no arquivo `js/i18n.js`

### Problema: Alguns textos não estão traduzidos
**Causa possível:** Falta `data-i18n="chave.especifica"` no HTML  
**Solução:** Procure o texto não traduzido no HTML e adicione o atributo

### Problema: Caracteres especiais não renderizam
**Causa possível:** Falta declaração `charset` no HTML  
**Solução:** Verifique se `<meta charset="UTF-8">` está na tag `<head>`

### Problema: Idioma não persiste ao recarregar
**Causa possível:** localStorage desativado no navegador  
**Solução:** Verifique permissões de localStorage ou teste em navegação anônima

## 📞 Como Reportar Erros

Se encontrar algo que não está funcionando:
1. Anote a página onde o erro ocorre
2. Anote o idioma selecionado
3. Anote o navegador usado
4. Abra a console (F12) e procure por mensagens de erro
5. Reporte com screenshot se possível

---

**Bom teste! 🚀**
