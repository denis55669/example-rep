import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ ---
const Main = Menu.AddEntry("Grief Lord V28", "panorama/images/items/divine_rapier_png.vtex_c");

// Налаштування
const RunRadiant = Main.AddToggle("1. БІГТИ ВНИЗ (Radiant)", false);
const RunDire = Main.AddToggle("2. БІГТИ ВГОРУ (Dire)", false);

const FeedHero = Main.AddToggle("3. Фід ГЕРОЄМ", false);
const FeedOthers = Main.AddToggle("4. Фід ІНШИМИ (Кури/Shared)", false);

let lastOrder = 0;

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    const now = Date.now();
    // Таймер: Раз на 0.5 сек (золота середина між швидкістю і лагами)
    if (now - lastOrder < 500) return;
    lastOrder = now;

    // 1. ЦІЛЬ
    let target: Vector3 | null = null;
    if (RunRadiant.value) target = new Vector3(-7200, -6600, 384);
    else if (RunDire.value) target = new Vector3(7200, 6500, 384);

    if (!target) return;

    // Рандом
    target.x += (Math.random() * 200 - 100);
    target.y += (Math.random() * 200 - 100);

    // --- БЛОК 1: ГЕРОЙ (100% НАДІЙНІСТЬ) ---
    if (FeedHero.value) {
        try {
            // Використовуємо простий метод, який працював у V24
            // @ts-ignore
            Me.MoveTo(target);
        } catch (e) {
            // Якщо тут помилка - це дуже дивно
        }
    }

    // --- БЛОК 2: ІНШІ (ЕКСПЕРИМЕНТАЛЬНИЙ МЕТОД З Controllables.ts) ---
    if (FeedOthers.value) {
        const army: any[] = [];

        // Збираємо Кур'єрів
        try {
            const couriers = EntityManager.GetEntitiesByClass("npc_dota_courier");
            for (const cour of couriers) {
                // @ts-ignore
                if (cour.IsAlive && cour.IsMyTeam && cour.IsControllable) {
                    army.push(cour);
                }
            }
        } catch (e) {}

        // Збираємо Героїв-союзників
        try {
            const heroes = EntityManager.GetEntitiesByClass("npc_dota_hero_*");
            for (const hero of heroes) {
                // @ts-ignore
                if (hero.IsAlive && hero.IsMyTeam && !hero.IsMe && hero.IsControllable) {
                    army.push(hero);
                }
            }
        } catch (e) {}

        // Віддаємо наказ (Як у файлі Controllables.ts)
        for (const unit of army) {
            try {
                // Спроба №1: Метод із твоїх файлів (bypass queue)
                // @ts-ignore
                unit.MoveTo(target, false, true);
            } catch (e) {
                // Спроба №2: Якщо перший метод крашнувся, пробуємо звичайний
                try {
                     // @ts-ignore
                    unit.MoveTo(target);
                } catch (e2) {}
            }
        }
    }
});

console.log("Grief Lord V28 Loaded!");
