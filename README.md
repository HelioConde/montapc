<div align="center">
  <h1>🖥️ MontaPC</h1>
  <p><strong>Monte, compare e compartilhe PCs com alertas de compatibilidade explicados peça por peça.</strong></p>
  <p><img alt="Beta controlado" src="https://img.shields.io/badge/status-beta%20controlado-64748b"> <img alt="Aplicativo web" src="https://img.shields.io/badge/aplicativo-web-2563eb"></p>
  <p><a href="https://helioconde.github.io/montapc/"><strong>Abrir MontaPC</strong></a> · <a href="CATALOG.md"><strong>Catálogo</strong></a> · <a href="RELEASE_V1.md"><strong>Relatório técnico</strong></a></p>
</div>

---

## Um PC completo, não apenas uma lista de preços

O **MontaPC** reúne escolha de componentes e análise de compatibilidade. A partir de um orçamento e perfil de uso, permite gerar uma configuração, substituir peças, comparar alternativas e salvar as montagens.

O objetivo é explicar **por que** uma combinação pode ou não funcionar, ajudando o usuário a revisar sua escolha antes da compra.

## Comece por aqui

1. Informe orçamento, uso pretendido e resolução de referência.
2. Explore a configuração sugerida e os motivos de cada escolha.
3. Troque componentes e observe alertas de compatibilidade.
4. Compare duas configurações e salve ou compartilhe a preferida.
5. Confira as fichas técnicas **oficiais** de cada peça antes de comprar.

| Recurso | Descrição |
| --- | --- |
| **Assistente** | Sugestões por orçamento e perfil |
| **Personalização** | Troca de peças e alternativas |
| **Compatibilidade** | Socket, RAM, gabinete, GPU, fonte, conectores e BIOS conforme dados |
| **Comparação** | Duas builds lado a lado |
| **Catálogo** | Integração Supabase com snapshot local de contingência |
| **Compartilhamento** | Histórico, favoritos e exportação quando disponíveis |
| **Acesso** | Modo local e conta opcional para sincronização |

### Limites importantes

- **Preço, estoque e SKU** precisam ser conferidos na loja no momento da compra.
- A compatibilidade depende da qualidade dos metadados cadastrados; uma ausência de alerta **não garante** montagem física possível.
- Estimativas de desempenho são **relativas**, não benchmarks medidos em cada PC.
- Versões de BIOS, dimensões e conectores devem ser confirmadas junto ao fabricante.

## Tecnologias

HTML, CSS, JavaScript, Supabase Auth, PostgreSQL, RLS e GitHub Pages, com PWA e testes automatizados de navegador.

O catálogo foi documentado com um conjunto inicial de componentes e snapshot em `catalog.snapshot.json`. Esse recorte representa um **estado histórico**, não uma contagem em tempo real de peças disponíveis.

## Rodar no computador

```bash
git clone https://github.com/HelioConde/montapc.git
cd montapc
python -m http.server 8000
```

Abra `http://localhost:8000`. Para verificações de código e de interface declaradas no `package.json`:

```bash
npm install
npm run check
npx playwright install
npm run test:e2e
```

O frontend pode apresentar o catálogo local quando o serviço remoto não está disponível. A sincronização de montagens depende de Supabase e permissões corretamente configuradas.

## Status e documentação

**v1.0 — MVP técnico concluído para beta controlado.** A homologação de SKUs reais, preços e experiência em diferentes dispositivos ainda exige validação externa.

[Catálogo e proveniência](CATALOG.md) · [Relatório de versão](RELEASE_V1.md) · [Detalhes técnicos e histórico](docs/README_HISTORY_2026-10-27.md)

**Antes de comprar:** verifique manualmente CPU/placa-mãe, tipo de memória, BIOS, tamanho da GPU, altura do cooler, fonte, cabos e espaço do gabinete.

---

<div align="center"><strong>Desenvolvido por <a href="https://github.com/HelioConde">Hélio Conde</a></strong></div>
