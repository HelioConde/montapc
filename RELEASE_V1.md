# MontaPC — encerramento técnico v1.0

**Revisão:** 09/10/2026  
**Estado:** núcleo funcional desenvolvido e **pronto para beta controlado**; Browser E2E, Static QA, Live Update e deploy aprovados em 09/10/2026. Homologação com contas e montagens reais permanece pendente. Não confundir referências de preço com ofertas reais de lojas.

## Produto implementado

- [x] Montagem por orçamento, uso, resolução e estratégia.
- [x] Verificação de socket, DDR, conectores de fonte, potência, gabinete, GPU, cooler, AIO, slots M.2/SATA e demais limites informados.
- [x] Explicação por peça, alternativas compatíveis e opções para economizar ou melhorar CPU/GPU.
- [x] Comparador de configurações com desempenho **estimado por modelo interno** (não benchmark medido).
- [x] Catálogo com 65 componentes de referência e snapshot local para indisponibilidade do banco.
- [x] Busca de peças, filtros, detalhe de componentes, histórico de preço **quando houver dados reais**.
- [x] Salvar, duplicar, compartilhar, exportar, imprimir; sincronização opcional autenticada.
- [x] PT-BR principal e EN; layout mobile/desktop, imagens, SEO, manifest, analytics e consentimento.
- [x] Espaços de anúncios existentes, **sem AdSense ativo** até aprovação e IDs reais.

## Correções críticas — 09/10/2026

- [x] Corrigido o E2E mobile: o painel de peças é intencionalmente recolhido no celular; o teste agora expande antes de verificar a explicação e os botões de alternativas.
- [x] Removido o job redundante que tentava escrever `version.json` em `main`, causando conflitos durante commits concorrentes. O workflow de GitHub Pages já carimba o SHA publicado na versão entregue.
- [x] Service worker alterado para `montapc-v3`: preserva caches dos demais projetos hospedados em `helioconde.github.io`, não captura requisições de outras pastas, não armazena links de montagens com parâmetros e oferece shell + catálogo offline.
- [x] Live updater agora atualiza somente seu próprio escopo e remove somente caches do MontaPC.
- [x] Novos testes automáticos desktop/mobile para isolamento de cache, URLs pessoais, upgrade do service worker e uso do catálogo offline.
- [x] Package version alinhada a `1.0.0`, QA estático passa a exigir novos testes e migration auditável.

## Banco — mudança aplicada e verificada

**Supabase compartilhado:** `pizzaria-db` (`bnlvvsjgpywpbfhwdcan`). Sem alterar tabelas de outros produtos.

- [x] Seis tabelas `montapc_*` com RLS habilitada.
- [x] Patch do repositório `supabase/sql/montapc_security_hardening.sql` aplicado como migration remota **`20261009141528_montapc_owner_build_items_and_least_privilege`**.
- [x] Grants reduzidos ao necessário: catálogo e histórico público somente leitura; build e itens com consulta pública onde permitido por política e gravação somente para autenticados; eventos/feedback somente inserção.
- [x] Policies `montapc build items owner insert/update` exigem `user_id=auth.uid()` e que o `build_id` corresponda a uma build do próprio usuário.
- [x] Verificação pós-migration com SQL confirmou os grants e o conteúdo das policies.
- [x] Advisors de segurança do Supabase sem alertas específicos MontaPC.

Arquivo reproduzível: [migration aplicada](supabase/migrations/20261009141528_montapc_owner_build_items_and_least_privilege.sql).

## Evidências do GitHub

- [QA estático da revisão](https://github.com/HelioConde/montapc/actions/runs/37943157289).
- [Live Update QA da revisão](https://github.com/HelioConde/montapc/actions/runs/37943156891).
- [Verificação do contrato de versão](https://github.com/HelioConde/montapc/actions/runs/37943156866).
- [Browser E2E — **14 de 14 testes aprovados**](https://github.com/HelioConde/montapc/actions/runs/37943157113).
- [GitHub Pages — **publicação aprovada**](https://github.com/HelioConde/montapc/actions/runs/37943157089).
- [Screenshots automatizados anteriores](https://github.com/HelioConde/montapc/actions/runs/37600414411).

## Dependências externas e aceite com pessoas reais

- [x] Browser E2E desktop e mobile **14/14 aprovado** após as correções.
- [ ] Conferir publicação final e capturas novas desktop/mobile após deploy.
- [ ] Validar login do Supabase, migração local → conta, sincronização em dois dispositivos e isolamento entre dois usuários reais.
- [ ] Submeter builds reais extremas (orçamento muito baixo, GPU de três slots, 12VHPWR/12V-2x6, AIO grande, BIOS antiga) à validação manual com SKUs reais.
- [ ] Integrar fonte confiável/licenciada de preços e disponibilidade antes de chamar preço de loja/estoque atual.
- [ ] Ativar afiliados/AdSense **apenas após aprovação**, consentimento e identificação clara de links patrocinados.
- [ ] Medir feedback real antes de alterar os pesos do algoritmo.

**Regra de manutenção:** congelar novas funcionalidades até existir bug P0/P1, falha de segurança/compliance ou evidência real de problema nas recomendações. O resultado do algoritmo é uma estimativa; nunca substitui a ficha técnica do fabricante.

Site: https://helioconde.github.io/montapc/  
Repositório: https://github.com/HelioConde/montapc
