import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Unit,
    ExecuteOrder,
    EntityManager,
    dotaunitorder_t // Використовуємо типи наказів з AbuseMidas
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ (best cheat octorine) ---
const Main = Menu.AddEntry("best cheat octorine", "panorama/images/items/aegis_png.vtex_c");
const FeedTab = Main.AddNode("feed");

const RunToRadiant = FeedTab.AddToggle("1. Feed RADIANT (Вниз)", false);
const RunToDire = FeedTab.AddToggle("2. Feed DIRE (Вгору)", false);
const FeedAllies = FeedTab.AddToggle("3. Фід союзниками та кур'єрами", false);

// Координати
const BASE_RADIANT = new Vector3(-7200, -6600, 384);
const BASE_DIRE = new Vector3(7200, 6500, 384);

let lastTick = 0;

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // Перевірка активації
    if (!RunToRadiant.value && !RunToDire.value) return;

    // Частота оновлення (раз на 150 мс, щоб не перевантажувати двигун)
    if (now - lastTick < 150) return;
    lastTick = now;

    // Вибираємо ціль
    let target = RunToRadiant.value ? BASE_RADIANT.Clone() : BASE_DIRE.Clone();
    
    // Додаємо рандом (зменшений радіус 400, як ти просив)
    target.x += (Math.random() * 800 - 400);
    target.y += (Math.random() * 800 - 400);

    // --- 1. ФІД ГЕРОЄМ (Твій ідеальний варіант) ---
    try {
        // @ts-ignore
        ExecuteOrder.HoldOrdersTarget = target;
        // @ts-ignore
        Me.MoveTo(target, false, true);
    } catch (e) {
        // @ts-ignore
        Me.MoveTo(target);
    }

    // --- 2. ФІД СОЮЗНИКАМИ ТА КУР'ЄРАМИ ---
    if (FeedAllies.value) {
        const unitsToFeed: Unit[] = [];

        // Збираємо всіх кур'єрів твоєї команди
        const couriers = EntityManager.GetEntitiesByClass("npc_dota_courier");
        for (const cour of couriers) {
            // @ts-ignore
            if (cour.IsAlive && cour.IsMyTeam) {
                unitsToFeed.push(cour as Unit);
            }
        }

        // Збираємо всіх героїв союзників
        const allies = EntityManager.GetEntitiesByClass("npc_dota_hero_*");
        for (const ally of allies) {
            // @ts-ignore
            if (ally.IsAlive && ally.IsMyTeam && ally !== Me) {
                unitsToFeed.push(ally as Unit);
            }
        }

        // Відправляємо масовий наказ через систему PrepareOrder
        if (unitsToFeed.length > 0) {
            ExecuteOrder.PrepareOrder({
                // @ts-ignore
                orderType: 1, // DOTA_UNIT_ORDER_MOVE_TO_POSITION
                issuers: unitsToFeed,
                position: target,
                queue: false,
                isPlayerInput: false
            });
        }
    }
});

console.log("best cheat octorine: Mass Feed V44 Loaded!");
