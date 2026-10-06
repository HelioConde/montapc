-- MontaPC: catálogo inicial para validar o motor de compatibilidade.
-- Valores são referências internas, não preços de varejo em tempo real.

create unique index if not exists montapc_components_type_brand_model_uidx
  on public.montapc_components(component_type, brand, model);

insert into public.montapc_components
  (component_type, brand, model, socket, tdp_watts, price_cents, specs, affiliate_url, active)
values
  ('cpu','AMD','Ryzen 5 5600','AM4',65,69900,
    '{"cores":6,"threads":12,"cooler_included":true,"performance_score":68,"memory_type":"DDR4","price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('cpu','Intel','Core i5-12400F','LGA1700',65,79900,
    '{"cores":6,"threads":12,"cooler_included":true,"performance_score":72,"memory_type":"DDR4_DDR5","price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('cpu','AMD','Ryzen 5 7600','AM5',65,119900,
    '{"cores":6,"threads":12,"cooler_included":true,"performance_score":84,"memory_type":"DDR5","price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('cpu','AMD','Ryzen 7 7800X3D','AM5',120,239900,
    '{"cores":8,"threads":16,"cooler_included":false,"performance_score":100,"memory_type":"DDR5","price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),

  ('motherboard','Gigabyte','B550M DS3H','AM4',35,64900,
    '{"memory_type":"DDR4","form_factor":"mATX","m2_slots":2,"max_memory_gb":128,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('motherboard','Gigabyte','B760M DS3H DDR4','LGA1700',40,89900,
    '{"memory_type":"DDR4","form_factor":"mATX","m2_slots":2,"max_memory_gb":128,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('motherboard','Gigabyte','B650M D3HP','AM5',45,94900,
    '{"memory_type":"DDR5","form_factor":"mATX","m2_slots":2,"max_memory_gb":192,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),

  ('gpu','AMD','Radeon RX 6600 8GB',null,132,139900,
    '{"vram_gb":8,"length_mm":269,"recommended_psu_watts":500,"performance_score":52,"tier":"1080p","price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('gpu','NVIDIA','GeForce RTX 4060 8GB',null,115,209900,
    '{"vram_gb":8,"length_mm":250,"recommended_psu_watts":550,"performance_score":65,"tier":"1080p_high","price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('gpu','AMD','Radeon RX 7800 XT 16GB',null,263,359900,
    '{"vram_gb":16,"length_mm":320,"recommended_psu_watts":700,"performance_score":90,"tier":"1440p_high","price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('gpu','NVIDIA','GeForce RTX 4070 SUPER 12GB',null,220,409900,
    '{"vram_gb":12,"length_mm":300,"recommended_psu_watts":650,"performance_score":94,"tier":"1440p_high","price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),

  ('memory','Kingston','Fury Beast 16GB (2x8) DDR4-3200',null,8,29900,
    '{"memory_type":"DDR4","capacity_gb":16,"modules":2,"speed_mt":3200,"performance_score":55,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('memory','Kingston','Fury Beast 32GB (2x16) DDR4-3200',null,10,52900,
    '{"memory_type":"DDR4","capacity_gb":32,"modules":2,"speed_mt":3200,"performance_score":75,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('memory','Kingston','Fury Beast 32GB (2x16) DDR5-6000',null,10,69900,
    '{"memory_type":"DDR5","capacity_gb":32,"modules":2,"speed_mt":6000,"performance_score":90,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),

  ('storage','Kingston','NV3 1TB NVMe',null,5,37900,
    '{"interface":"NVMe","capacity_gb":1000,"performance_score":70,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('storage','WD','Black SN770 1TB NVMe',null,5,49900,
    '{"interface":"NVMe","capacity_gb":1000,"performance_score":88,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('storage','Kingston','NV3 2TB NVMe',null,6,69900,
    '{"interface":"NVMe","capacity_gb":2000,"performance_score":78,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),

  ('psu','MSI','MAG A550BN 550W',null,null,36900,
    '{"wattage":550,"efficiency":"80 Plus Bronze","modular":false,"performance_score":55,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('psu','MSI','MAG A650BN 650W',null,null,44900,
    '{"wattage":650,"efficiency":"80 Plus Bronze","modular":false,"performance_score":70,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('psu','Corsair','RM750e 750W',null,null,69900,
    '{"wattage":750,"efficiency":"80 Plus Gold","modular":true,"performance_score":92,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),

  ('case','Montech','Air 100 Lite',null,null,32900,
    '{"form_factors":["mATX","Mini-ITX"],"max_gpu_mm":330,"max_cooler_mm":161,"performance_score":65,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('case','Montech','Air 903 Base',null,null,46900,
    '{"form_factors":["ATX","mATX","Mini-ITX"],"max_gpu_mm":400,"max_cooler_mm":180,"performance_score":85,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),

  ('cooler','DeepCool','AG400',null,5,18900,
    '{"supported_sockets":["AM4","AM5","LGA1700"],"height_mm":150,"performance_score":75,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true)
on conflict (component_type, brand, model) do update
set socket=excluded.socket,
    tdp_watts=excluded.tdp_watts,
    price_cents=excluded.price_cents,
    specs=excluded.specs,
    affiliate_url=excluded.affiliate_url,
    active=excluded.active;
