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

// 1. Вкладка Feed (ЗАФІКСОВАНО - НЕ ЗМІНЮВАТИ)
const FeedTab = Main.AddNode("feed");
const RunToRadiant = FeedTab.AddToggle("1. Feed RADIANT (Вниз)", false);
const RunToDire = FeedTab.AddToggle("2. Feed DIRE (Вгору)", false);

// 2. Вкладка Armlet (ПРОФЕСІЙНИЙ АБУЗ)
const ArmletTab = Main.AddNode("armlet abuse");
const EnableArmlet = ArmletTab.AddToggle("Увімкнути Абуз", false);
const Threshold = ArmletTab.AddSlider("Поріг HP для абузу", 300, 100, 700, 10); // За замовчуванням 300
const ToggleDelay = ArmletTab.AddSlider("Затримка перемикання (мс)", 40, 10, 200, 10);

// Константи
const BASE_RADIANT = new Vector3(-7200, -6600, 384);
const BASE_DIRE = new Vector3(7200, 6500, 384);

let lastTick = 0;
let lastArmletAction = 0;
let armletState = "READY"; // READY -> TURNING_OFF -> TURNING_ON

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // ==========================================
    // ЛОГІКА FEED (ТВІЙ ЛЕГЕНДАРНИЙ ВАРІАНТ)
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
    // ЛОГІКА ARMLET (SMART TOGGLE)
    // ==========================================
    if (EnableArmlet.value) {
        const armlet = GetArmlet(Me);
        
        if (armlet && armlet.CanCast) {
            // @ts-ignore
            const isToggled = armlet.IsToggled; // Чи включена Unholy Strength

            // КРОК 1: Якщо мало HP і армлет включений - ВИМИКАЄМО
            if (armletState === "READY" && isToggled && Me.Health < Threshold.value) {
                // @ts-ignore
                armlet.CastNoTarget();
                armletState = "TURNING_ON"; // Готуємось включити
                lastArmletAction = now;
            }
            
            // КРОК 2: Якщо вимкнули - ВМИКАЄМО назад через мікро-затримку
            if (armletState === "TURNING_ON" && !isToggled) {
                if (now - lastArmletAction >= ToggleDelay.value) {
                    // @ts-ignore
                    armlet.CastNoTarget();
                    armletState = "READY";
                    lastArmletAction = now;
                }
            }

            // ЗАХИСТ: Якщо застрягли у вимкненому стані - виправляємо
            if (armletState === "TURNING_ON" && now - lastArmletAction > 500) {
                armletState = "READY";
            }
        }
    }
});

// Допоміжна функція пошуку армлета (слот Z та інші)
function GetArmlet(unit: Unit) {
    for (let i = 0; i <= 5; i++) {
        const item = unit.GetItemInSlot(i);
        // @ts-ignore
        if (item && item.Name === "item_armlet") return item;
    }
    return null;
}

console.log("best cheat octorine: Feed Lite + Armlet God V3 Loaded");
