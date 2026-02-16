import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager,
    ExecuteOrder,
    Unit,
    DOTAUnitMoveCapability
} from "github.com/octarine-public/wrapper/index"

// ==========================================
// --- НАЛАШТУВАННЯ МЕНЮ (GRIEF LORD V30) ---
// ==========================================
const Main = Menu.AddEntry("Grief Lord V30", "panorama/images/items/divine_rapier_png.vtex_c");

const RunDire = Main.AddToggle("1. БІГТИ ВГОРУ (До Dire)", false);
const RunRadiant = Main.AddToggle("2. БІГТИ ВНИЗ (До Radiant)", false);

const FeedHero = Main.AddToggle("3. Фід ГЕРОЄМ", false);
const FeedCour = Main.AddToggle("4. Фід КУР'ЄРАМИ", false);
const FeedAllies = Main.AddToggle("5. Фід СОЮЗНИКАМИ (Shared)", false);
const DebugLog = Main.AddToggle("6. Логи в консоль (Debug)", false);

let lastTick = 0;

// ==========================================
// --- ЛОГІКА З ТВОЇХ ФАЙЛІВ (MODULES) ---
// ==========================================

// 1. Перевірка: чи може юніт взагалі ходити?
function baseCheckUnit(ent: Unit): boolean {
    return ent 
        && ent.IsAlive 
        && !ent.HasNoCollision 
        && ent.HasMoveCapability(DOTAUnitMoveCapability.DOTA_UNIT_CAP_MOVE_GROUND);
}

// 2. Перевірка: чи можемо ми ним керувати?
function checkControllable(ent: Unit): boolean {
    // У твоєму файлі була сувора перевірка ent.IsControllable.
    // Ми залишаємо її, бо якщо сервер не дає прав - скрипт не допоможе.
    return baseCheckUnit(ent) && ent.IsControllable;
}

// 3. Основна функція руху (The Secret Sauce)
function MoveUnit(unit: Unit, pos: Vector3): void {
    // Цей рядок "прицілює" систему наказів чита
    try {
        // @ts-ignore
        ExecuteOrder.HoldOrdersTarget = pos;
    } catch (e) {}

    // Спеціальні аргументи: (position, queue=false, bypass=true)
    // false = не ставити в чергу (миттєво)
    // true = обійти деякі клієнтські обмеження
    // @ts-ignore
    unit.MoveTo(pos, false, true);
}

// ==========================================
// --- ГОЛОВНИЙ ЦИКЛ (MAIN LOOP) ---
// ==========================================
EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    const now = Date.now();
    // Виконуємо цикл кожні 300 мс (досить швидко, але без лагів)
    if (now - lastTick < 300) return;
    lastTick = now;

    // 1. Вибір цілі
    let target: Vector3 | null = null;
    if (RunRadiant.value) target = new Vector3(-7200, -6600, 384);
    else if (RunDire.value) target = new Vector3(7200, 6500, 384);

    if (!target) return;

    // Рандом (Anti-Bot Detection)
    target.x += (Math.random() * 200 - 100);
    target.y += (Math.random() * 200 - 100);

    // 2. ФІД ГЕРОЄМ
    if (FeedHero.value) {
        MoveUnit(Me, target);
    }

    // 3. ФІД КУР'ЄРАМИ
    if (FeedCour.value) {
        const couriers = EntityManager.GetEntitiesByClass("npc_dota_courier");
        for (const cour of couriers) {
            // @ts-ignore
            // Перевіряємо за базовою логікою + IsControllable
            if (cour.IsMyTeam && baseCheckUnit(cour)) {
                // @ts-ignore
                if (cour.IsControllable) {
                    // @ts-ignore
                    MoveUnit(cour, target);
                } else if (DebugLog.value) {
                    // @ts-ignore
                    console.log(`Skip Courier ${cour.Handle}: No Control`);
                }
            }
        }
    }

    // 4. ФІД СОЮЗНИКАМИ (ALLIES)
    if (FeedAllies.value) {
        const heroes = EntityManager.GetEntitiesByClass("npc_dota_hero_*");
        for (const hero of heroes) {
            // @ts-ignore
            if (hero.IsMyTeam && !hero.IsMe && baseCheckUnit(hero)) {
                // @ts-ignore
                if (hero.IsControllable) {
                    // @ts-ignore
                    MoveUnit(hero, target);
                    if (DebugLog.value) console.log(`Moving Ally: ${hero.Name}`);
                } else {
                    // Якщо контроль не розшарений і гравець не лівнув
                    if (DebugLog.value && Math.random() > 0.9) { 
                        // @ts-ignore
                        console.log(`Can't control ally: ${hero.Name} (Server denied)`);
                    }
                }
            }
        }
    }
});

console.log("Grief Lord V30 (Logic from unit-blocker) Loaded!");
