# MontaPC — Roadmap

Este roadmap organiza o trabalho restante do MontaPC em fases executáveis. A regra é concluir os blocos de maior risco técnico antes de ampliar monetização.

## Atualização operacional — 07/10/2026

- catálogo ativo real: **65 componentes**;
- fallback local versionado em `catalog.snapshot.json`;
- Browser E2E em desktop e mobile;
- QA no GitHub Actions;
- compatibilidade avançada já cobre PCIe, conectores de energia, slots físicos, radiador/AIO, RAM × cooler, USB headers e BIOS;
- vários itens P1/P2 antigos estavam implementados no código, mas ainda apareciam como pendentes neste arquivo.

## P0 — Estabilizar produção

- [x] Confirmar GitHub Pages funcionando em `https://helioconde.github.io/montapc/`
- [x] Testar caminhos relativos, cache e carregamento do Supabase
- [ ] Executar QA completo de geração, troca de peças, incompatibilidades, salvamento local/nuvem, autenticação, importação e i18n *(Browser E2E cobre geração/troca/conflito/local/i18n em desktop+mobile; auth/nuvem/importação reais ainda pendentes)*
- [x] Validar desktop e mobile
- [x] Garantir que PT-BR continue sendo padrão/fallback e EN secundário

## P1 — Catálogo e compatibilidade

- [x] Ampliar catálogo com mais CPUs AMD/Intel
- [x] Ampliar catálogo com GPUs AMD/NVIDIA/Intel
- [x] Mais placas-mãe, RAM, SSDs, fontes, gabinetes e coolers
- [x] ATX, mATX e Mini-ITX
- [x] AM4, AM5, LGA1700 e novas plataformas conforme catálogo
- [x] PCIe, 12VHPWR/12V-2x6 e conectores da fonte
- [x] Slots M.2/SATA (motor + metadados iniciais)
- [x] RAM máxima, quantidade de módulos e geração DDR
- [x] Altura de RAM × cooler
- [x] Radiador × gabinete
- [x] Water cooler × socket
- [x] Comprimento/espessura da GPU e slots ocupados
- [x] USB headers e compatibilidade de BIOS quando aplicável

## P1 — Algoritmo de recomendação

- [x] Reduzir gasto sem ganho real
- [x] Detectar gargalo CPU/GPU
- [x] Melhorar pesos por resolução e uso
- [x] Considerar upgrade futuro
- [ ] Gerar alternativas equivalentes
- [ ] Explicar por que cada peça foi escolhida
- [x] Perfis: competitivo, AAA, streaming, edição, programação, 3D, IA local, escritório, econômico e silencioso

## P2 — Desempenho e comparação

- [x] Estimativa de FPS por jogo
- [x] 1080p / 1440p / 4K
- [x] Qualidade baixa/média/alta/ultra
- [x] Metodologia explícita
- [x] Comparar duas builds lado a lado
- [x] Diferença de preço, CPU, GPU, RAM, armazenamento, consumo, upgrade e desempenho
- [ ] Ações: economizar, melhorar GPU, melhorar CPU e preparar upgrade já implementadas; falta uma ação dedicada a manter desempenho gastando menos

## P2 — Preço e comércio

- [ ] Separar preço de referência de preço ao vivo
- [ ] Integrações permitidas com lojas/APIs
- [ ] Mostrar loja e data de atualização
- [ ] Histórico de preços
- [ ] Menor preço, média e variação
- [ ] Detectar falta de estoque
- [ ] Links afiliados sempre identificados
- [ ] Nunca permitir que remuneração altere ranking técnico

## P2 — UX e conteúdo

- [x] Cards de peças mais visuais
- [x] Catálogo mobile compactado para navegação mais rápida
- [x] Atalhos de categorias mobile sem corte horizontal
- [x] Imagens dos componentes
- [x] Chips técnicos: socket, DDR, potência, VRAM etc.
- [x] Pontos fortes/fracos
- [x] Filtros por marca e preço
- [ ] Página própria de componente *(modal técnico detalhado e deep link já existem; rota indexável dedicada ainda pendente)*
- [x] Busca por componente
- [x] Compartilhamento de build por URL
- [x] Exportação em texto e, depois, imagem/PDF
- [x] Duplicar, renomear, favoritar e controlar visibilidade de builds

## P3 — Plataforma, segurança e SEO

- [ ] Revisar migrations, índices e RLS
- [ ] Validar isolamento entre usuários
- [ ] Nunca expor `service_role`
- [ ] Rate limiting em APIs próprias
- [x] sitemap.xml
- [x] robots.txt
- [x] Open Graph base
- [x] JSON-LD
- [ ] URLs amigáveis e indexação PT-BR/EN
- [x] PWA: manifest, ícone, instalação, cache e offline base
- [ ] Analytics de geração, orçamento, peças, troca manual, idioma e funil
- [x] Testes automatizados para compatibilidade, auth, persistência e i18n (smoke de compatibilidade/persistência/i18n pronto; auth pendente)

## P4 — Monetização e validação

- [ ] Manter anúncios desativados durante desenvolvimento
- [ ] Definir posições finais sem bloquear fluxo principal
- [ ] Configurar AdSense somente após conteúdo e QA
- [ ] Validar builds reais manualmente
- [ ] Comparar recomendações com montagens reais
- [ ] Testes com usuários
- [ ] Corrigir sugestões absurdas ou desequilibradas

## Ordem recomendada

1. Produção e QA
2. Catálogo
3. Compatibilidade avançada
4. Algoritmo
5. Comparador e estimativa de desempenho
6. Preços reais e histórico
7. UX, busca e compartilhamento
8. Segurança, SEO, PWA e analytics
9. Monetização
10. Validação com usuários
