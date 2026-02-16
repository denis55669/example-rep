import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Unit,
    ExecuteOrder,
    TickSleeper,
    GameState,
    EntityManager,
    Ability,
    GameRules
} from "github.com/octarine-public/wrapper/index"

const Sleeper = new TickSleeper();

// --- ЛОКАЛІЗАЦІЯ ---
Menu.Localization.AddLocalizationUnit("english", new Map([
    ["feed_node", "Feed (Bad Guy)"],
    ["run_radiant", "1. Feed RADIANT"],
    ["run_dire", "2. Feed DIRE"],
    ["fast_feed", "3. Fast Feed"],
    ["boost_node", "Smart Hour Booster (V59)"],
    ["enable_smart", "Enable Smart XP Farm"],
    ["auto_accept", "Auto Accept Match"],
    ["auto_queue", "Auto Find Match"],
    ["auto_items", "Auto Buy (PT -> BF -> MoM)"],
    ["auto_skill", "Auto Level Up Skills"]
]));

Menu.Localization.AddLocalizationUnit("russian", new Map([
    ["feed_node", "Фид (Bad Guy)"],
    ["run_radiant", "1. Фид RADIANT"],
    ["run_dire", "2. Фид DIRE"],
    ["fast_feed", "3. Быстрый фид"],
    ["boost_node", "Умный Буст Часов (V59)"],
    ["enable_smart", "Включить Умный Фарм"],
    ["auto_accept", "Авто-принятие игры"],
    ["auto_queue", "Авто-Поиск"],
    ["auto_items", "Авто-закуп (ПТ -> БФ -> МОМ)"],
    ["auto_skill", "Авто-прокачка скиллов"]
]));

// --- МЕНЮ ---
const UtilityEntry = Menu.AddEntry("Utility");

// 1. BAD GUY (ФИДЕР)
const BadGuyNode = UtilityEntry.AddNode("Bad Guy", "panorama/images/items/shadow_amulet_png.vtex_c");
const FeedNode = BadGuyNode.AddNode("feed_node", "panorama/images/spellicons/skeleton_king_reincarnation_png.vtex_c");
const RunToRadiant = FeedNode.AddToggle("run_radiant", false);
const RunToDire = FeedNode.AddToggle("run_dire", false);
const FastFeed = FeedNode.AddToggle("fast_feed", true);

// 2. SMART BOOSTER (V59 + ITEMS)
const BoostNode = UtilityEntry.AddNode("boost_node", "panorama/images/items/tome_of_knowledge_png.vtex_c");
const EnableSmart = BoostNode.AddToggle("enable_smart", false);
const AutoAccept = BoostNode.AddToggle("auto_accept", true);
const AutoQueue = BoostNode.AddToggle("auto_queue", true); // Добавил кнопку
const AutoItems = BoostNode.AddToggle("auto_items", true); // Добавил кнопку
const AutoSkill = BoostNode.AddToggle("auto_skill", true); // Добавил кнопку

// --- КООРДИНАТЫ ИЗ V59 (ТОЧНЫЕ) ---
const RAD_BOT_XP = new Vector3(5800, -5200, 256);
const RAD_MID_XP = new Vector3(-600, -400, 256);
const RAD_TOP_XP = new Vector3(-5800, 5000, 256);
const RAD_JUNGLE = new Vector3(1000, -4000, 256);

const DIRE_BOT_XP = new Vector3(6000, -4500, 256);
const DIRE_MID_XP = new Vector3(400, 200, 256);
const DIRE_TOP_XP = new Vector3(-4500, 5800, 256);
const DIRE_JUNGLE = new Vector3(4000, 3000, 256);

// Координаты Фидера
const BASE_RADIANT = new Vector3(-7200, -6600, 384);
const BASE_DIRE = new Vector3(7200, 6500, 384);

let lastMoveTick = 0;
let lastFeedTick = 0;

EventsSDK.on("PostDataUpdate", () => {
    // 1. АВТО-ПРИНЯТИЕ
    if (AutoAccept.value && GameState.IsMatchFound && !GameState.HasAccepted) {
        EventsSDK.ExecuteCommand("dota_accept_match");
        return;
    }

    // 2. АВТО-ПОИСК (Аккуратно, без спама)
    if (EnableSmart.value && AutoQueue.value) {
        if (!GameState.IsInGame && !GameState.IsSearching && !GameState.IsMatchFound) {
            if (!Sleeper.Sleeping("queue")) {
                EventsSDK.ExecuteCommand("dota_match_find_match");
                Sleeper.Sleep(5000, "queue");
            }
        }
    }

    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // ==========================================
    // ЛОГИКА 1: ФИДЕР (ПРИОРИТЕТ)
    // ==========================================
    if (RunToRadiant.value || RunToDire.value) {
        let target = RunToRadiant.value ? BASE_RADIANT.Clone() : BASE_DIRE.Clone();
        
        if (FastFeed.value && !Sleeper.Sleeping("blink") && Me.Distance(target) > 800) {
            const blinkSkill = Me.GetAbilityByName("antimage_blink") || Me.GetAbilityByName("queenofpain_blink") || Me.GetAbilityByName("faceless_void_time_walk");
            const blinkItem = Me.GetItemByName("item_blink");
            const activeBlink = (blinkSkill && blinkSkill.CanBeCasted()) ? blinkSkill : (blinkItem && blinkItem.CanBeCasted()) ? blinkItem : null;
            if (activeBlink) {
                // @ts-ignore
                Me.CastPosition(activeBlink, Me.Position.Extend(target, 1150));
                Sleeper.Sleep(400, "blink");
            }
        }

        if (now - lastFeedTick >= 100) {
            lastFeedTick = now;
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
        return; 
    }

    // ==========================================
    // ЛОГИКА 2: СМАРТ БОТ (V59 СТРОГО)
    // ==========================================
    if (EnableSmart.value) {

        // --- ДОБАВКИ: ЗАКУП И СКИЛЛЫ ---
        if (AutoSkill.value && Me.AbilityPoints > 0 && !Sleeper.Sleeping("skill")) {
            const abilities = Me.Abilities.filter(a => a.CanLevelUp);
            if (abilities.length > 0) {
                // @ts-ignore
                Me.UpgradeAbility(abilities[Math.floor(Math.random() * abilities.length)]);
                Sleeper.Sleep(1000, "skill");
            }
        }
        if (AutoItems.value && !Sleeper.Sleeping("buy_items")) {
            if (!Me.GetItemByName("item_power_treads")) {
                // @ts-ignore
                Me.PurchaseItem("item_power_treads");
                Sleeper.Sleep(2000, "buy_items");
            } else if (!Me.GetItemByName("item_bfury")) {
                // @ts-ignore
                Me.PurchaseItem("item_bfury");
                Sleeper.Sleep(2000, "buy_items");
            } else if (!Me.GetItemByName("item_mask_of_madness")) {
                // @ts-ignore
                Me.PurchaseItem("item_mask_of_madness");
                Sleeper.Sleep(2000, "buy_items");
            }
        }

        // --- ДВИЖЕНИЕ (ОРИГИНАЛ V59) ---
        if (now - lastMoveTick >= 3000) { // Таймер 3 секунды, как было
            lastMoveTick = now;
            
            const isRadiant = LocalPlayer.Team === 2;
            let target = new Vector3(0, 0, 0);

            // ЗАЩИТА ТРОНА (ЕДИНСТВЕННОЕ ВАЖНОЕ ДОБАВЛЕНИЕ)
            const ancient = EntityManager.GetEntitiesByClass("npc_dota_fortress").find(e => e.IsMyTeam);
            // @ts-ignore
            if (ancient && ancient.HealthPercent < 100) {
                // @ts-ignore
                Me.MoveTo(ancient.Position);
                return;
            }

            // ЛОГИКА V59
            if (Me.Level < 2) {
                target = isRadiant ? RAD_BOT_XP.Clone() : DIRE_BOT_XP.Clone();
            } else if (Me.Level >= 2 && Me.Level < 6) {
                target = isRadiant ? RAD_MID_XP.Clone() : DIRE_MID_XP.Clone();
            } else if (Me.Level >= 6 && Me.Level < 10) {
                target = isRadiant ? RAD_TOP_XP.Clone() : DIRE_TOP_XP.Clone();
            } else {
                target = isRadiant ? RAD_JUNGLE.Clone() : DIRE_JUNGLE.Clone();
                target.x += (Math.random() * 2000 - 1000);
                target.y += (Math.random() * 2000 - 1000);
            }

            if (Me.Level < 10) {
                target.x += (Math.random() * 300 - 150);
                target.y += (Math.random() * 300 - 150);
            }

            try {
                // ТОТ ЖЕ МЕТОД, ЧТО РАБОТАЛ У ТЕБЯ
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
