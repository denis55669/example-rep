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
import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Unit,
    ExecuteOrder // Нам знадобиться для швидкого перемикання
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ ---
// Якщо ти додаєш це в існуючий файл, цей рядок (Main) вже є, не дублюй його!
// Якщо робиш з нуля - розкоментуй:
// const Main = Menu.AddEntry("best cheat octorine", "panorama/images/items/aegis_png.vtex_c");

// Якщо Main вже є вище, просто додаємо нову вкладку
// @ts-ignore (Ігноруємо помилку, якщо Main оголошено в іншій частині файлу)
const ArmletTab = Main.AddNode("Armlet Abuse");

const EnableArmlet = ArmletTab.AddToggle("1. Увімкнути Абуз", true);
const Threshold = ArmletTab.AddSlider("2. Поріг HP (Коли перемикати)", 350, 100, 1000, 10);
const Delay = ArmletTab.AddSlider("3. Затримка (Ping Fix)", 50, 10, 200, 10);

let lastToggle = 0;
let isRecharging = false; // Стан: ми вимкнули і чекаємо включення?

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    // Якщо скрипт вимкнено - нічого не робимо
    if (!EnableArmlet.value) return;

    // Знаходимо Армлет (шукаємо в усіх слотах)
    const armlet = GetItem(Me, "item_armlet");
    if (!armlet) return; // Немає армлета - виходимо

    const now = Date.now();
    // Чи включений Армлет зараз?
    // @ts-ignore
    const isArmletActive = armlet.IsToggled; 

    // --- ЛОГІКА АБУЗУ ---

    // 1. Якщо HP впало нижче порогу, і Армлет ВКЛЮЧЕНИЙ -> ВИМИКАЄМО
    if (Me.Health < Threshold.value && isArmletActive && !isRecharging) {
        if (now - lastToggle > 300) { // Захист від спаму
            // @ts-ignore
            armlet.CastNoTarget(); // Вимикаємо
            isRecharging = true;   // Ставимо прапорець "Заряджаємося"
            lastToggle = now;
        }
    }

    // 2. Якщо ми у стані "Зарядка" (вимкнули) -> ВМИКАЄМО НАЗАД
    if (isRecharging && !isArmletActive) {
        // Чекаємо мікро-паузу (залежить від пінгу), щоб сервер зарахував вимкнення
        if (now - lastToggle >= Delay.value) {
            // @ts-ignore
            armlet.CastNoTarget(); // Вмикаємо
            isRecharging = false;  // Готово
            lastToggle = now;
        }
    }
});

// --- ДОПОМІЖНА ФУНКЦІЯ ---
function GetItem(unit: Unit, itemName: string): any {
    // Шукаємо тільки в активних слотах (0-5)
    for (let i = 0; i <= 5; i++) {
        const item = unit.GetItemInSlot(i);
        // @ts-ignore
        if (item && item.Name === itemName) return item;
    }
    return null;
}

console.log("Armlet God Loaded!");
