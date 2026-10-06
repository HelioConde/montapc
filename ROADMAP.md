# MontaPC — Roadmap

Este roadmap organiza o trabalho restante do MontaPC em fases executáveis. A regra é concluir os blocos de maior risco técnico antes de ampliar monetização.

## P0 — Estabilizar produção

- [x] Confirmar GitHub Pages funcionando em `https://helioconde.github.io/montapc/`
- [x] Testar caminhos relativos, cache e carregamento do Supabase
- [ ] Executar QA completo de geração, troca de peças, incompatibilidades, salvamento local/nuvem, autenticação, importação e i18n
- [x] Validar desktop e mobile
- [x] Garantir que PT-BR continue sendo padrão/fallback e EN secundário

## P1 — Catálogo e compatibilidade

- [ ] Ampliar catálogo com mais CPUs AMD/Intel
- [ ] Ampliar catálogo com GPUs AMD/NVIDIA/Intel
- [ ] Mais placas-mãe, RAM, SSDs, fontes, gabinetes e coolers
- [ ] ATX, mATX e Mini-ITX
- [ ] AM4, AM5, LGA1700 e novas plataformas conforme catálogo
- [ ] PCIe, 12VHPWR/12V-2x6 e conectores da fonte
- [x] Slots M.2/SATA (motor + metadados iniciais)
- [x] RAM máxima, quantidade de módulos e geração DDR
- [ ] Altura de RAM × cooler
- [ ] Radiador × gabinete
- [ ] Water cooler × socket
- [ ] Comprimento/espessura da GPU e slots ocupados
- [ ] USB headers e compatibilidade de BIOS quando aplicável

## P1 — Algoritmo de recomendação

- [ ] Reduzir gasto sem ganho real
- [ ] Detectar gargalo CPU/GPU
- [ ] Melhorar pesos por resolução e uso
- [ ] Considerar upgrade futuro
- [ ] Gerar alternativas equivalentes
- [ ] Explicar por que cada peça foi escolhida
- [ ] Perfis: competitivo, AAA, streaming, edição, programação, 3D, IA local, escritório, econômico e silencioso

## P2 — Desempenho e comparação

- [ ] Estimativa de FPS por jogo
- [ ] 1080p / 1440p / 4K
- [ ] Qualidade baixa/média/alta/ultra
- [ ] Metodologia explícita
- [x] Comparar duas builds lado a lado
- [ ] Diferença de preço, CPU, GPU, RAM, armazenamento, consumo, upgrade e desempenho (comparador base pronto; consumo/desempenho pendentes)
- [ ] Ações: economizar, melhorar GPU, melhorar CPU, preparar upgrade e manter desempenho gastando menos

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
- [ ] Imagens dos componentes
- [x] Chips técnicos: socket, DDR, potência, VRAM etc.
- [ ] Pontos fortes/fracos
- [ ] Filtros por marca e preço
- [ ] Página própria de componente
- [ ] Busca por componente
- [ ] Compartilhamento de build por URL
- [ ] Exportação em texto e, depois, imagem/PDF
- [ ] Duplicar, renomear, favoritar e controlar visibilidade de builds

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
- [ ] Testes automatizados para compatibilidade, auth, persistência e i18n (smoke de compatibilidade/persistência/i18n pronto; auth pendente)

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
