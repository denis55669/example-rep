import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager,
    Unit
} from "github.com/octarine-public/wrapper/index"

// --- ГЛОБАЛЬНІ ЗМІННІ З OCTARINE-CORE ---
// Оголошуємо доступ до пам'яті та функції наказів
declare var IOBuffer: Float32Array;
declare function PrepareUnitOrders(obj: {
    OrderType: number,
    Target?: number,
    Ability?: number,
    Issuers?: number[] | number,
    Queue?: boolean,
    ShowEffects?: boolean,
    Flags?: number
}): void;

// --- МЕНЮ ---
const Main = Menu.AddEntry("Grief Lord V33", "panorama/images/items/divine_rapier_png.vtex_c");
const RunDire = Main.AddToggle("1. БІГТИ ВГОРУ (Dire)", false);
const RunRadiant = Main.AddToggle("2. БІГТИ ВНИЗ (Radiant)", false);
const FeedAll = Main.AddToggle("3. ФІД ВСІМА (Герой + Кури + Тіммейти)", false);

const DOTA_UNIT_ORDER_MOVE_TO_POSITION = 5;
let lastTick = 0;

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    const now = Date.now();
    if (now - lastTick < 250) return; // 4 рази на секунду
    lastTick = now;

    // 1. ВИЗНАЧАЄМО ЦІЛЬ
    let target: Vector3 | null = null;
    if (RunRadiant.value) target = new Vector3(-7200, -6600, 384);
    else if (RunDire.value) target = new Vector3(7200, 6500, 384);

    if (!target) return;

    // Рандом
    target.x += (Math.random() * 200 - 100);
    target.y += (Math.random() * 200 - 100);

    // 2. БЕЗПЕЧНИЙ ФІД ГЕРОЄМ (V24 Style - Працює 100%)
    if (FeedAll.value) {
        try {
            // @ts-ignore
            Me.MoveTo(target); 
        } catch (e) {}
    }

    // 3. МАСОВИЙ НАКАЗ ЧЕРЕЗ IOBuffer (Для Кур та Тіммейтів)
    if (FeedAll.value) {
        const issuers: number[] = [];

        // Збираємо Кур'єрів
        const couriers = EntityManager.GetEntitiesByClass("npc_dota_courier");
        for (const cour of couriers) {
            // @ts-ignore
            if (cour.IsAlive && cour.IsMyTeam) {
                // @ts-ignore
                issuers.push(cour.Handle); // Додаємо Handle юніта
            }
        }

        // Збираємо Тіммейтів (Окрім себе)
        const heroes = EntityManager.GetEntitiesByClass("npc_dota_hero_*");
        for (const hero of heroes) {
            // @ts-ignore
            if (hero.IsAlive && hero.IsMyTeam && !hero.IsMe) {
                // @ts-ignore
                issuers.push(hero.Handle);
            }
        }

        // ЯКЩО Є КОМУ БІГТИ - ВИКОНУЄМО МАГІЮ
        if (issuers.length > 0) {
            try {
                // КРОК 1: Записуємо координати в IOBuffer (Offset 0)
                // IOBuffer - це масив чисел float.
                // 0 = X, 1 = Y, 2 = Z
                if (typeof IOBuffer !== 'undefined') {
                    IOBuffer[0] = target.x;
                    IOBuffer[1] = target.y;
                    IOBuffer[2] = target.z;

                    // КРОК 2: Викликаємо функцію без координат (вона візьме їх з буфера)
                    PrepareUnitOrders({
                        OrderType: DOTA_UNIT_ORDER_MOVE_TO_POSITION,
                        Issuers: issuers, // Масив юнітів
                        Queue: false,
                        ShowEffects: true
                    });
                    
                    // console.log(`Sent IOBuffer Order to ${issuers.length} units`);
                } else {
                    console.log("Error: IOBuffer not found!");
                }
            } catch (e) {
                console.log("Memory Access Failed");
            }
        }
    }
});

console.log("Grief Lord V33: Memory Write Loaded!");
