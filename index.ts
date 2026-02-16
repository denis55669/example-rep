import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Unit,
    ExecuteOrder
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ (Твоя категорія) ---
const Main = Menu.AddEntry("best cheat octorine", "panorama/images/items/aegis_png.vtex_c");

// Вкладка Feed (Твій перевірений код)
const FeedTab = Main.AddNode("feed");
const RunToRadiant = FeedTab.AddToggle("1. Feed RADIANT (Вниз)", false);
const RunToDire = FeedTab.AddToggle("2. Feed DIRE (Вгору)", false);

// Вкладка Armlet (Спрощена логіка)
const ArmletTab = Main.AddNode("armlet abuse");
const EnableArmlet = ArmletTab.AddToggle("Увімкнути Абуз", false);
const Threshold = ArmletTab.AddSlider("Поріг HP", 350, 100, 800, 10);

// Константи
const BASE_RADIANT = new Vector3(-7200, -6600, 384);
const BASE_DIRE = new Vector3(7200, 6500, 384);

let lastTick = 0;
let lastArmlet = 0;
let state = 0; // 0 - спокій, 1 - вимкнули, чекаємо тік, щоб увімкнути

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // ==========================================
    // 1. ЛОГІКА FEED (Твій ідеальний варіант)
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
                    ExecuteOrder.HoldOrdersTarget = target; //
                    // @ts-ignore
                    Me.MoveTo(target, false, true); //
                } catch (e) {
                    // @ts-ignore
                    Me.MoveTo(target);
                }
            }
        }
    }

    // ==========================================
    // 2. ЛОГІКА ARMLET (Максимально проста)
    // ==========================================
    if (EnableArmlet.value && now - lastArmlet > 50) {
        const armlet = GetArmlet(Me);
        if (armlet && armlet.CanCast) {
            // @ts-ignore
            const isActive = armlet.IsToggled;

            // Якщо HP мало і армлет включений -> Вимикаємо
            if (Me.Health < Threshold.value && isActive && state === 0) {
                // @ts-ignore
                armlet.CastNoTarget();
                state = 1;
                lastArmlet = now;
            } 
            // Якщо ми щойно вимкнули -> Вмикаємо назад
            else if (!isActive && state === 1) {
                // @ts-ignore
                armlet.CastNoTarget();
                state = 0;
                lastArmlet = now;
            }
        }
    }
});

function GetArmlet(unit: Unit) {
    for (let i = 0; i <= 5; i++) {
        const item = unit.GetItemInSlot(i);
        // @ts-ignore
        if (item && item.Name === "item_armlet") return item;
    }
    return null;
}

console.log("best cheat octorine: Stable Loaded");
