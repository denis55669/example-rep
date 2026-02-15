import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager,
    Player,
    Enum
} from "github.com/octarine-public/wrapper/index"

// --- В КЛАДКА "УТИЛІТИ" (Denis Utilities) ---
// Іконка шестерні для утиліт
const Utils = Menu.AddEntry("Denis Utilities", "panorama/images/hud/reborn/settings_icon_psd.vtex_c");

// --- ПІДРОЗДІЛ "GRIEF LORD" ---
// Іконка Рапіри (найсмішніша для фіду)
const Feeder = Utils.AddEntry("Grief Lord", "panorama/images/items/divine_rapier_png.vtex_c");

// Налаштування
const FeedHero = Feeder.AddToggle("1. Фід Героєм", false);
const FeedCour = Feeder.AddToggle("2. Фід Курами", false);
const FeedAllies = Feeder.AddToggle("3. Фід Тіммейтами (Shared/Leavers)", false);
const Side = Feeder.AddList("Куди фідити?", ["ворогам RADIANT", "ворогам DIRE"], 1);

let lastOrder = 0;

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // Виконуємо наказ раз на 3 секунди (щоб не лагало від кількості юнітів)
    if (now - lastOrder > 3000) {
        
        // 1. Визначаємо координати ворожого фонтану
        let targetPos: Vector3;
        if (Side.value === 0) { // Radiant
            targetPos = new Vector3(-7200, -6600, 384);
        } else { // Dire
            targetPos = new Vector3(7200, 6500, 384);
        }

        // Додаємо рандом, щоб не бігли "паровозиком"
        targetPos.x += (Math.random() * 600 - 300);
        targetPos.y += (Math.random() * 600 - 300);

        // 2. Збираємо армію для фіду
        // @ts-ignore
        if (FeedHero.value) {
            MoveUnit(Me, targetPos);
        }

        // Фід Курами
        if (FeedCour.value) {
            const couriers = EntityManager.GetEntitiesByClass("npc_dota_courier");
            for (const cour of couriers) {
                // Якщо це наш кур'єр і він живий
                if (cour.IsMyTeam && cour.IsAlive) {
                    MoveUnit(cour, targetPos);
                }
            }
        }

        // Фід Тіммейтами (Тільки якщо дали контроль або лівнули)
        if (FeedAllies.value) {
            const heroes = EntityManager.GetEntitiesByClass("npc_dota_hero_*");
            for (const hero of heroes) {
                // Якщо це союзник, живий, не я, і я можу ним керувати (Controllable)
                if (hero.IsMyTeam && hero.IsAlive && !hero.IsMe && hero.IsControllable) {
                    MoveUnit(hero, targetPos);
                }
            }
        }

        lastOrder = now;
    }
});

// Функція примусового руху через "Мозок" гри
function MoveUnit(unit: any, pos: Vector3) {
    // @ts-ignore
    if (unit && pos) {
        // Використовуємо PrepareOrder - це найсильніший наказ
        Player.PrepareOrder(
            LocalPlayer.RawPlayer,
            Enum.UnitOrder.DOTA_UNIT_ORDER_MOVE_TO_POSITION,
            0,
            pos,
            0,
            unit, // Кого відправляємо
            false,
            true
        );
    }
}

console.log("Grief Lord Loaded in Utilities!");
