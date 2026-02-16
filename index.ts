import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Unit,
    ExecuteOrder,
    GameState,
    Sleeper, // Використовуємо як у твоїх скриптах
    dotaunitorder_t // Беремо перелік наказів з AbuseMidas
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ ---
const Main = Menu.AddEntry("best cheat octorine", "panorama/images/images/items/aegis_png.vtex_c");

// 1. Вкладка Feed (ЗАФІКСОВАНО - ВЕРСІЯ V36)
const FeedTab = Main.AddNode("feed");
const RunToRadiant = FeedTab.AddToggle("1. Feed RADIANT (Вниз)", false);
const RunToDire = FeedTab.AddToggle("2. Feed DIRE (Вгору)", false);

// 2. Вкладка Armlet (Engine Level)
const ArmletTab = Main.AddNode("armlet abuse");
const EnableArmlet = ArmletTab.AddToggle("Увімкнути Абуз", false);
const Threshold = ArmletTab.AddSlider("Поріг HP", 350, 100, 800, 10);
const DelaySlider = ArmletTab.AddSlider("Затримка (мс)", 50, 20, 300, 10);

// Константи та Сліпер
const BASE_RADIANT = new Vector3(-7200, -6600, 384);
const BASE_DIRE = new Vector3(7200, 6500, 384);
const MODIFIER_ARMLET = "modifier_item_armlet_unholy_strength"; //
const sleeper = new Sleeper(); //

let lastTick = 0;
let isToggling = false;

EventsSDK.on("PostDataUpdate", () => {
    const MyHero = LocalPlayer?.Hero;
    if (!MyHero || !MyHero.IsAlive) return;
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
                    ExecuteOrder.HoldOrdersTarget = target; //
                    // @ts-ignore
                    MyHero.MoveTo(target, false, true); //
                } catch (e) {
                    // @ts-ignore
                    MyHero.MoveTo(target);
                }
            }
        }
    }

    // ==========================================
    // ЛОГІКА ARMLET (ЛОГІКА ABUSE MIDAS)
    // ==========================================
    if (EnableArmlet.value && !sleeper.Sleeping("armlet_task")) {
        // Знаходимо армлет як у MK Catcher
        const armlet = MyHero.GetItemByName("item_armlet");
        
        // Перевірка на фонтан
        if (MyHero.HealthRegen > 50) return;

        if (armlet && armlet.CanBeCasted()) {
            // @ts-ignore
            const isActive = MyHero.HasModifier(MODIFIER_ARMLET);

            // 1. ВИМКНЕННЯ
            if (!isToggling && isActive && MyHero.Health < Threshold.value) {
                // Використовуємо PrepareOrder як у AbuseMidas
                ExecuteOrder.PrepareOrder({
                    // @ts-ignore
                    orderType: 4, // DOTA_UNIT_ORDER_CAST_NO_TARGET
                    issuers: [MyHero],
                    ability: armlet,
                    queue: false,
                    isPlayerInput: false
                });
                isToggling = true;
                // Спимо, щоб сервер обробив вимкнення
                sleeper.Sleep(DelaySlider.value, "armlet_task");
                return;
            }

            // 2. УВІМКНЕННЯ
            if (isToggling && !isActive) {
                ExecuteOrder.PrepareOrder({
                    // @ts-ignore
                    orderType: 4,
                    issuers: [MyHero],
                    ability: armlet,
                    queue: false,
                    isPlayerInput: false
                });
                isToggling = false;
                // Кулдаун на наступний абуз
                sleeper.Sleep(250, "armlet_task");
            }
        }
    }
});

console.log("best cheat octorine: V43 Engine Logic Loaded");
