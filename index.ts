import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Unit,
    ExecuteOrder,
    DOTAUnitMoveCapability // З твоїх файлів Controllables.ts
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ (best cheat octorine) ---
const Main = Menu.AddEntry("best cheat octorine", "panorama/images/items/aegis_png.vtex_c");

// 1. Вкладка Feed (ЗАФІКСОВАНО - Твій найкращий варіант)
const FeedTab = Main.AddNode("feed");
const RunToRadiant = FeedTab.AddToggle("1. Feed RADIANT (Вниз)", false);
const RunToDire = FeedTab.AddToggle("2. Feed DIRE (Вгору)", false);

// 2. Вкладка Armlet
const ArmletTab = Main.AddNode("armlet abuse");
const EnableArmlet = ArmletTab.AddToggle("Увімкнути Абуз", false);
const Threshold = ArmletTab.AddSlider("Поріг HP", 300, 100, 700, 10);

// Константи
const BASE_RADIANT = new Vector3(-7200, -6600, 384);
const BASE_DIRE = new Vector3(7200, 6500, 384);
const MODIFIER_ARMLET = "modifier_item_armlet_unholy_strength";

let lastTick = 0;
let lastArmlet = 0;
let abuseState = 0; 

EventsSDK.on("PostDataUpdate", () => {
    const MyHero = LocalPlayer?.Hero;
    if (!MyHero || !MyHero.IsAlive) return;
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
    // ЛОГІКА ARMLET (Стиль MK-Catcher)
    // ==========================================
    if (EnableArmlet.value) {
        // Знаходимо армлет точно як у MK Catcher
        const armlet = MyHero.GetItemByName("item_armlet");
        
        // Не абузимо у фонтані
        if (MyHero.HealthRegen > 50) return;

        if (armlet && armlet.CanBeCasted()) {
            // Перевіряємо ефект армлета
            const isUnholyActive = MyHero.HasModifier(MODIFIER_ARMLET);

            // КРОК 1: Вимикаємо
            if (abuseState === 0 && isUnholyActive && MyHero.Health < Threshold.value) {
                if (now - lastArmlet > 250) {
                    // ВИКОРИСТОВУЄМО CastNoTarget через Героя, як у MK-Catcher
                    // @ts-ignore
                    MyHero.CastNoTarget(armlet); 
                    abuseState = 1;
                    lastArmlet = now;
                }
            }

            // КРОК 2: Вмикаємо назад (через 50мс)
            if (abuseState === 1 && !isUnholyActive) {
                if (now - lastArmlet >= 50) {
                    // @ts-ignore
                    MyHero.CastNoTarget(armlet);
                    abuseState = 0;
                    lastArmlet = now;
                }
            }

            // Захист від заїдання
            if (abuseState === 1 && now - lastArmlet > 1000) abuseState = 0;
        }
    }
});

console.log("best cheat octorine: Feed + Armlet V39 Loaded");
