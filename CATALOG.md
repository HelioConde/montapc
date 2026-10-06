# Catálogo inicial do MontaPC

Atualizado em 2026-10-06.

O catálogo inicial serve para validar o gerador e o motor de compatibilidade. Os preços são referências internas, não ofertas ao vivo.

## Cobertura atual

| Categoria | Quantidade | O que o motor usa |
|---|---:|---|
| CPU | 4 | socket, TDP, cooler incluso, score |
| Placa-mãe | 3 | socket, DDR4/DDR5, formato, M.2 |
| GPU | 4 | TDP, VRAM, comprimento de referência, PSU recomendada, score |
| Memória | 3 | DDR4/DDR5, capacidade, velocidade |
| SSD | 3 | capacidade, interface, score |
| Fonte | 3 | potência, eficiência, modularidade |
| Gabinete | 2 | formatos aceitos, GPU máxima, cooler máximo |
| Cooler | 1 | sockets aceitos e altura |

## Regra importante

`specs.price_kind = "reference_estimate"` e `specs.price_live = false` deixam explícito no banco que os valores não são preços atuais de varejo.

Nenhum item possui `affiliate_url` nesta fase.

## Compatibilidade

O frontend verifica:
1. CPU ↔ placa-mãe por socket;
2. placa-mãe ↔ RAM por geração;
3. placa-mãe ↔ gabinete por formato;
4. GPU ↔ gabinete por comprimento de referência;
5. CPU ↔ cooler por socket;
6. cooler ↔ gabinete por altura;
7. fonte ↔ carga estimada e recomendação mínima da GPU.

Dimensões físicas precisam ser confirmadas no SKU exato antes de uma compra real.
