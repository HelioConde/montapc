# Catálogo do MontaPC

Atualizado em 2026-10-07.

O catálogo serve ao gerador e ao motor de compatibilidade. Os preços continuam sendo **referências internas**, não ofertas ao vivo.

A fonte principal em produção é `pizzaria-db/public.montapc_components`. O repositório também mantém `catalog.snapshot.json` com o último catálogo ativo conhecido para manter o montador funcional se Supabase/CDN estiver temporariamente indisponível.

## Cobertura atual

| Categoria | Quantidade | Cobertura principal |
|---|---:|---|
| CPU | 17 | AMD e Intel; AM4, AM5, LGA1700 e LGA1851 |
| Placa-mãe | 11 | AMD/Intel; DDR4/DDR5; ATX, mATX e Mini-ITX |
| GPU | 12 | AMD, NVIDIA e Intel |
| Memória | 6 | DDR4/DDR5, 16/32/64 GB |
| SSD | 6 | NVMe e SATA; 1 TB e 2 TB |
| Fonte | 5 | 550–850 W; Bronze/Gold; PCIe e 12V-2x6 |
| Gabinete | 4 | ATX/mATX/Mini-ITX; limites físicos e radiadores |
| Cooler | 4 | air cooler e AIO; múltiplos sockets |

**Total ativo: 65 componentes.**

## Regra de preço

`specs.price_kind = "reference_estimate"` e `specs.price_live = false` deixam explícito que os valores não são preços atuais de varejo.

Preços observados, quando existirem em `montapc_price_snapshots`, são exibidos separadamente com loja e data. Nenhum ranking técnico pode ser alterado por remuneração.

## Compatibilidade implementada

O frontend verifica:

1. CPU ↔ placa-mãe por socket;
2. família de CPU ↔ suporte declarado da placa-mãe;
3. aviso de BIOS quando metadados indicarem atualização;
4. placa-mãe ↔ RAM por DDR;
5. capacidade máxima e quantidade de módulos RAM;
6. placa-mãe ↔ gabinete por formato;
7. GPU ↔ gabinete por comprimento e slots ocupados;
8. CPU ↔ cooler por socket;
9. cooler ↔ gabinete por altura;
10. RAM ↔ cooler por clearance quando disponível;
11. AIO/radiador ↔ suporte do gabinete;
12. fonte ↔ carga estimada e recomendação mínima da GPU;
13. conector de energia da GPU, incluindo PCIe 6+2 e 12VHPWR/12V-2x6;
14. quantidade de conectores PCIe da fonte;
15. NVMe ↔ slots M.2;
16. SATA ↔ portas SATA;
17. headers USB frontais do gabinete ↔ placa-mãe;
18. versão PCIe GPU ↔ slot principal da placa-mãe, com retrocompatibilidade tratada como aviso.

Dimensões e conectores ainda precisam ser confirmados no **SKU exato** antes de uma compra real.

## Resiliência

O carregamento segue:

1. catálogo ao vivo via Supabase;
2. se houver falha de SDK/API/rede, `catalog.snapshot.json`;
3. preços ao vivo/históricos permanecem opcionais e nunca impedem o gerador.

O snapshot de fallback foi gerado a partir dos 65 registros ativos do `pizzaria-db` em 07/10/2026.
