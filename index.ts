import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager,
    ExecuteOrder, // Цей модуль критично важливий
    Unit,
    DOTAUnitMoveCapability
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ ---
const Main = Menu.AddEntry("Grief Lord V31", "panorama/images/items/divine_rapier_png.vtex_c");

const RunDire = Main.AddToggle("1. БІГТИ ВГОРУ (Dire)", false);
const RunRadiant = Main.AddToggle("2. БІГТИ ВНИЗ (Radiant)", false);

const FeedHero = Main.AddToggle("3. Фід ГЕРОЄМ", false);
const FeedCour = Main.AddToggle("4. Фід КУР'ЄРАМИ", false);
const FeedAllies = Main.AddToggle("5. Фід СОЮЗНИКАМИ", false);
const ForceMode = Main.AddToggle("6. Force Mode (Ігнорувати перевірки)", false);

let lastTick = 0;

// --- ЛОГІКА З ФАЙЛУ CONTROLLABLES.TS ---

// 1. Перевірка на здатність рухатися (щоб не спамити вардам)
function isValidUnit(unit: Unit): boolean {
    return unit 
        && unit.IsAlive 
        && !unit.HasNoCollision 
        && unit.HasMoveCapability(DOTAUnitMoveCapability.DOTA_UNIT_CAP_MOVE_GROUND);
}

// 2. Секретна функція руху
function SmartMove(unit: Unit, pos: Vector3) {
    // ХАК: Встановлюємо ціль для системи наказів
    try {
        // @ts-ignore
        ExecuteOrder.HoldOrdersTarget = pos;
    } catch (e) {}

    // ВИКОНАННЯ: (pos, queue=false, bypass=true)
    try {
        // @ts-ignore
        unit.MoveTo(pos, false, true);
    } catch (e) {
        // Фоллбек для старіших версій
        // @ts-ignore
        unit.MoveTo(pos);
    }
}

// --- ГОЛОВНИЙ ЦИКЛ ---
EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    const now = Date.now();
    // Частота оновлення як у кріп-блокера (швидка)
    if (now - lastTick < 150) return;
    lastTick = now;

    // 1. ЦІЛЬ
    let target: Vector3 | null = null;
    if (RunRadiant.value) target = new Vector3(-7200, -6600, 384);
    else if (RunDire.value) target = new Vector3(7200, 6500, 384);

    if (!target) return;

    // Анти-бот рандом
    target.x += (Math.random() * 200 - 100);
    target.y += (Math.random() * 200 - 100);

    // 2. ФІД ГЕРОЄМ
    if (FeedHero.value) {
        SmartMove(Me, target);
    }

    // 3. ФІД ІНШИМИ (Кури + Тіммейти)
    if (FeedCour.value || FeedAllies.value) {
        
        // Збираємо всіх юнітів у радіусі (або по всій карті)
        // Використовуємо GetEntitiesByClass, як у Block.ts
        const couriers = FeedCour.value ? EntityManager.GetEntitiesByClass("npc_dota_courier") : [];
        const heroes = FeedAllies.value ? EntityManager.GetEntitiesByClass("npc_dota_hero_*") : [];
        
        const army = [...couriers, ...heroes];

        for (const unit of army) {
            // @ts-ignore
            if (!unit || unit.IsMe || !unit.IsMyTeam) continue;

            // @ts-ignore
            // Перевірка: чи живий і чи може ходити
            if (!isValidUnit(unit)) continue;

            // ГОЛОВНА ПЕРЕВІРКА КОНТРОЛЮ
            // @ts-ignore
            if (unit.IsControllable || ForceMode.value) {
                // @ts-ignore
                SmartMove(unit, target);
            }
        }
    }
});

console.log("Grief Lord V31: Source Code Logic Loaded!");
