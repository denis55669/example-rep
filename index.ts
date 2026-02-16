import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Unit,
    ExecuteOrder,
    TickSleeper
} from "github.com/octarine-public/wrapper/index"

// Ініціалізація сліпера як у MK Catcher
const Sleeper = new TickSleeper();

// --- МЕНЮ (best cheat octorine) ---
const Main = Menu.AddEntry("best cheat octorine", "panorama/images/items/aegis_png.vtex_c");

// Вкладка FEED
const FeedTab = Main.AddNode("feed");
const RunToRadiant = FeedTab.AddToggle("1. Feed RADIANT (Вниз)", false);
const RunToDire = FeedTab.AddToggle("2. Feed DIRE (Вгору)", false);
const FastFeed = FeedTab.AddToggle("2. Fast Feed (Blinks & Skills)", true);

// Вкладка SHOP (Економічний терор)
const ShopTab = Main.AddNode("shop grief", "panorama/images/items/ward_sentry_png.vtex_c");
const AutoBuyAll = ShopTab.AddToggle("Викуповувати Варди/Смоки/Танго", true);

// Координати
const BASE_RADIANT = new Vector3(-7200, -6600, 384);
const BASE_DIRE = new Vector3(7200, 6500, 384);

let lastTick = 0;
let lastBuyTick = 0;

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // ==========================================
    // 1. ЕКОНОМІЧНИЙ ТЕРОР (SHOP LOGIC)
    // ==========================================
    // Перевіряємо закуп раз на секунду, щоб не спамити помилками в консоль
    if (AutoBuyAll.value && now - lastBuyTick > 1000) {
        // @ts-ignore - Перевірка чи відкритий магазин (на базі)
        if (Me.IsShopOpen) {
            // Купуємо все за списком:
            EventsSDK.ExecuteCommand("dota_purchase_item item_ward_observer"); // Жовті
            EventsSDK.ExecuteCommand("dota_purchase_item item_ward_sentry");   // Сині
            EventsSDK.ExecuteCommand("dota_purchase_item item_smoke_of_deceit"); // Смоки
            EventsSDK.ExecuteCommand("dota_purchase_item item_tango");           // Танго
            lastBuyTick = now;
        }
    }

    // ==========================================
    // 2. ЛОГІКА FEED (Твоя ПРАЙМ база)
    // ==========================================
    if (RunToRadiant.value || RunToDire.value) {
        let target = RunToRadiant.value ? BASE_RADIANT.Clone() : BASE_DIRE.Clone();

        // --- FAST FEED (Blinks & Abilities) ---
        if (FastFeed.value && !Sleeper.Sleeping && Me.Distance(target) > 800) {
            const blinkSkill = Me.GetAbilityByName("antimage_blink") || 
                               Me.GetAbilityByName("queenofpain_blink") || 
                               Me.GetAbilityByName("faceless_void_time_walk") ||
                               Me.GetAbilityByName("void_spirit_astral_step");

            const blinkItem = Me.GetItemByName("item_blink") || 
                              Me.GetItemByName("item_overwhelming_blink") || 
                              Me.GetItemByName("item_swift_blink") || 
                              Me.GetItemByName("item_arcane_blink");

            const activeBlink = (blinkSkill && blinkSkill.CanBeCasted()) ? blinkSkill : 
                                (blinkItem && blinkItem.CanBeCasted()) ? blinkItem : null;

            if (activeBlink) {
                const blinkPos = Me.Position.Extend(target, 1150);
                // @ts-ignore
                Me.CastPosition(activeBlink, blinkPos);
                Sleeper.Sleep(400); 
            }
        }

        // --- РУХ (ЗАФІКСОВАНО V36) ---
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
});

console.log("best cheat octorine PRIME V49: Loaded!");
