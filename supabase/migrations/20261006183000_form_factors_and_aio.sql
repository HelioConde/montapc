-- MontaPC: formatos ATX/Mini-ITX e refrigeração AIO.
-- Especificações oficiais; preços são referências internas observadas em 2026-10-06.

insert into public.montapc_components
  (component_type, brand, model, socket, tdp_watts, price_cents, specs, affiliate_url, active)
values
  ('motherboard','Gigabyte','B850 AORUS ELITE WIFI7','AM5',50,218499,
    '{"memory_type":"DDR5","form_factor":"ATX","m2_slots":3,"sata_ports":4,"memory_slots":4,"max_memory_gb":256,"pcie_x16_version":5,"supported_cpu_families":["Ryzen 7000","Ryzen 8000","Ryzen 9000"],"usb_headers":["USB-C 3.2 Gen 2x2","USB 3.2 Gen 1","USB 2.0"],"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false,"spec_source":"https://www.gigabyte.com/br/Motherboard/B850-AORUS-ELITE-WIFI7-rev-1x/sp"}'::jsonb,null,true),
  ('motherboard','Gigabyte','B850I AORUS PRO','AM5',45,177990,
    '{"memory_type":"DDR5","form_factor":"Mini-ITX","m2_slots":2,"sata_ports":2,"memory_slots":2,"max_memory_gb":128,"pcie_x16_version":5,"supported_cpu_families":["Ryzen 7000","Ryzen 8000","Ryzen 9000"],"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false,"spec_source":"https://www.gigabyte.com/br/Motherboard/B850I-AORUS-PRO-rev-11/sp"}'::jsonb,null,true),
  ('cooler','DeepCool','LE520 240mm AIO',null,9,38999,
    '{"cooler_type":"aio","radiator_mm":240,"supported_sockets":["AM4","AM5","LGA1150","LGA1151","LGA1155","LGA1200","LGA1700","LGA1851"],"performance_score":88,"price_kind":"reference_estimate","price_updated":"2026-10-06","price_live":false,"spec_source":"https://global.deepcool.com/products/Cooling/cpuliquidcoolers/LE520-240mm-Liquid-CPU-Cooler-1851-1700-AM5/2024/16608.shtml"}'::jsonb,null,true)
on conflict (component_type, brand, model) do update
set socket=excluded.socket,
    tdp_watts=excluded.tdp_watts,
    price_cents=excluded.price_cents,
    specs=excluded.specs,
    affiliate_url=excluded.affiliate_url,
    active=excluded.active;

update public.montapc_components
set specs = specs || '{
  "form_factors":["E-ATX","ATX","mATX","Mini-ITX"],
  "max_gpu_mm":400,
  "max_cooler_mm":180,
  "max_gpu_slots":7,
  "radiator_support_mm":[120,140,240,280,360],
  "required_usb_headers":["USB-C","USB 3.0"],
  "spec_source":"https://www.montechpc.com/air-903-base"
}'::jsonb
where component_type='case' and brand='Montech' and model='Air 903 Base';
