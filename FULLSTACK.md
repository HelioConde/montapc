# MontaPC — arquitetura fullstack

Repositório oficial: `HelioConde/montapc`.

## Produto

Montador de PC por orçamento com recomendação automática, troca manual de peças, alternativas equivalentes, comparação e compatibilidade explicada.

## Backend compartilhado

Supabase `pizzaria-db`.

Tabelas usadas:

- `montapc_components`: catálogo público;
- `montapc_builds`: builds do usuário + builds públicas quando explicitamente compartilhadas;
- `montapc_build_items`: peças ligadas à build;
- `montapc_price_snapshots`: estrutura read-only para preços observados;
- `montapc_events`: analytics;
- `montapc_feedback`: feedback do produto.

RLS está habilitada. O patch `supabase/sql/montapc_security_hardening.sql` fecha o vínculo de ownership em `montapc_build_items` e reduz grants de navegador ao mínimo necessário.

## Catálogo

Em 07/10/2026 o banco possui **65 componentes ativos**:

| Tipo | Total |
|---|---:|
| CPU | 17 |
| GPU | 12 |
| Placa-mãe | 11 |
| Memória | 6 |
| SSD | 6 |
| Fonte | 5 |
| Gabinete | 4 |
| Cooler | 4 |

Cobertura inclui AMD/Intel, AMD/NVIDIA/Intel GPUs, AM4/AM5/LGA1700/LGA1851, DDR4/DDR5, NVMe/SATA e ATX/mATX/Mini-ITX.

`catalog.snapshot.json` replica o conjunto ativo como fallback. O carregamento é Supabase primeiro → snapshot local em falha.

## Implementado

### Montador

- geração por orçamento;
- perfis de jogos, competitivo, AAA, streaming, edição, programação, 3D, IA local, escritório, produtividade e uso misto;
- 1080p/1440p/4K;
- equilíbrio, FPS, upgrade, economia, CPU e eficiência/ruído;
- penalidade de gasto sem ganho proporcional;
- detecção de desequilíbrio CPU/GPU;
- ação para manter desempenho gastando menos.

### Compatibilidade

- CPU/socket/família;
- aviso de BIOS;
- DDR, capacidade e módulos;
- placa-mãe × gabinete;
- GPU comprimento/slots;
- cooler/socket/altura;
- RAM × clearance;
- AIO/radiador;
- potência de fonte;
- PCIe 6+2, 12VHPWR/12V-2x6 e contagem de conectores;
- M.2/SATA;
- USB headers;
- PCIe GPU/placa-mãe.

### Explicabilidade

- resumo “por que esta build”;
- justificativa em cada peça;
- até duas alternativas equivalentes por peça, filtradas novamente pelo motor de compatibilidade;
- pontos fortes e pontos de atenção no catálogo.

### Reutilização

- salvamento local;
- Supabase Auth e sincronização;
- importação local → conta;
- renomear, duplicar, favoritar;
- pública/privada;
- link compartilhável;
- exportar TXT/imagem;
- imprimir/PDF;
- comparar duas builds, inclusive consumo, desempenho e upgrade.

### Produto/infra

- PT-BR padrão + EN;
- SEO, hreflang, Open Graph, Twitter card e JSON-LD;
- robots + sitemap;
- PWA com instalação/offline;
- analytics;
- slots de anúncios desativados por padrão;
- live update;
- GitHub Pages;
- QA Playwright desktop/mobile.

## Preços

`specs.price_kind = "reference_estimate"` e `price_live = false` identificam o catálogo de referência.

A interface já suporta `montapc_price_snapshots` e consegue mostrar loja, data, estoque, mínimo, média, variação e histórico. **A tabela está vazia no ambiente atual**, portanto não há preço comercial ativo. Essa ingestão fica para depois do MVP.

## Segurança

- frontend: somente publishable key;
- nenhum `service_role` no repositório público;
- RLS em todas as tabelas MontaPC;
- builds públicas são leitura explícita; privadas continuam por owner;
- patch de hardening pendente de aplicação/validação em produção.

## Gate de saída

- [x] fluxo local ponta a ponta;
- [x] compatibilidade avançada;
- [x] algoritmo e explicabilidade;
- [x] Browser E2E desktop/mobile;
- [x] fallback de catálogo;
- [x] PT-BR/EN;
- [x] PWA/SEO/analytics;
- [ ] aplicar `supabase/sql/montapc_security_hardening.sql`;
- [ ] validar isolamento RLS A ≠ B;
- [ ] validar Auth, nuvem e importação com contas reais;
- [ ] confirmar CI/Pages verdes;
- [ ] corrigir P0/P1 eventualmente encontrados.

Depois disso, congelar features do MVP. Preços comerciais, afiliados, rotas SEO por componente e histórico de alterações ficam para V2/integrações futuras.

## Gestão do backlog

- `ROADMAP.md` é a fonte operacional;
- Issues #1–#12 registram gates;
- não reabrir itens já implementados sem regressão ou feedback real.
