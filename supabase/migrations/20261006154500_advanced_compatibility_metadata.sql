-- MontaPC: metadados adicionais para compatibilidade avançada.
-- Fontes oficiais consultadas em 2026-10-06.
-- Mantém preços como estimativas internas; este arquivo só enriquece especificações técnicas.

update public.montapc_components
set specs = specs || '{
  "family":"Ryzen 5000"
}'::jsonb
where component_type='cpu' and brand='AMD' and model='Ryzen 5 5600';

update public.montapc_components
set specs = specs || '{
  "family":"Intel Core 12th Gen"
}'::jsonb
where component_type='cpu' and brand='Intel' and model='Core i5-12400F';

update public.montapc_components
set specs = specs || '{
  "family":"Ryzen 7000"
}'::jsonb
where component_type='cpu' and brand='AMD' and model in ('Ryzen 5 7600','Ryzen 7 7800X3D');

update public.montapc_components
set specs = specs || '{
  "memory_slots":4,
  "sata_ports":4,
  "supported_cpu_families":["Ryzen 3000","Ryzen 4000G","Ryzen 5000","Ryzen 5000G"],
  "spec_source":"https://www.gigabyte.com/br/Motherboard/B550M-DS3H-rev-10-11-12-13/sp"
}'::jsonb
where component_type='motherboard' and brand='Gigabyte' and model='B550M DS3H';

update public.montapc_components
set specs = specs || '{
  "memory_slots":4,
  "sata_ports":4,
  "supported_cpu_families":["Intel Core 12th Gen","Intel Core 13th Gen","Intel Core 14th Gen"],
  "spec_source":"https://www.gigabyte.com/br/Motherboard/B760M-DS3H-DDR4-rev-10/sp"
}'::jsonb
where component_type='motherboard' and brand='Gigabyte' and model='B760M DS3H DDR4';

update public.montapc_components
set specs = specs || '{
  "memory_slots":4,
  "sata_ports":4,
  "supported_cpu_families":["Ryzen 7000","Ryzen 8000","Ryzen 9000"],
  "spec_source":"https://www.gigabyte.com/pt/Motherboard/B650M-D3HP-rev-13/sp"
}'::jsonb
where component_type='motherboard' and brand='Gigabyte' and model='B650M D3HP';

update public.montapc_components
set specs = specs || '{
  "connectors":["PCIe 6+2"],
  "pcie_connector_count":2,
  "sata_connector_count":5,
  "spec_source":"https://www.msi.com/Power-Supply/MAG-A550BN/Specification"
}'::jsonb
where component_type='psu' and brand='MSI' and model='MAG A550BN 550W';

update public.montapc_components
set specs = specs || '{
  "connectors":["PCIe 6+2"],
  "pcie_connector_count":2,
  "sata_connector_count":5,
  "spec_source":"https://br.msi.com/Power-Supply/MAG-A650BN/Specification"
}'::jsonb
where component_type='psu' and brand='MSI' and model='MAG A650BN 650W';

update public.montapc_components
set specs = specs || '{
  "connectors":["PCIe 6+2","12V-2x6"],
  "pcie_connector_count":3,
  "sata_connector_count":6,
  "atx_version":"3.1",
  "spec_source":"https://www.corsair.com/br/pt/p/psu/cp-9020292-br/rme-series-rm750e-fully-modular-low-noise-atx-power-supply-white-br-cp-9020292-br"
}'::jsonb
where component_type='psu' and brand='Corsair' and model='RM750e 750W';
