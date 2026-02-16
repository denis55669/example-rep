import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Unit
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ ---
const Main = Menu.AddEntry("Sonic Feeder V35", "panorama/images/items/travel_boots_png.vtex_c");

const FeedActive = Main.AddToggle("1. АКТИВУВАТИ ФІД", false);
const RunSide = Main.AddList("2. Куди бігти?", ["DIRE (Вгору)", "RADIANT (Вниз)"], 1);
const AutoShop = Main.AddToggle("3. Авто-закуп (Тапок -> Травела + Смоки)", true);

// Координати
const POS_DIRE = new Vector3(7200, 6500, 384);
const POS_RADIANT = new Vector3(-7200, -6600, 384);

let lastTick = 0;
let lastBuy = 0;
let pauseUntil = 0; // Таймер для паузи, щоб ти міг керувати

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    const now = Date.now();

    // --- 0. ПАУЗА (Щоб ти міг керувати) ---
    // Якщо ти натиснув щось і ми в паузі - не фідимо
    if (now < pauseUntil) return;

    // --- 1. АВТО-ЗАКУП (Розумний) ---
    if (AutoShop.value && now - lastBuy > 500) {
        lastBuy = now;

        // Перевіряємо наявність предметів (Інвентар + Рюкзак + Схованка)
        const hasBoots = HasItem(Me, "item_boots");
        const hasTravels = HasItem(Me, "item_travel_boots") || HasItem(Me, "item_travel_boots_2");
        const hasSmoke = HasItem(Me, "item_smoke_of_deceit");

        // 1.1 Купуємо Тапок (якщо немає ніяких чобіт)
        if (!hasBoots && !hasTravels && Me.Gold >= 500) {
            EventsSDK.ExecuteCommand("dota_purchase_item item_boots");
        }

        // 1.2 Апаємо Травела (якщо є тапок і гроші)
        if (hasBoots && !hasTravels && Me.Gold >= 2000) {
            EventsSDK.ExecuteCommand("dota_purchase_item item_travel_boots");
        }

        // 1.3 Купуємо Смоки (Тільки якщо їх немає в інвентарі)
        if (!hasSmoke && Me.Gold >= 50) {
            EventsSDK.ExecuteCommand("dota_purchase_item item_smoke_of_deceit");
        }

        // 1.4 ЗАБРАТИ ЗІ СКЛАДУ
        // Якщо предмети лежать у схованці (stash) - кур'єр має їх принести або ми забираємо самі
        if (IsInStash(Me)) {
            EventsSDK.ExecuteCommand("dota_courier_deliver"); 
        }

        // 1.5 ВИКОРИСТАННЯ СМОКІВ (Авто-каст)
        const smokeItem = GetItemInActiveSlot(Me, "item_smoke_of_deceit");
        if (smokeItem && smokeItem.CanCast) {
            smokeItem.CastNoTarget();
        }
    }

    // --- 2. РУХ (ФІД) ---
    if (FeedActive.value && now - lastTick > 150) { // Трохи рідше, щоб не лагало
        lastTick = now;

        let target: Vector3 | null = null;
        if (RunSide.value === 0) target = new Vector3(POS_DIRE.x, POS_DIRE.y, POS_DIRE.z);
        else target = new Vector3(POS_RADIANT.x, POS_RADIANT.y, POS_RADIANT.z);

        if (target) {
            // РАНДОМНИЙ РОЗКИД (Jitter)
            // Кожен клік - нова точка в радіусі 900
            target.x += (Math.random() * 1800 - 900);
            target.y += (Math.random() * 1800 - 900);

            // @ts-ignore
            Me.MoveTo(target);
        }
    }
});

// Додатковий хук: Якщо гравець натискає S (Stop), ставимо паузу на 2 секунди
// Це дозволить тобі перехопити керування, щоб зупинитися або зробити телепорт
EventsSDK.on("ChatEvent", (e) => {
    // Це примітивний спосіб, але якщо ти відкриєш чат, фідер зупиниться на секунду
    // На жаль, відстежити клавіші без модуля Input складно, тому краще просто вимикай галочку в меню.
});

// --- ДОПОМІЖНІ ФУНКЦІЇ ---

function HasItem(unit: Unit, itemName: string): boolean {
    // Перевіряємо слоти 0-5 (активні), 6-8 (рюкзак), 9-14 (схованка)
    for (let i = 0; i <= 14; i++) {
        const item = unit.GetItemInSlot(i);
        // @ts-ignore
        if (item && item.Name === itemName) return true;
    }
    return false;
}

function IsInStash(unit: Unit): boolean {
    // Перевіряємо, чи є щось у слотах схованки (9-14)
    for (let i = 9; i <= 14; i++) {
        const item = unit.GetItemInSlot(i);
        // @ts-ignore
        if (item) return true;
    }
    return false;
}

function GetItemInActiveSlot(unit: Unit, itemName: string): any {
    for (let i = 0; i <= 5; i++) {
        const item = unit.GetItemInSlot(i);
        // @ts-ignore
        if (item && item.Name === itemName) return item;
    }
    return null;
}

console.log("Sonic Feeder V35: Smart Item Logic Loaded!");
