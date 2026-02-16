import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Unit,
    ExecuteOrder
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ (Твоя легендарна категорія) ---
const Main = Menu.AddEntry("best cheat octorine", "panorama/images/items/aegis_png.vtex_c");

// 1. Вкладка Feed (ЗАФІКСОВАНО - ВЕРСІЯ V36)
const FeedTab = Main.AddNode("feed");
const RunToRadiant = FeedTab.AddToggle("1. Feed RADIANT (Вниз)", false);
const RunToDire = FeedTab.AddToggle("2. Feed DIRE (Вгору)", false);

// 2. Вкладка Armlet (ПЕРЕРОБЛЕНО ПІД МОДИФІКАТОРИ)
const ArmletTab = Main.AddNode("armlet abuse");
const EnableArmlet = ArmletTab.AddToggle("Увімкнути Абуз", false);
const Threshold = ArmletTab.AddSlider("Поріг HP", 350, 100, 800, 10);
const DebugArmlet = ArmletTab.AddToggle("Показувати логи (Debug)", false);

// Константи
const BASE_RADIANT = new Vector3(-7200, -6600, 384);
const BASE_DIRE = new Vector3(7200, 6500, 384);
const ARMLET_MODIFIER = "modifier_item_armlet_unholy_strength"; //

let lastTick = 0;
let lastArmlet = 0;
let abuseState = 0; // 0 - очікування, 1 - вимкнули, чекаємо тік для включення

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
    // ЛОГІКА ARMLET (MODIFIER CHECK)
    // ==========================================
    if (EnableArmlet.value) {
        const armlet = GetArmlet(Me);
        
        if (armlet) {
            // Перевіряємо стан через наявність ефекту армлета на герої
            // @ts-ignore
            const isUnholyActive = Me.HasModifier(ARMLET_MODIFIER);

            if (DebugArmlet.value && now - lastArmlet > 1000) {
                console.log(`[Armlet] HP: ${Me.Health}, Active: ${isUnholyActive}, State: ${abuseState}`);
            }

            // КРОК 1: HP нижче порогу + Армлет активний -> Вимикаємо
            if (abuseState === 0 && isUnholyActive && Me.Health < Threshold.value) {
                if (now - lastArmlet > 250) {
                    // @ts-ignore
                    armlet.CastNoTarget();
                    abuseState = 1;
                    lastArmlet = now;
                    if (DebugArmlet.value) console.log("[Armlet] OFF!");
                }
            }

            // КРОК 2: Ми щойно вимкнули і бачимо, що модифікатор зник -> Вмикаємо назад
            if (abuseState === 1 && !isUnholyActive) {
                // Мінімальна затримка 40мс для реєстрації сервером
                if (now - lastArmlet >= 40) {
                    // @ts-ignore
                    armlet.CastNoTarget();
                    abuseState = 0;
                    lastArmlet = now;
                    if (DebugArmlet.value) console.log("[Armlet] ON!");
                }
            }

            // Скидання стану, якщо включення не відбулося за 1 сек
            if (abuseState === 1 && now - lastArmlet > 1000) abuseState = 0;
        } else if (DebugArmlet.value && now - lastArmlet > 5000) {
            console.log("[Armlet] Error: Item not found in inventory!");
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

console.log("best cheat octorine: Feed + Armlet V5 Loaded");
