import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager,
    Player
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ ---
const Main = Menu.AddEntry("Grief Lord V25", "panorama/images/items/divine_rapier_png.vtex_c");

// Налаштування
const RunRadiant = Main.AddToggle("1. Бігти до RADIANT", false);
const RunDire = Main.AddToggle("2. Бігти до DIRE", false);

const FeedHero = Main.AddToggle("3. Фід: Мій Герой", false);
const FeedCour = Main.AddToggle("4. Фід: Кур'єри", false);
const FeedAllies = Main.AddToggle("5. Фід: Союзники (Shared)", false);

let lastMove = 0;
const DOTA_UNIT_ORDER_MOVE_TO_POSITION = 5; // Код команди руху

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    const now = Date.now();
    // Виконуємо команди раз на 1.5 секунди
    if (now - lastMove < 1500) return;
    lastMove = now;

    // 1. ВИЗНАЧАЄМО ЦІЛЬ
    let target: Vector3 | null = null;
    if (RunRadiant.value) target = new Vector3(-7200, -6600, 384);
    else if (RunDire.value) target = new Vector3(7200, 6500, 384);

    if (!target) return;

    // Додаємо рандом
    target.x += (Math.random() * 400 - 200);
    target.y += (Math.random() * 400 - 200);

    // 2. ФІД ГЕРОЄМ (Працює стабільно)
    if (FeedHero.value) {
        // @ts-ignore
        Me.MoveTo(target);
    }

    // 3. ФІД ІНШИМИ ЮНІТАМИ (Кур'єри + Союзники)
    if (FeedCour.value || FeedAllies.value) {
        const unitsToMove: any[] = [];

        // Збираємо Кур'єрів
        if (FeedCour.value) {
            const couriers = EntityManager.GetEntitiesByClass("npc_dota_courier");
            for (const cour of couriers) {
                // Перевіряємо, чи можемо ми ними керувати
                // @ts-ignore
                if (cour.IsAlive && cour.IsMyTeam && cour.IsControllable) {
                    unitsToMove.push(cour);
                }
            }
        }

        // Збираємо Союзників
        if (FeedAllies.value) {
            const heroes = EntityManager.GetEntitiesByClass("npc_dota_hero_*");
            for (const hero of heroes) {
                // @ts-ignore
                if (hero.IsAlive && hero.IsMyTeam && !hero.IsMe && hero.IsControllable) {
                    unitsToMove.push(hero);
                }
            }
        }

        // ВІДПРАВЛЯЄМО НАКАЗ УСІМ ЗІБРАНИМ ЮНІТАМ
        for (const unit of unitsToMove) {
            // Використовуємо PrepareOrder, бо MoveTo для них не працює
            try {
                // @ts-ignore
                Player.PrepareOrder(
                    LocalPlayer.RawPlayer,
                    DOTA_UNIT_ORDER_MOVE_TO_POSITION,
                    0,
                    target,
                    0,
                    unit,
                    false,
                    true
                );
            } catch (e) {
                // Якщо помилка - ігноруємо, щоб не крашнути меню
            }
        }
        
        if (unitsToMove.length > 0) {
            console.log("Відправлено на фід юнітів: " + unitsToMove.length);
        }
    }
});

console.log("Grief Lord V25 Loaded!");
