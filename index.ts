import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager,
    ExecuteOrder // <-- Додав цей модуль, він є в твоїх файлах
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ ---
const Main = Menu.AddEntry("Grief Lord V29", "panorama/images/items/divine_rapier_png.vtex_c");

const RunRadiant = Main.AddToggle("1. БІГТИ ВНИЗ (Radiant)", false);
const RunDire = Main.AddToggle("2. БІГТИ ВГОРУ (Dire)", false);

const FeedHero = Main.AddToggle("3. Фід ГЕРОЄМ", false);
const FeedAll = Main.AddToggle("4. Фід ВСІМА (Кури/Тіммейти)", false);

let lastOrder = 0;

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    const now = Date.now();
    // Частота як у твоєму файлі Block.ts (швидше, щоб перебивати накази)
    if (now - lastOrder < 200) return;
    lastOrder = now;

    // 1. ВИЗНАЧАЄМО ЦІЛЬ
    let target: Vector3 | null = null;
    if (RunRadiant.value) target = new Vector3(-7200, -6600, 384);
    else if (RunDire.value) target = new Vector3(7200, 6500, 384);

    if (!target) return;

    // Рандом, щоб сервер не банив команди
    target.x += (Math.random() * 100 - 50);
    target.y += (Math.random() * 100 - 50);

    // 2. ФІД ГЕРОЄМ (Базовий надійний метод)
    if (FeedHero.value) {
        // @ts-ignore
        Me.MoveTo(target);
    }

    // 3. ФІД ІНШИМИ (Логіка з Controllables.ts)
    if (FeedAll.value) {
        // СПЕЦІАЛЬНИЙ ТРЮК З ТВОГО ФАЙЛУ:
        // Встановлюємо "приціл" для системи наказів
        try {
            // @ts-ignore
            ExecuteOrder.HoldOrdersTarget = target;
        } catch (e) {}

        const army: any[] = [];

        // Збираємо Кур'єрів (Без перевірки IsControllable, просто IsMyTeam)
        try {
            const couriers = EntityManager.GetEntitiesByClass("npc_dota_courier");
            for (const cour of couriers) {
                // @ts-ignore
                if (cour.IsAlive && cour.IsMyTeam) {
                    army.push(cour);
                }
            }
        } catch (e) {}

        // Збираємо Героїв
        try {
            const heroes = EntityManager.GetEntitiesByClass("npc_dota_hero_*");
            for (const hero of heroes) {
                // @ts-ignore
                // Беремо всіх живих тіммейтів (крім себе)
                if (hero.IsAlive && hero.IsMyTeam && !hero.IsMe) {
                    army.push(hero);
                }
            }
        } catch (e) {}

        // ВИКОНУЄМО НАКАЗ
        for (const unit of army) {
            try {
                // Метод з твоїх файлів: аргументи false, true
                // @ts-ignore
                unit.MoveTo(target, false, true);
            } catch (e) {
                // Якщо спец. метод не спрацював - звичайний MoveTo
                try {
                    // @ts-ignore
                    unit.MoveTo(target);
                } catch (e2) {}
            }
        }
    }
});

console.log("Grief Lord V29: ExecuteOrder Logic Loaded!");
