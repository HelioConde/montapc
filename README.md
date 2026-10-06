# MontaPC

Montador de PCs por orçamento com verificações explicáveis de compatibilidade.

## Proposta

Em poucos passos, o usuário informa orçamento, uso, resolução e prioridade. O MontaPC monta uma configuração, explica conflitos e permite trocar qualquer peça sem esconder o motivo de uma incompatibilidade.

## Stack

- HTML/CSS/JavaScript
- Supabase Auth + banco compartilhado `pizzaria-db`
- RLS nos dados privados
- GitHub Pages
- GitHub Actions

## Regras globais do produto

- PT-BR é o idioma principal, padrão e fallback.
- Inglês é obrigatório em todos os fluxos, mensagens, estados e SEO.
- O produto é gratuito e monetizado por anúncios.
- Anúncios nunca devem bloquear geração, comparação, compatibilidade ou salvamento.
- Slots publicitários ficam desativados até configuração/aprovação real.
- Links comerciais futuros devem ser transparentes e nunca alterar a recomendação por pagamento.

## Segurança

O navegador usa apenas a publishable key. Nunca use `service_role` no frontend.

## Deploy

URL: https://helioconde.github.io/montapc/

Veja `FULLSTACK.md` para arquitetura, QA e próximas etapas.


## Roadmap

O desenvolvimento ativo é organizado em [ROADMAP.md](ROADMAP.md) e nas [GitHub Issues](https://github.com/HelioConde/montapc/issues).

Prioridade atual:
1. estabilizar produção e GitHub Pages;
2. ampliar catálogo;
3. aprofundar compatibilidade;
4. melhorar algoritmo de recomendação;
5. adicionar comparação, desempenho, preços reais, SEO/PWA e monetização somente após QA.
