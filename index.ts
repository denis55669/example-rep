import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Unit,
    ExecuteOrder
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ (Категорія -> Вкладка) ---
// 1. Створюємо головну категорію "best cheat octorine"
const Main = Menu.AddEntry("best cheat octorine", "panorama/images/items/aegis_png.vtex_c");

// 2. Створюємо вкладку "feed" всередині
const FeedTab = Main.AddNode("feed");

// 3. Налаштування
const RunToRadiant = FeedTab.AddToggle("1. Feed RADIANT (Вниз)", false);
const RunToDire = FeedTab.AddToggle("2. Feed DIRE (Вгору)", false);
const AutoBuy = FeedTab.AddToggle("3. Auto Buy (Boots -> Travels)", true);

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
    // 1. АВТО-ЗАКУП (Тільки Чоботи)
    // ==========================================
    if (AutoBuy.value && now - lastShop > 500) {
        lastShop = now;

        // @ts-ignore
        if (Me.IsShopOpen) {
            // 1.1 Купуємо звичайний тапок (якщо немає ніяких)
            if (!HasItem(Me, "item_boots") && !HasItem(Me, "item_travel_boots") && !HasItem(Me, "item_travel_boots_2")) {
                if (Me.Gold >= 500) EventsSDK.ExecuteCommand("dota_purchase_item item_boots");
            }

            // 1.2 Апаємо Травела (якщо є тапок і гроші)
            // Травела дають +110 швидкості - найшвидший предмет у грі
            if (HasItem(Me, "item_boots") && Me.Gold >= 2000) {
                EventsSDK.ExecuteCommand("dota_purchase_item item_travel_boots");
            }
        }
    }

    // ==========================================
    // 2. РУХ (MOVEMENT)
    // ==========================================
    
    // Якщо нічого не обрано - виходимо
    if (!RunToRadiant.value && !RunToDire.value) return;

    // Частота оновлення (швидко, щоб перебивати інші команди)
    if (now - lastTick < 100) return; 
    lastTick = now;

    // Вибираємо базу
    let target: Vector3 | null = null;
    
    if (RunToRadiant.value) {
        target = new Vector3(BASE_RADIANT.x, BASE_RADIANT.y, BASE_RADIANT.z);
    } else if (RunToDire.value) {
        target = new Vector3(BASE_DIRE.x, BASE_DIRE.y, BASE_DIRE.z);
    }

    if (target) {
        // РАНДОМНИЙ СПАВН (Jitter)
        // Бігаємо в різні точки фонтану (розкид 900), щоб вороги промахувалися скілами
        target.x += (Math.random() * 1800 - 900);
        target.y += (Math.random() * 1800 - 900);

        // --- СПЕЦІАЛЬНА ЛОГІКА З ТВОЇХ ФАЙЛІВ ---
        try {
            // 1. "Наводимо" систему наказів на точку (Хак з Controllables.ts)
            // @ts-ignore
            ExecuteOrder.HoldOrdersTarget = target;
        } catch (e) {}

        try {
            // 2. Відправляємо примусовий наказ (Queue=false, Bypass=true)
            // @ts-ignore
            Me.MoveTo(target, false, true);
        } catch (e) {
            // 3. Запасний варіант, якщо спец. метод не спрацює
            // @ts-ignore
            Me.MoveTo(target);
        }
    }
});

// --- ПЕРЕВІРКА ПРЕДМЕТІВ ---
function HasItem(unit: Unit, itemName: string): boolean {
    // Перевіряємо інвентар (0-5) і рюкзак (6-8)
    for (let i = 0; i <= 8; i++) {
        const item = unit.GetItemInSlot(i);
        // @ts-ignore
        if (item && item.Name === itemName) return true;
    }
    return false;
}

console.log("Best Cheat Octarine: Feeder Loaded!");
