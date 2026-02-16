import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    ExecuteOrder
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ ---
// 1. Головна категорія
const Main = Menu.AddEntry("best cheat octorine", "panorama/images/items/aegis_png.vtex_c");

// 2. Вкладка "feed"
const FeedTab = Main.AddNode("feed");

// 3. Налаштування (Тільки рух)
const RunToRadiant = FeedTab.AddToggle("1. Feed RADIANT (Вниз)", false);
const RunToDire = FeedTab.AddToggle("2. Feed DIRE (Вгору)", false);

// Координати фонтанів
const BASE_RADIANT = new Vector3(-7200, -6600, 384);
const BASE_DIRE = new Vector3(7200, 6500, 384);

let lastTick = 0;

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    const now = Date.now();

    // Якщо нічого не увімкнено - виходимо
    if (!RunToRadiant.value && !RunToDire.value) return;

    // Частота кліків (100 мс = 10 разів на секунду)
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
        // --- ЗМЕНШЕНИЙ РАДІУС (Compact Jitter) ---
        // Було 900, стало 400. Герой бігає більш точно в центр.
        target.x += (Math.random() * 800 - 400);
        target.y += (Math.random() * 800 - 400);

        // --- ЛОГІКА РУХУ (З твоїх файлів) ---
        try {
            // 1. Наводимо "приціл"
            // @ts-ignore
            ExecuteOrder.HoldOrdersTarget = target;
        } catch (e) {}

        try {
            // 2. Примусовий наказ (Queue=false, Bypass=true)
            // @ts-ignore
            Me.MoveTo(target, false, true);
        } catch (e) {
            // 3. Запасний варіант
            // @ts-ignore
            Me.MoveTo(target);
        }
    }
});

console.log("Feed Script: Lite Version Loaded");
