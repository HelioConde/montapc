# MontaPC

Montador de PCs por orçamento com recomendação, comparação e verificações explicáveis de compatibilidade.

## Estado atual

> **MontaPC 1.0: desenvolvimento principal concluído em 09/10/2026.** Browser E2E **14/14**, QA estático, atualizador e deploy aprovados. Pronto para **beta controlado**, mantendo homologação com usuários e SKUs reais pendente. Consulte o [relatório de lançamento técnico](RELEASE_V1.md).

O MontaPC já permite:

- gerar uma build por orçamento, uso, resolução e estratégia;
- explicar por que cada peça foi escolhida;
- trocar peças manualmente e mostrar conflitos;
- sugerir alternativas equivalentes que continuam compatíveis;
- procurar uma troca mais barata preservando desempenho semelhante;
- comparar duas builds;
- estimar desempenho relativo por jogo/preset;
- salvar localmente ou sincronizar pela conta;
- compartilhar, duplicar, renomear, favoritar e exportar builds;
- explorar o catálogo por busca, tipo, marca e preço;
- usar PT-BR ou inglês;
- continuar montando mesmo se o catálogo online falhar, através de snapshot local.

## Catálogo

Fonte principal: `pizzaria-db/public.montapc_components`.

Estado confirmado em 07/10/2026:

- **65 componentes ativos**;
- 17 CPUs;
- 12 GPUs;
- 11 placas-mãe;
- 6 memórias;
- 6 SSDs;
- 5 fontes;
- 4 gabinetes;
- 4 coolers.

O repositório mantém `catalog.snapshot.json` como fallback do último catálogo conhecido. Supabase continua sendo a fonte principal.

## Compatibilidade

O motor cobre, quando os metadados estão disponíveis:

- socket e família da CPU;
- DDR e limites/módulos de memória;
- placa-mãe × gabinete;
- GPU × comprimento/slots do gabinete;
- cooler × socket/altura;
- RAM × clearance do cooler;
- AIO/radiador × gabinete;
- potência e conectores da fonte;
- PCIe 6+2, 12VHPWR e 12V-2x6;
- slots M.2 e SATA;
- USB headers frontais;
- compatibilidade/alerta de BIOS;
- versão PCIe, com retrocompatibilidade tratada como aviso.

Confirme sempre o SKU exato antes da compra.

## Stack

- HTML/CSS/JavaScript
- Supabase Auth + banco compartilhado `pizzaria-db`
- RLS nos dados privados
- GitHub Pages
- GitHub Actions + Playwright desktop/mobile
- PWA + service worker
- atualização automática por `version.json` / `live-update.js`

## Segurança

O navegador usa somente a publishable key do Supabase. Nunca use `service_role` ou secret key no frontend.

A auditoria de segurança gerou `supabase/sql/montapc_security_hardening.sql`, aplicado no Supabase em 09/10/2026 como migration `20261009141528_montapc_owner_build_items_and_least_privilege`, que:

- reduz os grants de `anon`/`authenticated` ao mínimo usado pela interface;
- reforça que `montapc_build_items.build_id` precisa apontar para uma build do mesmo usuário.

Os grants e policies foram verificados via SQL após a aplicação. **Ainda falta** um teste manual com duas contas autenticadas para verificar isolamento ponta a ponta.

## QA automatizado

O Browser E2E cobre:

- desktop Chromium;
- viewport mobile;
- geração por orçamento;
- troca manual;
- conflito de compatibilidade;
- salvamento local;
- PT-BR/EN e persistência;
- filtros do catálogo;
- orçamento mínimo/extremo;
- explicações por peça e alternativas equivalentes;
- fallback do catálogo sem Supabase/CDN.

## Gate antes de encerrar o MVP

- [x] núcleo do gerador;
- [x] catálogo amplo de referência;
- [x] compatibilidade avançada;
- [x] explicação por peça;
- [x] alternativas equivalentes;
- [x] comparação e desempenho;
- [x] salvamento local/compartilhamento;
- [x] PT-BR/EN;
- [x] PWA/SEO/analytics base;
- [x] Browser E2E desktop/mobile;
- [x] aplicar e verificar o hardening de grants/policies RLS no `pizzaria-db`;
- [ ] validar Auth + nuvem + importação local → conta com duas contas reais;
- [x] Browser E2E (14/14), Static QA, Live Update QA e deploy GitHub Pages aprovados em 09/10/2026;
- [ ] corrigir qualquer P0/P1 encontrado nessa rodada.

Preço real/afiliados e histórico alimentado por uma fonte comercial não bloqueiam este MVP e só entram depois de uma integração permitida e validada.

## Deploy

https://helioconde.github.io/montapc/

Veja `FULLSTACK.md`, `CATALOG.md`, `ROADMAP.md` e as GitHub Issues para os detalhes.
