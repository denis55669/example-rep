import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Unit,
    ExecuteOrder,
    EntityManager,
    TickSleeper
} from "github.com/octarine-public/wrapper/index"

// Ініціалізація
const Sleeper = new TickSleeper();

// --- МЕНЮ ---
const Main = Menu.AddEntry("best cheat octorine", "panorama/images/items/aegis_png.vtex_c");

// 1. Вкладка FEED (Твоя база + Fast Move)
const FeedTab = Main.AddNode("feed");
const RunToRadiant = FeedTab.AddToggle("1. Feed RADIANT (Вниз)", false);
const RunToDire = FeedTab.AddToggle("2. Feed DIRE (Вгору)", false);
const FastFeed = FeedTab.AddToggle("2. Fast Feed (Blink/Spells)", true);

// 2. Вкладка COURIER
const CourTab = Main.AddNode("courier", "panorama/images/items/courier_png.vtex_c");
const CourShield = CourTab.AddToggle("Авто-щит кур'єра", true);

// Координати
const BASE_RADIANT = new Vector3(-7200, -6600, 384);
const BASE_DIRE = new Vector3(7200, 6500, 384);

let lastTick = 0;

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // ==========================================
    // 1. FAST FEED (Blink / Abilities)
    // ==========================================
    if ((RunToRadiant.value || RunToDire.value) && !Sleeper.Sleeping) {
        let target = RunToRadiant.value ? BASE_RADIANT.Clone() : BASE_DIRE.Clone();
        
        if (FastFeed.value && Me.Distance(target) > 1000) {
            // Шукаємо Блінк Даггер або скіли (AM, QoP, Void)
            const blink = Me.GetItemByName("item_blink") || 
                          Me.GetItemByName("item_overwhelming_blink") || 
                          Me.GetItemByName("item_swift_blink") || 
                          Me.GetItemByName("item_arcane_blink");

            if (blink && blink.CanBeCasted()) {
                // Блінкаємось у бік бази
                // @ts-ignore
                Me.CastPosition(blink, Me.Position.Extend(target, 1150));
                Sleeper.Sleep(300);
            }
        }

        // --- ЛОГІКА РУХУ (ЗАФІКСОВАНО V36) ---
        if (now - lastTick >= 100) {
            lastTick = now;
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

    // ==========================================
    // 2. COURIER AUTO-SHIELD
    // ==========================================
    if (CourShield.value) {
        const couriers = EntityManager.GetEntitiesByClass("npc_dota_courier");
        for (const cour of couriers) {
            // @ts-ignore
            if (cour.IsAlive && cour.IsMyTeam && cour.IsControlledByPlayer(Me.PlayerID)) {
                // @ts-ignore
                if (cour.HealthPercent < 90 && cour.HealthRegen < 0) { // Якщо б'ють
                    const shield = cour.GetAbilityByName("courier_shield");
                    if (shield && shield.CanBeCasted()) {
                        // @ts-ignore
                        cour.CastNoTarget(shield);
                    }
                }
            }
        }
    }
});

console.log("best cheat octorine: Griefer Pack V47 Loaded");
