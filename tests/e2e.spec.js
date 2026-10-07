import { test, expect } from "@playwright/test";

const catalog = [
  {
    id:"cpu-amd",component_type:"cpu",brand:"AMD",model:"Ryzen Test 6C",socket:"AM5",price_cents:80000,tdp_watts:65,active:true,
    specs:{performance_score:72,cooler_included:true,family:"Ryzen 7000",cores:6,threads:12,price_kind:"reference_estimate",price_live:false}
  },
  {
    id:"cpu-intel",component_type:"cpu",brand:"Intel",model:"Core Test 6C",socket:"LGA1700",price_cents:95000,tdp_watts:65,active:true,
    specs:{performance_score:69,cooler_included:true,family:"Core 13th",cores:6,threads:12,price_kind:"reference_estimate",price_live:false}
  },
  {
    id:"mb-amd",component_type:"motherboard",brand:"Teste",model:"B650M QA",socket:"AM5",price_cents:65000,tdp_watts:45,active:true,
    specs:{performance_score:68,memory_type:"DDR5",form_factor:"mATX",memory_slots:4,max_memory_gb:128,m2_slots:2,sata_ports:4,pcie_x16_version:4,supported_cpu_families:["Ryzen 7000"],usb_headers:["USB 3.2","USB-C"]}
  },
  {
    id:"mb-intel",component_type:"motherboard",brand:"Teste",model:"B760M QA",socket:"LGA1700",price_cents:70000,tdp_watts:45,active:true,
    specs:{performance_score:66,memory_type:"DDR5",form_factor:"mATX",memory_slots:4,max_memory_gb:128,m2_slots:2,sata_ports:4,pcie_x16_version:4,supported_cpu_families:["Core 13th"],usb_headers:["USB 3.2","USB-C"]}
  },
  {
    id:"gpu-main",component_type:"gpu",brand:"Teste",model:"GPU 12G QA",price_cents:180000,tdp_watts:200,active:true,
    specs:{performance_score:82,vram_gb:12,length_mm:280,recommended_psu_watts:650,power_connector:"PCIe 6+2",power_connector_count:2,slot_width:2.5,pcie_version:4}
  },
  {
    id:"gpu-small",component_type:"gpu",brand:"Teste",model:"GPU 8G QA",price_cents:145000,tdp_watts:160,active:true,
    specs:{performance_score:68,vram_gb:8,length_mm:245,recommended_psu_watts:550,power_connector:"PCIe 6+2",power_connector_count:1,slot_width:2,pcie_version:4}
  },
  {
    id:"ram",component_type:"memory",brand:"Teste",model:"32GB DDR5 QA",price_cents:45000,tdp_watts:10,active:true,
    specs:{performance_score:72,memory_type:"DDR5",capacity_gb:32,modules:2,speed_mt:6000,height_mm:34}
  },
  {
    id:"ssd",component_type:"storage",brand:"Teste",model:"1TB NVMe QA",price_cents:35000,tdp_watts:8,active:true,
    specs:{performance_score:70,capacity_gb:1000,interface:"NVMe PCIe 4.0"}
  },
  {
    id:"psu",component_type:"psu",brand:"Teste",model:"750W Gold QA",price_cents:45000,tdp_watts:0,active:true,
    specs:{performance_score:76,wattage:750,efficiency:"80 Plus Gold",modular:true,connectors:["PCIe 6+2","12V-2x6"],pcie_connector_count:4,sata_connector_count:8}
  },
  {
    id:"case",component_type:"case",brand:"Teste",model:"Airflow QA",price_cents:35000,tdp_watts:0,active:true,
    specs:{performance_score:70,form_factors:["ATX","mATX","Mini-ITX"],max_gpu_mm:360,max_cooler_mm:170,max_gpu_slots:4,radiator_support_mm:[120,240,280,360],required_usb_headers:["USB 3.2"]}
  },
  {
    id:"cooler",component_type:"cooler",brand:"Teste",model:"Tower QA",price_cents:18000,tdp_watts:5,active:true,
    specs:{performance_score:68,supported_sockets:["AM5","LGA1700"],height_mm:155,ram_clearance_mm:42,cooler_type:"air"}
  }
];

async function installSupabaseMock(page) {
  await page.route("https://cdn.jsdelivr.net/**", route => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    body: ""
  }));

  await page.addInitScript(({ catalog }) => {
    const resultFor = table => {
      if (table === "montapc_components") return catalog;
      if (table === "montapc_price_snapshots") return [];
      return [];
    };

    function query(table) {
      const state = { table };
      const chain = {
        select(){ return chain; },
        eq(){ return chain; },
        order(){ return chain; },
        limit(){ return chain; },
        in(){ return chain; },
        delete(){ return chain; },
        update(){ return chain; },
        insert(){ return chain; },
        upsert(){ return chain; },
        single(){ return Promise.resolve({ data: null, error: null }); },
        then(resolve, reject) {
          return Promise.resolve({ data: resultFor(state.table), error: null }).then(resolve, reject);
        }
      };
      return chain;
    }

    const auth = {
      onAuthStateChange(){ return { data:{ subscription:{ unsubscribe(){} } } }; },
      getSession(){ return Promise.resolve({ data:{ session:null }, error:null }); },
      signInWithPassword(){ return Promise.resolve({ data:{ session:null }, error:null }); },
      signUp(){ return Promise.resolve({ data:{ session:null }, error:null }); },
      resetPasswordForEmail(){ return Promise.resolve({ data:{}, error:null }); },
      signOut(){ return Promise.resolve({ error:null }); }
    };

    window.supabase = {
      createClient() {
        return { auth, from: query };
      }
    };
  }, { catalog });
}

test.beforeEach(async ({ page }) => {
  await installSupabaseMock(page);
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.removeItem("montapc-builds-v2");
    localStorage.removeItem("montapc-language");
  });
  await page.reload();
  await expect(page.locator("#catalog-count")).toHaveText(String(catalog.length));
});

test("generates compatible build, detects manual conflict and saves locally", async ({ page }) => {
  await page.locator('[name="budget"]').fill("5000");
  await page.locator("#generate-build").click();

  await expect(page.locator("#build-result")).toBeVisible();
  await expect(page.locator("#compatibility-badge")).toHaveText("Compatível");
  await expect(page.locator("#save-build")).toBeEnabled();
  await expect(page.locator("#performance-grid .performance-card")).toHaveCount(6);
  await expect(page.locator(".part-reason").first()).toBeVisible();
  await expect(page.locator(".part-alternatives button").first()).toBeVisible();

  const equivalent = page.locator('[data-equivalent-type="gpu"]').first();
  if (await equivalent.count()) {
    await equivalent.click();
    await expect(page.locator("#compatibility-badge")).toHaveText("Compatível");
  }

  const board = page.locator('[data-part="motherboard"]');
  await board.selectOption("mb-intel");
  await expect(page.locator("#compatibility-badge")).toHaveText("Revisar conflitos");
  await expect(page.locator("#save-build")).toBeDisabled();
  await expect(page.locator("#compatibility-list")).toContainText("AM5");

  await board.selectOption("mb-amd");
  await expect(page.locator("#compatibility-badge")).toHaveText("Compatível");
  await expect(page.locator("#save-build")).toBeEnabled();

  await page.locator("#save-build").click();
  await page.locator('#name-form [name="name"]').fill("Build QA 1440p");
  await page.locator("#name-form").getByRole("button", { name: "Salvar configuração" }).click();

  await expect(page.locator("#saved-builds")).toContainText("Build QA 1440p");
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("montapc-builds-v2") || "[]"));
  expect(stored).toHaveLength(1);
  expect(stored[0].compatibilityStatus).toBe("compatible");
});

test("persists English and keeps catalog filters usable", async ({ page }) => {
  await page.locator("#language-select").selectOption("en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("#generate-build")).toHaveText(/Build|configuration/i);

  await page.locator("#catalogo details").evaluate(el => { el.open = true; });
  await page.locator("#catalog-type-filter").selectOption("gpu");
  await expect(page.locator("#catalog-grid .catalog-card")).toHaveCount(2);

  await page.locator("#catalog-search").fill("12G");
  await expect(page.locator("#catalog-grid")).toContainText("GPU 12G QA");
  await expect(page.locator("#catalog-grid")).not.toContainText("GPU 8G QA");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("extreme low budget still returns the cheapest compatible reference build", async ({ page }) => {
  await page.locator('[name="budget"]').fill("1500");
  await page.locator("#generate-build").click();
  await expect(page.locator("#build-result")).toBeVisible();
  await expect(page.locator("#compatibility-badge")).toHaveText("Compatível");
  const total = await page.locator("#build-total").textContent();
  expect(total).toBeTruthy();
});
