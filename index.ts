import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Unit,
    ExecuteOrder // Це критично важливо!
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ ---
const Main = Menu.AddEntry("Sonic Feeder V36", "panorama/images/items/travel_boots_png.vtex_c");

const RunToRadiant = Main.AddToggle("1. Бігти ДО RADIANT (Вниз)", false);
const RunToDire = Main.AddToggle("2. Бігти ДО DIRE (Вгору)", false);
const AutoBuy = Main.AddToggle("3. Авто-закуп (Тапок/Смоки/Травела)", true);

// Координати фонтанів
const BASE_RADIANT = new Vector3(-7200, -6600, 384);
const BASE_DIRE = new Vector3(7200, 6500, 384);

let lastTick = 0;
let lastShop = 0;

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    const now = Date.now();

    // ==========================================
    // 1. АВТО-ЗАКУП (SHOP LOGIC)
    // ==========================================
    if (AutoBuy.value && now - lastShop > 500) {
        lastShop = now;

        // Перевіряємо, чи можемо ми купувати
        // @ts-ignore
        if (Me.IsShopOpen) {
            // 1.1 Купуємо Brown Boots (Speed +45)
            if (!HasItem(Me, "item_boots") && !HasItem(Me, "item_travel_boots")) {
                if (Me.Gold >= 500) EventsSDK.ExecuteCommand("dota_purchase_item item_boots");
            }

            // 1.2 Купуємо Wind Lace (Speed +20) - Дешево і сердито
            if (!HasItem(Me, "item_wind_lace") && !HasItem(Me, "item_travel_boots")) {
                if (Me.Gold >= 250) EventsSDK.ExecuteCommand("dota_purchase_item item_wind_lace");
            }

            // 1.3 Купуємо Smoke (Speed +15% & Invisibility)
            if (!HasItem(Me, "item_smoke_of_deceit")) {
                if (Me.Gold >= 50) EventsSDK.ExecuteCommand("dota_purchase_item item_smoke_of_deceit");
            }

            // 1.4 Апаємо Travel Boots (Speed +110)
            if (HasItem(Me, "item_boots") && Me.Gold >= 2000) {
                EventsSDK.ExecuteCommand("dota_purchase_item item_travel_boots");
            }
        }

        // 1.5 Авто-використання Смоків
        const smoke = GetItem(Me, "item_smoke_of_deceit");
        if (smoke && smoke.CanCast) {
            smoke.CastNoTarget();
        }
    }

    // ==========================================
    // 2. РУХ (MOVEMENT LOGIC)
    // ==========================================
    
    // Якщо жодна галочка не стоїть - не біжимо
    if (!RunToRadiant.value && !RunToDire.value) return;

    // Частота оновлення (швидко, як у твоєму файлі Block.ts)
    if (now - lastTick < 150) return; 
    lastTick = now;

    // Вибираємо ціль
    let target: Vector3 | null = null;
    
    if (RunToRadiant.value) {
        target = new Vector3(BASE_RADIANT.x, BASE_RADIANT.y, BASE_RADIANT.z);
    } else if (RunToDire.value) {
        target = new Vector3(BASE_DIRE.x, BASE_DIRE.y, BASE_DIRE.z);
    }

    if (target) {
        // РАНДОМ (Щоб бігати по всьому фонтану)
        target.x += (Math.random() * 1000 - 500);
        target.y += (Math.random() * 1000 - 500);

        // ХАК З ТВОГО СКРИПТА
        try {
            // "Наводимо" систему наказів на точку
            // @ts-ignore
            ExecuteOrder.HoldOrdersTarget = target;
        } catch (e) {}

        // ВИКОНУЄМО РУХ
        // false = Не ставити в чергу (бігти зараз!)
        // true = Bypass (обійти перевірки)
        try {
            // @ts-ignore
            Me.MoveTo(target, false, true);
        } catch (e) {
            // Запасний варіант
            // @ts-ignore
            Me.MoveTo(target);
        }
    }
});

// --- ДОПОМІЖНІ ФУНКЦІЇ ---

function HasItem(unit: Unit, itemName: string): boolean {
    // Перевіряємо інвентар (0-5) і рюкзак (6-8)
    for (let i = 0; i <= 8; i++) {
        const item = unit.GetItemInSlot(i);
        // @ts-ignore
        if (item && item.Name === itemName) return true;
    }
    return false;
}

function GetItem(unit: Unit, itemName: string): any {
    for (let i = 0; i <= 5; i++) {
        const item = unit.GetItemInSlot(i);
        // @ts-ignore
        if (item && item.Name === itemName) return item;
    }
    return null;
}

console.log("Sonic Feeder V36 (Controllables Logic) Loaded!");
