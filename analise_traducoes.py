import json
import os

# Função para extrair todas as chaves recursivamente
def get_all_keys(obj, prefix=''):
    keys = set()
    if isinstance(obj, dict):
        for k, v in obj.items():
            full_key = f'{prefix}.{k}' if prefix else k
            keys.add(full_key)
            keys.update(get_all_keys(v, full_key))
    return keys

locale_path = r'c:\Users\samyr\OneDrive\Desktop\RUMO-main\RUMO-main\Rumo_fonteedetalher\projetorumo3\locales'

# Ler brasil.json como referência
with open(os.path.join(locale_path, 'brasil.json'), 'r', encoding='utf-8') as f:
    brasil = json.load(f)

brasil_keys = get_all_keys(brasil)
print(f'Brasil: {len(brasil_keys)} chaves totais')
print()

# Arquivos para verificar
arquivos = [
    'ingles.json', 'espanhol.json', 'frances.json', 'mandarim.json',
    'japones.json', 'crioulo-haitiano.json', 'arabe.json', 'coreano.json',
    'guarani.json', 'quechua.json'
]

for arquivo in arquivos:
    try:
        with open(os.path.join(locale_path, arquivo), 'r', encoding='utf-8') as f:
            dados = json.load(f)
        arquivo_keys = get_all_keys(dados)
        faltantes = brasil_keys - arquivo_keys
        
        status = 'COMPLETO' if len(faltantes) == 0 else 'INCOMPLETO'
        print(f'{arquivo}: {status}')
        print(f'  Chaves: {len(arquivo_keys)}/{len(brasil_keys)}')
        if faltantes:
            print(f'  Faltando ({len(faltantes)}):')
            for chave in sorted(faltantes):
                print(f'    - {chave}')
        print()
    except Exception as e:
        print(f'{arquivo}: ERRO - {e}')
        print()
