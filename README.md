# KICK — BRENO 10

Site de uma marca conceitual de chuteiras criada para o Breno. A hero apresenta um jogador digital original que prepara o chute, acerta a bola e a lança em direção à câmera. A sequência é controlada pela rolagem e pode ser pausada ou percorrida ao contrário. O restante da página mantém o modelo interativo da chuteira, três combinações de cor, coleção, detalhes e uma sacola local. Sem login ou cadastro. A sacola permite copiar uma seleção; não processa pagamentos ou pedidos.

Site público: https://brenobernardes2024.github.io/acai-premium/

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
- `cinematic-hero.js` e `cinematic-hero.css`: sequência cinematográfica, câmera, iluminação, efeitos e interface da hero.
- `athlete-model.js`: geometria e articulações do jogador, e bola com painéis esféricos, originais e gerados localmente.
- `vendor/`: Three.js 0.160.1, fonte Nimbus Sans Narrow e suas licenças.

O site atual usa recursos locais e não depende de CDNs, contas ou credenciais. Arquivos antigos de referência permanecem no repositório, mas não são carregados pela página inicial.

## Validação

```bash
node --check kick.js
node --check boot-model.js
node --check cinematic-hero.js
node --check athlete-model.js
```

Verifique no navegador: fases do chute ao rolar, aproximação da bola, reversão ao rolar para cima, pausa e reprodução, redimensionamento da janela e navegação para a coleção. Confira também o modelo da chuteira, cores, teclado, tamanhos e sacola. A preferência por movimento reduzido apresenta uma hero estática, sem uma longa área de rolagem; quando WebGL não está disponível, uma ilustração preserva o acesso à coleção. A cena não intercepta eventos de roda/toque para controlar a rolagem.

Para executar os testes da hero, instale Playwright em um ambiente de testes com Chromium disponível e, com o servidor rodando, execute `python3 tests/test_cinematic_hero.py`. As verificações cobrem rolagem, profundidade, reversão, pausa, celular, redimensionamento, movimento reduzido e alternativa sem WebGL. `KICK_TEST_URL` permite selecionar outro endereço de testes; `KICK_TEST_SCREENSHOT_DIR` habilita capturas.

## Referências de direção de arte

Foram consultados os portfólios públicos de [Lusion](https://lusion.co/), [Active Theory](https://activetheory.net/) e [Bruno Simon](https://bruno-simon.com/), como referências de narrativa espacial, interação WebGL e atenção ao desempenho. O personagem, a bola, a coreografia, os efeitos e a identidade da KICK foram criados para este projeto; nenhum modelo ou conteúdo desses portfólios foi incorporado. Não se atribui preço de contratação a esses exemplos.

Marca, narrativa, modelo e preços são demonstrativos. Nenhuma afiliação com marcas ou atletas profissionais é declarada.
