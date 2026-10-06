-- MontaPC: expansão do catálogo para plataformas atuais.
-- Especificações baseadas em páginas oficiais de AMD, Intel, NVIDIA e GIGABYTE.
-- Preços são referências internas observadas no varejo brasileiro em 2026-10-06,
-- não são preços ao vivo e não substituem montapc_price_snapshots.

insert into public.montapc_components
  (component_type, brand, model, socket, tdp_watts, price_cents, specs, affiliate_url, active)
values
  ('cpu','AMD','Ryzen 5 9600X','AM5',65,129999,
    '{"cores":6,"threads":12,"cooler_included":false,"performance_score":90,"family":"Ryzen 9000","memory_type":"DDR5","pcie_version":5,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false,"spec_source":"https://www.amd.com/pt/products/processors/desktops/ryzen/9000-series/amd-ryzen-5-9600x.html"}'::jsonb,null,true),
  ('cpu','AMD','Ryzen 7 9700X','AM5',65,189999,
    '{"cores":8,"threads":16,"cooler_included":false,"performance_score":96,"family":"Ryzen 9000","memory_type":"DDR5","pcie_version":5,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false,"spec_source":"https://www.amd.com/pt/products/processors/desktops/ryzen/9000-series/amd-ryzen-7-9700x.html"}'::jsonb,null,true),
  ('cpu','Intel','Core Ultra 5 245K','LGA1851',125,263060,
    '{"cores":14,"threads":14,"cooler_included":false,"performance_score":94,"family":"Intel Core Ultra Series 2","memory_type":"DDR5","price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false,"spec_source":"https://www.intel.com/content/www/us/en/products/sku/241067/intel-core-ultra-5-processor-245k-24m-cache-up-to-5-20-ghz/specifications.html"}'::jsonb,null,true),

  ('motherboard','Gigabyte','B850M DS3H','AM5',45,99999,
    '{"memory_type":"DDR5","form_factor":"mATX","m2_slots":2,"sata_ports":4,"memory_slots":4,"max_memory_gb":256,"pcie_x16_version":5,"supported_cpu_families":["Ryzen 7000","Ryzen 8000","Ryzen 9000"],"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false,"spec_source":"https://www.gigabyte.com/br/Motherboard/B850M-DS3H-rev-10/sp"}'::jsonb,null,true),
  ('motherboard','Gigabyte','B860M DS3H','LGA1851',45,148499,
    '{"memory_type":"DDR5","form_factor":"mATX","m2_slots":2,"sata_ports":4,"memory_slots":4,"max_memory_gb":256,"pcie_x16_version":5,"supported_cpu_families":["Intel Core Ultra Series 2"],"usb_headers":["USB-C 3.2 Gen 1","USB 3.2 Gen 1","USB 2.0"],"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false,"spec_source":"https://www.gigabyte.com/br/Motherboard/B860M-DS3H-rev-22/sp"}'::jsonb,null,true),

  ('gpu','NVIDIA','GeForce RTX 5070 12GB',null,250,539999,
    '{"vram_gb":12,"length_mm":242,"slot_width":2,"recommended_psu_watts":650,"pcie_version":5,"performance_score":104,"tier":"1440p_ultra","price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false,"spec_source":"https://www.nvidia.com/pt-br/geforce/graphics-cards/50-series/rtx-5070-family/"}'::jsonb,null,true),
  ('gpu','AMD','Radeon RX 9070 XT 16GB',null,304,589999,
    '{"vram_gb":16,"recommended_psu_watts":750,"pcie_version":5,"performance_score":112,"tier":"1440p_ultra_4k","price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false,"spec_source":"https://www.amd.com/pt/products/graphics/desktops/radeon/9000-series/amd-radeon-rx-9070xt.html"}'::jsonb,null,true)
on conflict (component_type, brand, model) do update
set socket=excluded.socket,
    tdp_watts=excluded.tdp_watts,
    price_cents=excluded.price_cents,
    specs=excluded.specs,
    affiliate_url=excluded.affiliate_url,
    active=excluded.active;
