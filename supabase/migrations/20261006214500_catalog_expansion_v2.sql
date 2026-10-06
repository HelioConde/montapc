-- MontaPC: ampliar cobertura do catálogo e metadados para compatibilidade avançada.
-- Valores de preço são estimativas internas de referência, não preços ao vivo.

insert into public.montapc_components
  (component_type, brand, model, socket, tdp_watts, price_cents, specs, affiliate_url, active)
values
  ('cpu','AMD','Ryzen 5 5500','AM4',65,52900,
   '{"cores":6,"threads":12,"cooler_included":true,"performance_score":58,"family":"Ryzen 5000","memory_type":"DDR4","price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('cpu','AMD','Ryzen 7 5700X','AM4',65,89900,
   '{"cores":8,"threads":16,"cooler_included":false,"performance_score":76,"family":"Ryzen 5000","memory_type":"DDR4","price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('cpu','AMD','Ryzen 7 5700X3D','AM4',105,129900,
   '{"cores":8,"threads":16,"cooler_included":false,"performance_score":86,"family":"Ryzen 5000","memory_type":"DDR4","price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('cpu','AMD','Ryzen 5 7500F','AM5',65,99900,
   '{"cores":6,"threads":12,"cooler_included":false,"performance_score":80,"family":"Ryzen 7000","memory_type":"DDR5","pcie_version":5,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('cpu','AMD','Ryzen 7 7700','AM5',65,169900,
   '{"cores":8,"threads":16,"cooler_included":true,"performance_score":91,"family":"Ryzen 7000","memory_type":"DDR5","pcie_version":5,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('cpu','AMD','Ryzen 7 9800X3D','AM5',120,319900,
   '{"cores":8,"threads":16,"cooler_included":false,"performance_score":112,"family":"Ryzen 9000","memory_type":"DDR5","pcie_version":5,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('cpu','Intel','Core i3-12100F','LGA1700',58,59900,
   '{"cores":4,"threads":8,"cooler_included":true,"performance_score":58,"family":"Intel Core 12th Gen","memory_type":"DDR4_DDR5","price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('cpu','Intel','Core i5-13400F','LGA1700',65,109900,
   '{"cores":10,"threads":16,"cooler_included":true,"performance_score":82,"family":"Intel Core 13th Gen","memory_type":"DDR4_DDR5","price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('cpu','Intel','Core i5-14400F','LGA1700',65,129900,
   '{"cores":10,"threads":16,"cooler_included":true,"performance_score":86,"family":"Intel Core 14th Gen","memory_type":"DDR4_DDR5","price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('cpu','Intel','Core Ultra 7 265K','LGA1851',125,339900,
   '{"cores":20,"threads":20,"cooler_included":false,"performance_score":108,"family":"Intel Core Ultra Series 2","memory_type":"DDR5","price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),

  ('motherboard','MSI','B550M PRO-VDH WIFI','AM4',45,79900,
   '{"memory_type":"DDR4","form_factor":"mATX","m2_slots":2,"sata_ports":4,"memory_slots":4,"max_memory_gb":128,"pcie_x16_version":4,"supported_cpu_families":["Ryzen 3000","Ryzen 4000G","Ryzen 5000","Ryzen 5000G"],"usb_headers":["USB 3.2 Gen 1","USB 2.0"],"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('motherboard','ASUS','TUF Gaming B650M-PLUS WIFI','AM5',45,149900,
   '{"memory_type":"DDR5","form_factor":"mATX","m2_slots":2,"sata_ports":4,"memory_slots":4,"max_memory_gb":192,"pcie_x16_version":4,"supported_cpu_families":["Ryzen 7000","Ryzen 8000","Ryzen 9000"],"usb_headers":["USB-C 3.2 Gen 1","USB 3.2 Gen 1","USB 2.0"],"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('motherboard','MSI','PRO B760-P WIFI DDR4','LGA1700',45,119900,
   '{"memory_type":"DDR4","form_factor":"ATX","m2_slots":2,"sata_ports":4,"memory_slots":4,"max_memory_gb":128,"pcie_x16_version":4,"supported_cpu_families":["Intel Core 12th Gen","Intel Core 13th Gen","Intel Core 14th Gen"],"usb_headers":["USB-C 3.2 Gen 2","USB 3.2 Gen 1","USB 2.0"],"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('motherboard','ASUS','ROG Strix B860-I Gaming WIFI','LGA1851',45,239900,
   '{"memory_type":"DDR5","form_factor":"Mini-ITX","m2_slots":2,"sata_ports":2,"memory_slots":2,"max_memory_gb":128,"pcie_x16_version":5,"supported_cpu_families":["Intel Core Ultra Series 2"],"usb_headers":["USB-C 3.2 Gen 2","USB 3.2 Gen 1","USB 2.0"],"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),

  ('gpu','NVIDIA','GeForce RTX 3060 12GB',null,170,169900,
   '{"vram_gb":12,"length_mm":242,"slot_width":2,"recommended_psu_watts":550,"pcie_version":4,"power_connector":"PCIe 6+2","power_connector_count":1,"performance_score":58,"tier":"1080p_high","price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('gpu','NVIDIA','GeForce RTX 4060 Ti 16GB',null,165,289900,
   '{"vram_gb":16,"length_mm":272,"slot_width":2.2,"recommended_psu_watts":550,"pcie_version":4,"power_connector":"PCIe 6+2","power_connector_count":1,"performance_score":78,"tier":"1080p_ultra_1440p","price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('gpu','AMD','Radeon RX 7600 8GB',null,165,169900,
   '{"vram_gb":8,"length_mm":267,"slot_width":2,"recommended_psu_watts":550,"pcie_version":4,"power_connector":"PCIe 6+2","power_connector_count":1,"performance_score":62,"tier":"1080p_high","price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('gpu','AMD','Radeon RX 7900 GRE 16GB',null,260,399900,
   '{"vram_gb":16,"length_mm":320,"slot_width":2.5,"recommended_psu_watts":700,"pcie_version":4,"power_connector":"PCIe 6+2","power_connector_count":2,"performance_score":97,"tier":"1440p_ultra","price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('gpu','Intel','Arc A750 8GB',null,225,149900,
   '{"vram_gb":8,"length_mm":280,"slot_width":2,"recommended_psu_watts":600,"pcie_version":4,"power_connector":"PCIe 6+2","power_connector_count":2,"performance_score":56,"tier":"1080p","price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('gpu','Intel','Arc B580 12GB',null,190,219900,
   '{"vram_gb":12,"length_mm":272,"slot_width":2,"recommended_psu_watts":600,"pcie_version":4,"power_connector":"PCIe 6+2","power_connector_count":1,"performance_score":70,"tier":"1080p_ultra_1440p","price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),

  ('memory','Kingston','Fury Beast 16GB (2x8) DDR5-6000',null,8,39900,
   '{"modules":2,"speed_mt":6000,"capacity_gb":16,"memory_type":"DDR5","height_mm":34,"performance_score":72,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('memory','Kingston','Fury Beast 64GB (2x32) DDR5-6000',null,12,129900,
   '{"modules":2,"speed_mt":6000,"capacity_gb":64,"memory_type":"DDR5","height_mm":34,"performance_score":98,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('memory','Corsair','Vengeance 32GB (2x16) DDR5-5600',null,10,62900,
   '{"modules":2,"speed_mt":5600,"capacity_gb":32,"memory_type":"DDR5","height_mm":35,"performance_score":84,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),

  ('storage','Crucial','P3 Plus 1TB NVMe',null,5,39900,
   '{"capacity_gb":1000,"interface":"NVMe","pcie_version":4,"performance_score":74,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('storage','Samsung','990 EVO Plus 2TB NVMe',null,6,89900,
   '{"capacity_gb":2000,"interface":"NVMe","pcie_version":4,"performance_score":95,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('storage','Crucial','BX500 1TB SATA',null,4,34900,
   '{"capacity_gb":1000,"interface":"SATA","performance_score":48,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),

  ('psu','MSI','MAG A750GL PCIE5 750W',null,0,59900,
   '{"wattage":750,"efficiency":"80 Plus Gold","modular":true,"connectors":["PCIe 6+2","12V-2x6"],"pcie_connector_count":3,"sata_connector_count":8,"atx_version":"3.0","performance_score":90,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('psu','Corsair','RM850e 850W',null,0,79900,
   '{"wattage":850,"efficiency":"80 Plus Gold","modular":true,"connectors":["PCIe 6+2","12V-2x6"],"pcie_connector_count":4,"sata_connector_count":7,"atx_version":"3.1","performance_score":97,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),

  ('case','Corsair','4000D Airflow',null,0,59900,
   '{"form_factors":["ATX","mATX","Mini-ITX"],"max_gpu_mm":360,"max_cooler_mm":170,"max_gpu_slots":7,"radiator_support_mm":[120,240,280,360],"required_usb_headers":["USB 3.0"],"performance_score":88,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('case','Cooler Master','NR200P',null,0,64900,
   '{"form_factors":["Mini-ITX"],"max_gpu_mm":330,"max_cooler_mm":155,"max_gpu_slots":3,"radiator_support_mm":[120,240,280],"required_usb_headers":["USB 3.0"],"performance_score":82,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),

  ('cooler','DeepCool','AK620',null,5,42900,
   '{"cooler_type":"air","height_mm":160,"ram_clearance_mm":43,"supported_sockets":["AM4","AM5","LGA1200","LGA1700","LGA1851"],"performance_score":94,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true),
  ('cooler','Thermalright','Peerless Assassin 120 SE',null,5,32900,
   '{"cooler_type":"air","height_mm":155,"ram_clearance_mm":42,"supported_sockets":["AM4","AM5","LGA115x","LGA1200","LGA1700","LGA1851"],"performance_score":91,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false}'::jsonb,null,true)
on conflict (component_type, brand, model) do update
set socket=excluded.socket,
    tdp_watts=excluded.tdp_watts,
    price_cents=excluded.price_cents,
    specs=excluded.specs,
    affiliate_url=excluded.affiliate_url,
    active=excluded.active;

update public.montapc_components
set specs = specs || '{"power_connector":"PCIe 6+2","power_connector_count":1,"slot_width":2,"pcie_version":4}'::jsonb
where component_type='gpu' and model in ('Radeon RX 6600 8GB','GeForce RTX 4060 8GB');

update public.montapc_components
set specs = specs || '{"power_connector":"PCIe 6+2","power_connector_count":2,"slot_width":2.5,"pcie_version":4}'::jsonb
where component_type='gpu' and model='Radeon RX 7800 XT 16GB';

update public.montapc_components
set specs = specs || '{"power_connector":"12VHPWR","power_connector_count":1,"slot_width":2.5,"pcie_version":4}'::jsonb
where component_type='gpu' and model='GeForce RTX 4070 SUPER 12GB';

update public.montapc_components
set specs = specs || '{"power_connector":"12V-2x6","power_connector_count":1}'::jsonb
where component_type='gpu' and model='GeForce RTX 5070 12GB';

update public.montapc_components
set specs = specs || '{"power_connector":"PCIe 6+2","power_connector_count":2,"length_mm":304,"slot_width":2.5}'::jsonb
where component_type='gpu' and model='Radeon RX 9070 XT 16GB';

update public.montapc_components
set specs = specs || '{"height_mm":34}'::jsonb
where component_type='memory' and brand='Kingston';
