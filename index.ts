import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ (Без папок, сразу с иконкой Рапиры) ---
const Main = Menu.AddEntry("Grief Lord V24", "panorama/images/items/divine_rapier_png.vtex_c");

// Настройки
const RunRadiant = Main.AddToggle("1. Бежать к RADIANT (Вниз)", false);
const RunDire = Main.AddToggle("2. Бежать к DIRE (Вверх)", false);

const FeedHero = Main.AddToggle("3. ФИД: Мой Герой", false);
const FeedCour = Main.AddToggle("4. ФИД: Курьеры", false);
const FeedAllies = Main.AddToggle("5. ФИД: Союзники (Shared)", false);

let lastMove = 0;

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    const now = Date.now();
    // Делаем действия раз в 1 секунду (чтобы не вешать меню)
    if (now - lastMove < 1000) return;
    lastMove = now;

    // 1. ОПРЕДЕЛЯЕМ ЦЕЛЬ
    let target: Vector3 | null = null;

    if (RunRadiant.value) {
        target = new Vector3(-7200, -6600, 384); // Фонтан Radiant
    } else if (RunDire.value) {
        target = new Vector3(7200, 6500, 384);   // Фонтан Dire
    }

    // Если цель не выбрана - ничего не делаем
    if (!target) return;

    // Добавляем микро-рандом, чтобы не бежали "в одну точку"
    target.x += (Math.random() * 400 - 200);
    target.y += (Math.random() * 400 - 200);

    // 2. ФИД ГЕРОЕМ
    if (FeedHero.value) {
        // @ts-ignore
        Me.MoveTo(target);
    }

    // 3. ФИД КУРЬЕРАМИ
    if (FeedCour.value) {
        const couriers = EntityManager.GetEntitiesByClass("npc_dota_courier");
        for (const cour of couriers) {
            // @ts-ignore
            if (cour.IsAlive && cour.IsMyTeam) {
                // @ts-ignore
                cour.MoveTo(target);
            }
        }
    }

    // 4. ФИД СОЮЗНИКАМИ (Ливеры и те, кто дал контроль)
    if (FeedAllies.value) {
        const heroes = EntityManager.GetEntitiesByClass("npc_dota_hero_*");
        for (const hero of heroes) {
            // Проверяем: живой, за нас, не мы сами, и МОЖНО УПРАВЛЯТЬ
            // @ts-ignore
            if (hero.IsAlive && hero.IsMyTeam && !hero.IsMe && hero.IsControllable) {
                // @ts-ignore
                hero.MoveTo(target);
            }
        }
    }
});

console.log("Denis Grief Lord V24 Loaded!");
