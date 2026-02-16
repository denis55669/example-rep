import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Unit,
    ExecuteOrder,
    EntityManager,
    GameState,
    dotaunitorder_t // Беремо з твого AbuseMidas
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ (best cheat octorine) ---
const Main = Menu.AddEntry("best cheat octorine", "panorama/images/items/aegis_png.vtex_c");

// 1. Вкладка Feed (ЛЕГЕНДАРНИЙ ФІД - ЗАФІКСОВАНО)
const FeedTab = Main.AddNode("feed");
const RunToRadiant = FeedTab.AddToggle("1. Feed RADIANT (Вниз)", false);
const RunToDire = FeedTab.AddToggle("2. Feed DIRE (Вгору)", false);

// 2. Вкладка Armlet (Advanced Abuse)
const ArmletTab = Main.AddNode("armlet abuse");
const EnableArmlet = ArmletTab.AddToggle("Увімкнути Абуз", false);
const Threshold = ArmletTab.AddSlider("Поріг HP", 350, 100, 800, 10);
const AbuseSpeed = ArmletTab.AddSlider("Швидкість (мс)", 50, 20, 200, 5);
const DotProtect = ArmletTab.AddToggle("Захист від отрути (DoT)", true);

// Константи
const BASE_RADIANT = new Vector3(-7200, -6600, 384);
const BASE_DIRE = new Vector3(7200, 6500, 384);
const ARMLET_MODIFIER = "modifier_item_armlet_unholy_strength";
const DANGER_MODS = [
    "modifier_item_spirit_vessel", "modifier_pudge_rot", 
    "modifier_viper_poison_attack", "modifier_venomancer_poison_nova"
];

let lastTick = 0;
let lastArmlet = 0;
let abuseState = 0; // 0: Idle, 1: Toggling

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // ==========================================
    // ЛОГІКА FEED (Твій ідеальний фідер)
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
                    // Використовуємо HoldOrdersTarget як у твоїх файлах
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
    // ЛОГІКА ARMLET (ЛОГІКА З ABUSE MIDAS)
    // ==========================================
    if (EnableArmlet.value) {
        const armlet = Me.GetItemByName("item_armlet");
        
        // Перевірки (як у Lua та AbuseMidas)
        if (Me.HealthRegen > 50 || Me.IsStunned || Me.IsHexed) return;

        if (armlet && armlet.CanBeCasted()) {
            // @ts-ignore
            const isActive = Me.HasModifier(ARMLET_MODIFIER);

            // Захист від отрути
            if (DotProtect.value) {
                for (const mod of DANGER_MODS) {
                    // @ts-ignore
                    if (Me.HasModifier(mod)) return;
                }
            }

            // КРОК 1: Вимикаємо (OrderType: 4 - Cast No Target)
            if (abuseState === 0 && isActive && Me.Health < Threshold.value) {
                if (now - lastArmlet > 300) {
                    SmartToggle(Me, armlet);
                    abuseState = 1;
                    lastArmlet = now;
                }
            }

            // КРОК 2: Вмикаємо назад
            if (abuseState === 1 && !isActive) {
                if (now - lastArmlet >= AbuseSpeed.value) {
                    SmartToggle(Me, armlet);
                    abuseState = 0;
                    lastArmlet = now;
                }
            }

            // Скидання
            if (abuseState === 1 && now - lastArmlet > 1000) abuseState = 0;
        }
    }
});

// ФУНКЦІЯ ПРЯМОГО НАКАЗУ (Як у AbuseMidas)
function SmartToggle(hero: any, item: any) {
    try {
        // Використовуємо ExecuteOrder.PrepareOrder, як у твоєму файлі AbuseMidas
        ExecuteOrder.PrepareOrder({
            // @ts-ignore
            orderType: 4, // DOTA_UNIT_ORDER_CAST_NO_TARGET
            issuers: [hero],
            ability: item,
            queue: false,
            isPlayerInput: false
        });
    } catch (e) {
        // Фоллбек на метод з MK-Catcher
        try { hero.CastNoTarget(item); } catch (err) {}
    }
}

console.log("best cheat octorine: Ultimate V42 Loaded!");
