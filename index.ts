import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Unit,
    ExecuteOrder,
    TickSleeper
} from "github.com/octarine-public/wrapper/index"

// Ініціалізація сліпера для затримок
const Sleeper = new TickSleeper();

// --- ЛОКАЛІЗАЦІЯ (RU/EN) ---
Menu.Localization.AddLocalizationUnit("english", new Map([
    ["prime_name", "best cheat octorine"],
    ["feed_node", "Feed Settings"],
    ["run_radiant", "1. Feed RADIANT (Down)"],
    ["run_dire", "2. Feed DIRE (Up)"],
    ["fast_feed", "3. Fast Feed (Blinks & Skills)"]
]));

Menu.Localization.AddLocalizationUnit("russian", new Map([
    ["prime_name", "best cheat octorine"],
    ["feed_node", "Настройки Фида"],
    ["run_radiant", "1. Фид RADIANT (Вниз)"],
    ["run_dire", "2. Фид DIRE (Вверх)"],
    ["fast_feed", "3. Быстрый фид (Блинки и Скиллы)"]
]));

// --- МЕНЮ ---
const Main = Menu.AddEntry("prime_name", "panorama/images/items/aegis_png.vtex_c");
const FeedTab = Main.AddNode("feed_node");

const RunToRadiant = FeedTab.AddToggle("run_radiant", false);
const RunToDire = FeedTab.AddToggle("run_dire", false);
const FastFeed = FeedTab.AddToggle("fast_feed", true);

// Координати баз
const BASE_RADIANT = new Vector3(-7200, -6600, 384);
const BASE_DIRE = new Vector3(7200, 6500, 384);

let lastTick = 0;

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // Перевірка активації фіду
    if (!RunToRadiant.value && !RunToDire.value) return;

    // Визначаємо ціль залежно від вибору
    let target = RunToRadiant.value ? BASE_RADIANT.Clone() : BASE_DIRE.Clone();

    // ==========================================
    // 1. FAST FEED (Blinks & Abilities)
    // ==========================================
    if (FastFeed.value && !Sleeper.Sleeping && Me.Distance(target) > 800) {
        
        // Пошук здібностей героїв (AM, QoP, Void, Void Spirit)
        const blinkSkill = Me.GetAbilityByName("antimage_blink") || 
                           Me.GetAbilityByName("queenofpain_blink") || 
                           Me.GetAbilityByName("faceless_void_time_walk") ||
                           Me.GetAbilityByName("void_spirit_astral_step");

        // Пошук предметів блінку
        const blinkItem = Me.GetItemByName("item_blink") || 
                          Me.GetItemByName("item_overwhelming_blink") || 
                          Me.GetItemByName("item_swift_blink") || 
                          Me.GetItemByName("item_arcane_blink");

        // Вибір доступного методу переміщення (Пріоритет на скіли)
        const activeBlink = (blinkSkill && blinkSkill.CanBeCasted()) ? blinkSkill : 
                            (blinkItem && blinkItem.CanBeCasted()) ? blinkItem : null;

        if (activeBlink) {
            // Розрахунок точки стрибка (макс 1150 одиниць)
            const blinkPos = Me.Position.Extend(target, 1150);
            
            // @ts-ignore
            Me.CastPosition(activeBlink, blinkPos);
            Sleeper.Sleep(400); // Пауза між стрибками
        }
    }

    // ==========================================
    // 2. ЛОГІКА РУХУ (ЗАФІКСОВАНО - ПРАЙМ)
    // ==========================================
    if (now - lastTick >= 100) {
        lastTick = now;
        
        // Додаємо рандомний розкид у фонтані (радіус 400)
        target.x += (Math.random() * 800 - 400);
        target.y += (Math.random() * 800 - 400);

        try {
            // Пряме керування через HoldOrdersTarget
            // @ts-ignore
            ExecuteOrder.HoldOrdersTarget = target;
            // Рух з ігноруванням перевірок (Bypass)
            // @ts-ignore
            Me.MoveTo(target, false, true);
        } catch (e) {
            // @ts-ignore
            Me.MoveTo(target);
        }
    }
});

console.log("best cheat octorine PRIME V51: English & Russian support loaded!");
