import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Unit,
    ExecuteOrder
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ (Категорія за замовчуванням) ---
const Main = Menu.AddEntry("best cheat octorine", "panorama/images/items/aegis_png.vtex_c");

// 1. Вкладка Feed (Твій перевірений варіант)
const FeedTab = Main.AddNode("feed");
const RunToRadiant = FeedTab.AddToggle("1. Feed RADIANT (Вниз)", false);
const RunToDire = FeedTab.AddToggle("2. Feed DIRE (Вгору)", false);

// 2. Вкладка Armlet (Логіка з Lua-скрипта)
const ArmletTab = Main.AddNode("armlet abuse");
const EnableArmlet = ArmletTab.AddToggle("Увімкнути Абуз", false);
const Threshold = ArmletTab.AddSlider("Поріг HP", 350, 100, 800, 10);
const CustomDelay = ArmletTab.AddSlider("Швидкість абузу (мс)", 50, 20, 300, 10);

// Константи
const BASE_RADIANT = new Vector3(-7200, -6600, 384);
const BASE_DIRE = new Vector3(7200, 6500, 384);

let lastTick = 0;
let lastArmletAction = 0;
let isToggling = false; // Чи ми зараз у процесі перемикання

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // ==========================================
    // ЛОГІКА FEED (БЕЗ ЗМІН)
    // ==========================================
    if (RunToRadiant.value || RunToDire.value) {
        if (now - lastTick >= 100) {
            lastTick = now;
            let target: Vector3 | null = null;
            if (RunToRadiant.value) target = new Vector3(BASE_RADIANT.x, BASE_RADIANT.y, BASE_RADIANT.z);
            else if (RunToDire.value) target = new Vector3(BASE_DIRE.x, BASE_DIRE.y, BASE_DIRE.z);

            if (target) {
                target.x += (Math.random() * 800 - 400);
                target.y += (Math.random() * 800 - 400);
                try {
                    // @ts-ignore
                    ExecuteOrder.HoldOrdersTarget = target;
                    // @ts-ignore
                    Me.MoveTo(target, false, true);
                } catch (e) {
                    // @ts-ignore
                    Me.MoveTo(target);
                }
            }
        }
    }

    // ==========================================
    // ЛОГІКА ARMLET (PRO LOGIC)
    // ==========================================
    if (EnableArmlet.value) {
        const armlet = GetArmlet(Me);
        
        // Якщо ми у фонтані - не абузимо
        if (Me.HealthRegen > 50) return;

        if (armlet && armlet.CanCast) {
            // @ts-ignore
            const isActive = armlet.IsToggled; // Стан Unholy Strength

            // КРОК 1: HP впало -> Вимикаємо (якщо включений)
            if (!isToggling && isActive && Me.Health < Threshold.value) {
                if (now - lastArmletAction > 250) { // Захист як у Lua
                    ToggleItem(armlet);
                    isToggling = true;
                    lastArmletAction = now;
                }
            }
            
            // КРОК 2: Ми вимкнули -> Вмикаємо назад
            if (isToggling && !isActive) {
                // Чекаємо мікро-затримку для реєстрації сервером
                if (now - lastArmletAction >= CustomDelay.value) {
                    ToggleItem(armlet);
                    isToggling = false;
                    lastArmletAction = now;
                }
            }
            
            // Скидання стану, якщо забагалося
            if (isToggling && now - lastArmletAction > 1000) isToggling = false;
        }
    }
});

// Універсальна функція перемикання
function ToggleItem(item: any) {
    try {
        if (item.Toggle) item.Toggle(); // Спроба через прямий метод Toggle
        else item.CastNoTarget();      // Спроба через звичайний каст
    } catch (e) {}
}

function GetArmlet(unit: Unit) {
    for (let i = 0; i <= 5; i++) {
        const item = unit.GetItemInSlot(i);
        // @ts-ignore
        if (item && item.Name === "item_armlet") return item;
    }
    return null;
}

console.log("best cheat octorine: Feed + Armlet Pro V4 Loaded");
