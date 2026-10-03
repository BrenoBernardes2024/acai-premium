# KICK — BRENO 10

Site de uma marca conceitual de chuteiras criada para o Breno. A abertura apresenta um jogador fictício realista em oito imagens originais: preparação, armação, contato, trajetória, gol, rede, aproximação e close da chuteira. Movimentos de câmera e transições são vinculados à rolagem; uma bola em Three.js se aproxima do público antes do gol. A sequência ocupa uma seção de 680svh (6,8 telas) no computador e 600svh (6 telas) no celular, mantendo o palco fixo até o close final. Pode ser pausada e percorrida ao contrário. O restante mantém o modelo interativo da chuteira, três cores, coleção, detalhes e sacola local. Sem login ou cadastro. A sacola permite copiar uma seleção; não processa pagamentos ou pedidos.

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
- `cinematic-hero.js` e `cinematic-hero.css`: sequência fotográfica, câmera, transições, bola em 3D e interface da abertura.
- `assets/film/`: oito imagens de campanha criadas com IA para este site, em WebP (aproximadamente 1,7 MB no total). A primeira tem prioridade de carregamento; as demais carregam em duas filas. São quadros-chave com transições e câmera contínuas, não um vídeo ou captura de movimento.
- `athlete-model.js`: fornece a bola com painéis esféricos. A geometria antiga do jogador permanece como referência, mas não é usada na abertura.
- `vendor/`: Three.js 0.160.1, fonte Nimbus Sans Narrow e suas licenças.

O site atual usa recursos locais e não depende de CDNs, contas ou credenciais. Arquivos antigos de referência permanecem no repositório, mas não são carregados pela página inicial.

## Validação

```bash
node --check kick.js
node --check boot-model.js
node --check cinematic-hero.js
node --check athlete-model.js
```

Verifique no navegador: oito cenas ao rolar, aproximação da bola em 3D, gol, close final da chuteira, reversão ao rolar para cima, pausa e reprodução, redimensionamento da janela e navegação para a coleção. Confira também o modelo da chuteira, cores, teclado, tamanhos e sacola. A preferência por movimento reduzido apresenta uma hero estática, sem uma longa área de rolagem; quando WebGL não está disponível, toda a sequência fotográfica continua funcionando e apenas a passagem da bola em 3D é omitida. Sem JavaScript, a fotografia inicial e os links continuam disponíveis. Uma imagem indisponível é substituída pelo quadro carregado mais próximo. A cena não intercepta eventos de roda/toque para controlar a rolagem.

Para executar os testes da hero, instale Playwright em um ambiente de testes com Chromium disponível e, com o servidor rodando, execute `python3 tests/test_cinematic_hero.py`. As verificações cobrem as oito cenas, gol e close, reversão, pausa, celular, redimensionamento, preferência por movimento reduzido (inclusive alterada em execução), perda de contexto e ausência de WebGL, falha no carregamento de um quadro, coleção e sacola. `KICK_TEST_URL` permite selecionar outro endereço de testes; `KICK_TEST_SCREENSHOT_DIR` habilita capturas.

## Referências de direção de arte

Foram consultados os portfólios públicos de [Lusion](https://lusion.co/), [Active Theory](https://activetheory.net/) e [Bruno Simon](https://bruno-simon.com/), como referências de narrativa espacial, interação WebGL e atenção ao desempenho. As imagens do personagem fictício, a bola, a sequência, os efeitos e a identidade da KICK foram criados para este projeto; nenhum modelo ou conteúdo desses portfólios foi incorporado. Não se atribui preço de contratação a esses exemplos.

Marca, narrativa, modelo e preços são demonstrativos. Nenhuma afiliação com marcas ou atletas profissionais é declarada.
