import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Unit,
    ExecuteOrder,
    EntityManager,
    DOTAUnitMoveCapability
} from "github.com/octarine-public/wrapper/index"

// --- ГЛОБАЛЬНІ ДЕКЛАРАЦІЇ (З твого octarine-core.d.ts) ---
declare function PrepareUnitOrders(obj: {
    OrderType: number,
    Target?: number,
    Ability?: number,
    Issuers?: number[] | number,
    Queue?: boolean,
    ShowEffects?: boolean,
    Flags?: number
}): void;

// --- МЕНЮ (best cheat octorine) ---
const Main = Menu.AddEntry("best cheat octorine", "panorama/images/items/aegis_png.vtex_c");

// 1. Вкладка Feed (ЗАФІКСОВАНО - V36)
const FeedTab = Main.AddNode("feed");
const RunToRadiant = FeedTab.AddToggle("1. Feed RADIANT (Вниз)", false);
const RunToDire = FeedTab.AddToggle("2. Feed DIRE (Вгору)", false);

// 2. Вкладка Armlet (ПРОФЕСІЙНИЙ МОДУЛЬ)
const ArmletTab = Main.AddNode("armlet abuse");
const EnableArmlet = ArmletTab.AddToggle("Увімкнути Абуз", false);
const Threshold = ArmletTab.AddSlider("Поріг HP", 350, 100, 800, 10);
const AbuseSpeed = ArmletTab.AddSlider("Швидкість (мс)", 40, 10, 200, 5);
const SafetyStash = ArmletTab.AddToggle("Захист від отрути (DoT)", true); //

// База даних небезпечних модифікаторів (з твого Lua файлу)
const DANGER_DOTS = [
    "modifier_venomancer_poison_nova", "modifier_viper_poison_attack",
    "modifier_item_spirit_vessel", "modifier_item_urn_damage",
    "modifier_pudge_rot", "modifier_doom_bringer_doom"
];

const BASE_RADIANT = new Vector3(-7200, -6600, 384);
const BASE_DIRE = new Vector3(7200, 6500, 384);
const ARMLET_MODIFIER = "modifier_item_armlet_unholy_strength"; //

let lastTick = 0;
let lastArmletAction = 0;
let abuseState = 0; // 0: Idle, 1: Turning OFF, 2: Re-enabling

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
    // ЛОГІКА ARMLET (SMART ENGINE ABUSE)
    // ==========================================
    if (EnableArmlet.value) {
        const armlet = Me.GetItemByName("item_armlet");
        
        // Перевірки безпеки (Lua Style)
        if (Me.HealthRegen > 50) return; // Не абузимо у фонтані
        if (Me.IsStunned || Me.IsSilenced || Me.IsHexed) return; // Не абузимо в контролі

        if (armlet && armlet.CanBeCasted()) {
            // @ts-ignore
            const isUnholy = Me.HasModifier(ARMLET_MODIFIER);

            // 1. ПЕРЕВІРКА НА ОТРУТУ (DoT)
            if (SafetyStash.value) {
                for (const dot of DANGER_DOTS) {
                    // @ts-ignore
                    if (Me.HasModifier(dot)) return; // Скасувати абуз, якщо на нас DoT
                }
            }

            // 2. ЦИКЛ АБУЗУ
            // КРОК А: Мало HP + Армлет ВКЛЮЧЕНИЙ -> ВИМКНУТИ
            if (abuseState === 0 && isUnholy && Me.Health < Threshold.value) {
                if (now - lastArmletAction > 300) {
                    RawToggle(Me, armlet);
                    abuseState = 1;
                    lastArmletAction = now;
                }
            }

            // КРОК Б: Ми вимкнули -> ВМИКАЄМО НАЗАД через заданий час
            if (abuseState === 1 && !isUnholy) {
                if (now - lastArmletAction >= AbuseSpeed.value) {
                    RawToggle(Me, armlet);
                    abuseState = 0;
                    lastArmletAction = now;
                }
            }

            // Захист від зависання
            if (abuseState === 1 && now - lastArmletAction > 1500) abuseState = 0;
        }
    }
});

// Функція прямого наказу серверу (Engine Level)
function RawToggle(hero: any, item: any) {
    try {
        // Використовуємо PrepareUnitOrders з твого core-файлу
        PrepareUnitOrders({
            OrderType: 11, // DOTA_UNIT_ORDER_CAST_TOGGLE
            Ability: item.Index, // Використовуємо Індекс предмета
            Issuers: [hero.Handle],
            Queue: false
        });
    } catch (e) {
        // Фоллбек на метод з MK-Catcher
        try { hero.CastNoTarget(item); } catch (err) {}
    }
}

console.log("best cheat octorine: God Mode V40 Loaded!");
