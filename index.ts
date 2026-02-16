import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Unit,
    ExecuteOrder,
    Enum
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ ---
const Main = Menu.AddEntry("best cheat octorine", "panorama/images/items/aegis_png.vtex_c");

// 1. Вкладка Feed (Твій найкращий варіант)
const FeedTab = Main.AddNode("feed");
const RunToRadiant = FeedTab.AddToggle("1. Feed RADIANT (Вниз)", false);
const RunToDire = FeedTab.AddToggle("2. Feed DIRE (Вгору)", false);

// 2. Вкладка Armlet
const ArmletTab = Main.AddNode("armlet abuse");
const EnableArmlet = ArmletTab.AddToggle("Увімкнути Абуз", false);
const Threshold = ArmletTab.AddSlider("Поріг HP", 350, 100, 800, 10);
const AbuseKey = ArmletTab.AddKeyBind("Примусовий абуз (Кнопка)", 0); // Можна затиснути для ручного абузу

// Константи та змінні
const BASE_RADIANT = new Vector3(-7200, -6600, 384);
const BASE_DIRE = new Vector3(7200, 6500, 384);
const DOTA_UNIT_ORDER_CAST_TOGGLE = 11; // Пряма команда перемикання

let lastTick = 0;
let lastArmlet = 0;
let isToggling = false;

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
    // ЛОГІКА ARMLET ABUSE (HARDCORE)
    // ==========================================
    if (EnableArmlet.value || AbuseKey.isPressed) {
        const armlet = GetArmlet(Me);
        if (armlet && armlet.CanCast && now - lastArmlet > 100) {
            
            // @ts-ignore
            const isActive = armlet.IsToggled;
            
            // Умова абузу: мало HP або затиснута кнопка
            if ((Me.Health < Threshold.value && isActive) || isToggling) {
                
                // КРОК 1: Вимикаємо (якщо був включений)
                if (isActive && !isToggling) {
                    ExecuteToggle(Me, armlet);
                    isToggling = true;
                    lastArmlet = now;
                } 
                // КРОК 2: Вмикаємо назад миттєво
                else if (!isActive && isToggling) {
                    ExecuteToggle(Me, armlet);
                    isToggling = false;
                    lastArmlet = now;
                }
            }
        }
    }
});

// Функція швидкого перемикання через движок
function ExecuteToggle(unit: any, item: any) {
    try {
        // Використовуємо PrepareUnitOrders для миттєвого пакету
        // @ts-ignore
        unit.PrepareUnitOrders(
            11, // DOTA_UNIT_ORDER_CAST_TOGGLE
            0,
            Vector3.Zero,
            item.Index,
            0,
            false
        );
    } catch (e) {
        item.CastNoTarget(); // Резервний метод
    }
}

function GetArmlet(unit: Unit) {
    for (let i = 0; i <= 5; i++) {
        const item = unit.GetItemInSlot(i);
        // @ts-ignore
        if (item && item.Name === "item_armlet") return item;
    }
    return null;
}

console.log("best cheat octorine: Feed + Armlet V2 Loaded");
