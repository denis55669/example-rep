import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager,
    Unit
} from "github.com/octarine-public/wrapper/index"

// Оголошуємо глобальну функцію з octarine-core.d.ts, щоб TypeScript не лаявся
declare function PrepareUnitOrders(obj: {
    OrderType: number,
    TargetIndex?: number,
    Position?: Vector3,
    AbilityIndex?: number,
    Issuers?: number[], // Це ключовий момент!
    Queue?: boolean,
    ShowEffects?: boolean
}): void;

const Main = Menu.AddEntry("Grief Lord V32", "panorama/images/items/divine_rapier_png.vtex_c");
const RunDire = Main.AddToggle("1. Run Dire (Вгору)", false);
const RunRadiant = Main.AddToggle("2. Run Radiant (Вниз)", false);
const FeedAll = Main.AddToggle("3. Feed ALL (Hero + Couriers + Allies)", false);

const DOTA_UNIT_ORDER_MOVE_TO_POSITION = 5;
let lastTick = 0;

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    const now = Date.now();
    if (now - lastTick < 250) return;
    lastTick = now;

    // 1. Ціль
    let target: Vector3 | null = null;
    if (RunRadiant.value) target = new Vector3(-7200, -6600, 384);
    else if (RunDire.value) target = new Vector3(7200, 6500, 384);

    if (!target) return;

    // Рандом
    target.x += (Math.random() * 200 - 100);
    target.y += (Math.random() * 200 - 100);

    // 2. Збираємо армію
    const army: Unit[] = [];

    if (FeedAll.value) {
        // Герой
        army.push(Me);

        // Кур'єри
        const couriers = EntityManager.GetEntitiesByClass("npc_dota_courier");
        for (const cour of couriers) {
            // @ts-ignore
            if (cour.IsAlive && cour.IsMyTeam) {
                // @ts-ignore
                army.push(cour);
            }
        }

        // Союзники (Shared)
        const heroes = EntityManager.GetEntitiesByClass("npc_dota_hero_*");
        for (const hero of heroes) {
            // @ts-ignore
            if (hero.IsAlive && hero.IsMyTeam && !hero.IsMe) {
                 // @ts-ignore
                army.push(hero);
            }
        }
    }

    // 3. ВИКОНАННЯ ЧЕРЕЗ RAW API
    // Ми не перебираємо цикл, ми відправляємо ОДИН пакет для всієї групи!
    // Це працює набагато потужніше, ніж MoveTo по черзі.
    
    if (army.length > 0) {
        // Збираємо індекси всіх юнітів
        // @ts-ignore
        const issuers = army.map(u => u.Handle); 
        // Handle - це внутрішній номер юніта, потрібний для PrepareUnitOrders

        try {
            // Прямий виклик движка
            PrepareUnitOrders({
                OrderType: DOTA_UNIT_ORDER_MOVE_TO_POSITION,
                Position: target,
                Issuers: issuers, // Відправляємо масивом!
                Queue: false,
                ShowEffects: true
            });
            
            // console.log(`Sent Raw Order to ${issuers.length} units`);
        } catch (e) {
            console.log("Raw Order Failed");
        }
    }
});

console.log("Grief Lord V32: Direct Engine Access Loaded!");
