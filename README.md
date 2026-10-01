# KICK — BRENO 10

Site de uma marca conceitual de chuteiras criada para o Breno. A página inclui um modelo 3D original em Three.js, três combinações de cor, controle por mouse/toque/teclado, coleção, detalhes do produto e uma sacola local. Sem login ou cadastro. A sacola permite copiar uma seleção; não processa pagamentos ou pedidos.

## Executar

No checkout existente, execute:

```bash
cd /workspace/acai-premium
python3 -m http.server 8000 --bind 0.0.0.0
```

Não é preciso instalar pacotes ou compilar. O navegador precisa servir os arquivos por HTTP para importar os módulos JavaScript. Em plataformas de hospedagem estática, use a raiz do repositório como diretório de publicação, sem comando de build. A página inicial é `index.html`.

## Arquivos principais

- `index.html`: estrutura e conteúdo.
- `kick.css`: identidade visual e layout responsivo.
- `kick.js`: cena 3D e interações da página/sacola.
- `boot-model.js`: geometria, materiais e texturas da chuteira, gerados localmente.
- `vendor/`: Three.js 0.160.1, fonte Nimbus Sans Narrow e suas licenças.

O site atual usa recursos locais e não depende de CDNs, contas ou credenciais. Arquivos antigos de referência permanecem no repositório, mas não são carregados pela página inicial.

## Validação

```bash
node --check kick.js
node --check boot-model.js
```

Verifique no navegador: modelo 3D, troca de cores, arraste e setas do teclado, pausa/restauração da vista, detalhes do produto, escolha obrigatória de tamanho, quantidade e remoção da sacola, persistência após recarregar, guia de tamanhos e menu móvel. A interface respeita a preferência por movimento reduzido e oferece uma ilustração alternativa quando WebGL não está disponível.

Marca, narrativa, modelo e preços são demonstrativos. Nenhuma afiliação com marcas ou atletas profissionais é declarada.
