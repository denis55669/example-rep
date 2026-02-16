import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Unit,
    ExecuteOrder,
    TickSleeper,
    Entity // Додаємо для відстеження смерті
} from "github.com/octarine-public/wrapper/index"

// Ініціалізація сліпера
const Sleeper = new TickSleeper();

// --- ЛОКАЛІЗАЦІЯ ---
Menu.Localization.AddLocalizationUnit("english", new Map([
    ["feed_node", "Feed & Grief"],
    ["run_radiant", "1. Feed RADIANT (Down)"],
    ["run_dire", "2. Feed DIRE (Up)"],
    ["fast_feed", "3. Fast Feed (Blinks & Skills)"],
    ["auto_taunt", "4. Auto-Taunt on Death"],
    ["chat_grief", "5. Chat Spam on Death"]
]));

Menu.Localization.AddLocalizationUnit("russian", new Map([
    ["feed_node", "Фид и Гриф"],
    ["run_radiant", "1. Фид RADIANT (Вниз)"],
    ["run_dire", "2. Фид DIRE (Вверх)"],
    ["fast_feed", "3. Быстрый фид (Блинки и Скиллы)"],
    ["auto_taunt", "4. Авто-насмешка при смерти"],
    ["chat_grief", "5. Спам в чат при смерти"]
]));

// --- МЕНЮ (Utility -> Bad Guy -> Feed) ---
const UtilityEntry = Menu.AddEntry("Utility");
const BadGuyNode = UtilityEntry.AddNode("Bad Guy", "panorama/images/items/shadow_amulet_png.vtex_c");
const FeedNode = BadGuyNode.AddNode("feed_node", "panorama/images/spellicons/skeleton_king_reincarnation_png.vtex_c");

const RunToRadiant = FeedNode.AddToggle("run_radiant", false);
const RunToDire = FeedNode.AddToggle("run_dire", false);
const FastFeed = FeedNode.AddToggle("fast_feed", true);
const AutoTaunt = FeedNode.AddToggle("auto_taunt", true);
const ChatGrief = FeedNode.AddToggle("chat_grief", false);

// Координати баз
const BASE_RADIANT = new Vector3(-7200, -6600, 384);
const BASE_DIRE = new Vector3(7200, 6500, 384);

let lastTick = 0;

// Відстеження смерті для насмішки та чату
EventsSDK.on("LifeStateChanged", (entity: Entity) => {
    const Me = LocalPlayer?.Hero;
    if (entity === Me && !Me.IsAlive) {
        // 1. АВТО-НАСМІШКА
        if (AutoTaunt.value) {
            EventsSDK.ExecuteCommand("use_item_client current_hero_taunt");
        }
        // 2. СПАМ В ЧАТ
        if (ChatGrief.value) {
            EventsSDK.ExecuteCommand("say Gg ez, nice game!");
        }
    }
});

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    if (!RunToRadiant.value && !RunToDire.value) return;

    let target = RunToRadiant.value ? BASE_RADIANT.Clone() : BASE_DIRE.Clone();

    // ==========================================
    // 1. FAST FEED (Blinks & Abilities)
    // ==========================================
    if (FastFeed.value && !Sleeper.Sleeping && Me.Distance(target) > 800) {
        const blinkSkill = Me.GetAbilityByName("antimage_blink") || 
                           Me.GetAbilityByName("queenofpain_blink") || 
                           Me.GetAbilityByName("faceless_void_time_walk");

        const blinkItem = Me.GetItemByName("item_blink") || 
                          Me.GetItemByName("item_overwhelming_blink");

        const activeBlink = (blinkSkill && blinkSkill.CanBeCasted()) ? blinkSkill : 
                            (blinkItem && blinkItem.CanBeCasted()) ? blinkItem : null;

        if (activeBlink) {
            // @ts-ignore
            Me.CastPosition(activeBlink, Me.Position.Extend(target, 1150));
            Sleeper.Sleep(400); 
        }
    }

    // ==========================================
    // 2. ЛОГІКА РУХУ (ПРАЙМ БАЗА V36)
    // ==========================================
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
});

console.log("best cheat octorine: Toxic V56 Loaded!");
