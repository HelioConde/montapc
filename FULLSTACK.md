# MontaPC — arquitetura fullstack

Repositório individual planejado: `HelioConde/montapc`.

## Produto

Montador de PC por orçamento com recomendação automática, troca manual de peças e explicações de compatibilidade.

## Backend compartilhado

Supabase `pizzaria-db`.

Tabelas:
- `montapc_components`: catálogo público de peças.
- `montapc_builds`: builds privadas do usuário.
- `montapc_build_items`: componentes ligados à build.
- `product_subscriptions`: legado compartilhado; não é usado para cobrar o MontaPC.

O catálogo é leitura pública; builds e itens pertencem ao usuário e são protegidos por RLS.

## Implementado

- catálogo inicial com 23 peças;
- preços internos marcados como `reference_estimate`, nunca como preço ao vivo;
- CPUs AM4, AM5 e LGA1700;
- placas-mãe DDR4/DDR5;
- GPUs para faixas 1080p/1440p;
- RAM, SSD, fontes, gabinetes e cooler;
- geração automática por orçamento;
- perfis Jogos, Produtividade e Uso misto;
- alvos 1080p, 1440p e 4K;
- estratégias Equilíbrio, FPS, Upgrade e Economia;
- verificação explicada de socket;
- verificação DDR4/DDR5;
- verificação formato placa-mãe/gabinete;
- verificação de comprimento de GPU de referência;
- verificação altura do cooler;
- detecção de CPU que precisa de cooler separado;
- cálculo de potência mínima recomendada para a fonte;
- ajuste manual de qualquer componente;
- salvamento local sem conta;
- Supabase Auth;
- salvamento de build e itens na nuvem;
- abertura e exclusão de builds;
- importação local → conta;
- migração dos rascunhos do protótipo antigo;
- UI própria responsiva;
- atualização de versão em tempo real;
- CI dedicado;
- infraestrutura de anúncios desacoplada e desativada por padrão.

## Idiomas

Regra obrigatória para o produto:
- `pt-BR`: principal, padrão e fallback;
- `en`: secundário obrigatório;
- textos estáticos, mensagens dinâmicas, erros, estados, autenticação, metadados e SEO devem existir nos dois idiomas;
- a escolha do usuário deve persistir localmente;
- ausência de chave em inglês deve cair para PT-BR, nunca exibir chave técnica.

## Regra de preço

Os valores atuais do catálogo são referências internas datadas e servem para validar o produto. O frontend mostra explicitamente que:

- não são preços de loja em tempo real;
- medidas físicas devem ser confirmadas para o SKU exato;
- nenhuma URL comercial é apresentada atualmente.

Quando houver integração comercial, preço ao vivo deve ficar separado do preço de referência, com fonte e data de atualização. Nenhuma remuneração pode alterar silenciosamente a ordem técnica das recomendações.

## Monetização

O MontaPC será gratuito e monetizado por anúncios.

Arquitetura:
- `ads-config.js`: configuração pública e chave geral de ativação;
- `ads.js`: montagem dos slots e carregamento opcional do provedor;
- slots publicitários não aparecem enquanto `enabled=false`;
- anúncios não podem interromper geração, troca de peça, validação, login ou salvamento;
- não usar intersticial entre entrada do orçamento e resultado;
- preferir posições após conteúdo útil e entre blocos naturais;
- conteúdo patrocinado futuro precisa ser rotulado explicitamente.

## Próximas entregas de produto

1. finalizar i18n PT-BR/EN na interface e mensagens dinâmicas;
2. ampliar catálogo com SKU exato e dimensões de fabricante;
3. placa-mãe ATX e Mini-ITX;
4. mais coolers e gabinetes;
5. conectores PCIe/12VHPWR;
6. slots M.2/SATA e clearance de radiador;
7. estimativa de desempenho por jogo com metodologia explícita;
8. alternativas equivalentes quando uma peça sair de estoque;
9. integração permitida com preços reais por loja e histórico de preço;
10. QA com usuários reais antes de ativar anúncios.

## QA obrigatório

- socket incompatível;
- DDR4 em placa DDR5 e vice-versa;
- fonte abaixo da recomendação;
- GPU maior que o gabinete;
- cooler obrigatório ausente;
- orçamento abaixo do mínimo;
- orçamento muito alto;
- preço ausente;
- componente inativo;
- exclusão e reabertura de build;
- isolamento RLS entre usuários;
- mobile;
- fallback PT-BR quando tradução EN faltar;
- persistência de idioma;
- ausência de layout quebrado com anúncios desligados;
- anúncios nunca bloquearem ações principais;
- transparência de preço estimado e conteúdo patrocinado.
