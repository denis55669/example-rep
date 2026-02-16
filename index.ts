import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Unit,
    ExecuteOrder,
    TickSleeper
} from "github.com/octarine-public/wrapper/index"

// Ініціалізація сліпера для пауз між блінками
const Sleeper = new TickSleeper();

// --- ЛОКАЛІЗАЦІЯ (RU/EN) ---
Menu.Localization.AddLocalizationUnit("english", new Map([
    ["bad_guy_name", "Bad Guy"],
    ["feed_node", "Feed"],
    ["run_radiant", "1. Feed RADIANT (Down)"],
    ["run_dire", "2. Feed DIRE (Up)"],
    ["fast_feed", "3. Fast Feed (Blinks & Skills)"]
]));

Menu.Localization.AddLocalizationUnit("russian", new Map([
    ["bad_guy_name", "Плохой парень"],
    ["feed_node", "Фид"],
    ["run_radiant", "1. Фид RADIANT (Вниз)"],
    ["run_dire", "2. Фид DIRE (Вверх)"],
    ["fast_feed", "3. Быстрый фид (Блинки и Скиллы)"]
]));

// --- МЕНЮ (Переїзд у Bad Guy) ---
// Створюємо окрему категорію Bad Guy
const BadGuyEntry = Menu.AddEntry("bad_guy_name", "panorama/images/items/shadow_amulet_png.vtex_c");
// Вузол фіду з іконкою скелета
const FeedNode = BadGuyEntry.AddNode("feed_node", "panorama/images/spellicons/skeleton_king_reincarnation_png.vtex_c");

const RunToRadiant = FeedNode.AddToggle("run_radiant", false);
const RunToDire = FeedNode.AddToggle("run_dire", false);
const FastFeed = FeedNode.AddToggle("fast_feed", true);

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

    let target = RunToRadiant.value ? BASE_RADIANT.Clone() : BASE_DIRE.Clone();

    // ==========================================
    // 1. FAST FEED (Blinks & Abilities)
    // ==========================================
    if (FastFeed.value && !Sleeper.Sleeping && Me.Distance(target) > 800) {
        
        // Здібності героїв (AM, QoP, Void)
        const blinkSkill = Me.GetAbilityByName("antimage_blink") || 
                           Me.GetAbilityByName("queenofpain_blink") || 
                           Me.GetAbilityByName("faceless_void_time_walk") ||
                           Me.GetAbilityByName("void_spirit_astral_step");

        // Предмети блінку
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

    // ==========================================
    // 2. ЛОГІКА РУХУ (ПРАЙМ БАЗА V36)
    // ==========================================
    if (now - lastTick >= 100) {
        lastTick = now;
        
        // Рандомний розкид 400 для фонтану
        target.x += (Math.random() * 800 - 400);
        target.y += (Math.random() * 800 - 400);

        try {
            // @ts-ignore
            ExecuteOrder.HoldOrdersTarget = target;
            // Рух з байпасом перевірок
            // @ts-ignore
            Me.MoveTo(target, false, true);
        } catch (e) {
            // @ts-ignore
            Me.MoveTo(target);
        }
    }
});

console.log("best cheat octorine: V54 Bad Guy Edition Loaded!");
