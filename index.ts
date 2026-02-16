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

// 1. Вкладка Feed (ЗАФІКСОВАНО - ВЕРСІЯ V36)
const FeedTab = Main.AddNode("feed");
const RunToRadiant = FeedTab.AddToggle("1. Feed RADIANT (Вниз)", false);
const RunToDire = FeedTab.AddToggle("2. Feed DIRE (Вгору)", false);

// 2. Вкладка Armlet (Логіка на основі MK-Catcher)
const ArmletTab = Main.AddNode("armlet abuse");
const EnableArmlet = ArmletTab.AddToggle("Увімкнути Абуз", false);
const Threshold = ArmletTab.AddSlider("Поріг HP", 350, 100, 800, 10);
const AbuseDelay = ArmletTab.AddSlider("Затримка (мс)", 50, 20, 300, 10);

// Константи
const BASE_RADIANT = new Vector3(-7200, -6600, 384);
const BASE_DIRE = new Vector3(7200, 6500, 384);
const ARMLET_MODIFIER = "modifier_item_armlet_unholy_strength"; //

let lastTick = 0;
let lastArmlet = 0;
let isToggling = false;

EventsSDK.on("PostDataUpdate", () => {
    const MyHero = LocalPlayer?.Hero;
    if (!MyHero || !MyHero.IsAlive) return;
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
                    // Використовуємо методи з твоїх файлів Controllables.ts
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
    // ЛОГІКА ARMLET (MK-CATCHER STYLE)
    // ==========================================
    if (EnableArmlet.value) {
        // Знаходимо предмет за іменем, як у MK-Catcher
        const armlet = MyHero.GetItemByName("item_armlet");
        
        // Перевірка на фонтан (не абузимо там)
        if (MyHero.HealthRegen > 50) return;

        if (armlet && armlet.CanBeCasted()) {
            // Перевіряємо наявність модифікатора Unholy Strength
            const isUnholyActive = MyHero.HasModifier(ARMLET_MODIFIER);

            // КРОК 1: HP нижче порогу + Армлет активний -> ВИМИКАЄМО
            if (!isToggling && isUnholyActive && MyHero.Health < Threshold.value) {
                if (now - lastArmlet > 300) { // Захист від занадто частих команд
                    // ВИКОРИСТОВУЄМО МЕТОД ГЕРОЯ, ЯК У MK-CATCHER
                    // @ts-ignore
                    MyHero.CastNoTarget(armlet); 
                    isToggling = true;
                    lastArmlet = now;
                }
            }

            // КРОК 2: Ми вимкнули -> ВМИКАЄМО назад
            if (isToggling && !isUnholyActive) {
                if (now - lastArmlet >= AbuseDelay.value) {
                    // @ts-ignore
                    MyHero.CastNoTarget(armlet);
                    isToggling = false;
                    lastArmlet = now;
                }
            }

            // Скидання стану через секунду (захист від багів)
            if (isToggling && now - lastArmlet > 1000) isToggling = false;
        }
    }
});

console.log("best cheat octorine: Feed + MK-Armlet V38 Loaded");
