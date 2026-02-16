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

// --- ЛОКАЛИЗАЦИЯ ---
Menu.Localization.AddLocalizationUnit("english", new Map([
    ["feed_node", "Feed (YOUR WORKING)"],
    ["run_radiant", "1. Feed RADIANT"],
    ["run_dire", "2. Feed DIRE"],
    ["boost_node", "Smart Bot (V59 Engine)"],
    ["enable_smart", "Enable Smart Farm"],
    ["auto_accept", "Auto Accept Match"],
    ["auto_queue", "Auto Find Match"],
    ["auto_items", "Auto Buy (PT -> BF -> MoM)"],
    ["auto_skill", "Auto Level Up Skills"]
]));

Menu.Localization.AddLocalizationUnit("russian", new Map([
    ["feed_node", "Фид (ТВОЙ РАБОЧИЙ)"],
    ["run_radiant", "1. Фид RADIANT"],
    ["run_dire", "2. Фид DIRE"],
    ["boost_node", "Смарт Бот (Движок V59)"],
    ["enable_smart", "Включить Умный Фарм"],
    ["auto_accept", "Авто-принятие игры"],
    ["auto_queue", "Авто-Поиск"],
    ["auto_items", "Авто-закуп (ПТ -> БФ -> МОМ)"],
    ["auto_skill", "Авто-прокачка скиллов"]
]));

const UtilityEntry = Menu.AddEntry("Utility");

// 1. BAD GUY (ТВОЙ ФИДЕР - БЕЗ ИЗМЕНЕНИЙ)
const BadGuyNode = UtilityEntry.AddNode("Bad Guy", "panorama/images/items/shadow_amulet_png.vtex_c");
const FeedNode = BadGuyNode.AddNode("feed_node", "panorama/images/spellicons/skeleton_king_reincarnation_png.vtex_c");
const RunToRadiant = FeedNode.AddToggle("run_radiant", false);
const RunToDire = FeedNode.AddToggle("run_dire", false);
const FastFeed = FeedNode.AddToggle("fast_feed", true);

// 2. SMART BOOSTER (БОТ)
const BoostNode = UtilityEntry.AddNode("boost_node", "panorama/images/items/tome_of_knowledge_png.vtex_c");
const EnableSmart = BoostNode.AddToggle("enable_smart", false);
const AutoAccept = BoostNode.AddToggle("auto_accept", true);
const AutoQueue = BoostNode.AddToggle("auto_queue", true);
const AutoItems = BoostNode.AddToggle("auto_items", true);
const AutoSkill = BoostNode.AddToggle("auto_skill", true);

// Координаты
const BASE_RADIANT = new Vector3(-7200, -6600, 384);
const BASE_DIRE = new Vector3(7200, 6500, 384);

const RAD_XP = [new Vector3(5800, -5200, 256), new Vector3(-600, -400, 256), new Vector3(-5800, 5000, 256), new Vector3(1000, -4000, 256)];
const DIRE_XP = [new Vector3(6000, -4500, 256), new Vector3(400, 200, 256), new Vector3(-4500, 5800, 256), new Vector3(4000, 3000, 256)];

let lastFeedTick = 0;
let lastBotTick = 0;

EventsSDK.on("PostDataUpdate", () => {
    // АВТО-ПРИНЯТИЕ
    if (AutoAccept.value && GameState.IsMatchFound && !GameState.HasAccepted) {
        EventsSDK.ExecuteCommand("dota_accept_match");
        return;
    }

    // АВТО-ПОИСК
    if (EnableSmart.value && AutoQueue.value && !GameState.IsInGame && !GameState.IsSearching) {
        if (!Sleeper.Sleeping("queue")) {
            EventsSDK.ExecuteCommand("dota_match_find_match");
            Sleeper.Sleep(5000, "queue");
        }
    }

    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // ==========================================
    // ЛОГИКА 1: ФИДЕР (ТВОЙ КОД)
    // ==========================================
    if (RunToRadiant.value || RunToDire.value) {
        let target = RunToRadiant.value ? BASE_RADIANT.Clone() : BASE_DIRE.Clone();
        if (FastFeed.value && !Sleeper.Sleeping && Me.Distance(target) > 800) {
            const blink = Me.GetAbilityByName("antimage_blink") || Me.GetItemByName("item_blink");
            if (blink && blink.CanBeCasted()) {
                // @ts-ignore
                Me.CastPosition(blink, Me.Position.Extend(target, 1150));
                Sleeper.Sleep(400); 
            }
        }
        if (now - lastFeedTick >= 100) {
            lastFeedTick = now;
            target.x += (Math.random() * 800 - 400);
            target.y += (Math.random() * 800 - 400);
            // @ts-ignore
            ExecuteOrder.HoldOrdersTarget = target;
            // @ts-ignore
            Me.MoveTo(target, false, true);
        }
        return; 
    }

    // ==========================================
    // ЛОГИКА 2: БОТ (УЛУЧШЕННЫЙ V59)
    // ==========================================
    if (EnableSmart.value) {
        // Закуп и Скиллы
        if (AutoSkill.value && Me.AbilityPoints > 0 && !Sleeper.Sleeping("skill")) {
            const abilities = Me.Abilities.filter(a => a.CanLevelUp);
            if (abilities.length > 0) {
                // @ts-ignore
                Me.UpgradeAbility(abilities[Math.floor(Math.random() * abilities.length)]);
                Sleeper.Sleep(1000, "skill");
            }
        }
        if (AutoItems.value && !Sleeper.Sleeping("buy")) {
            const item = !Me.GetItemByName("item_power_treads") ? "item_power_treads" : !Me.GetItemByName("item_bfury") ? "item_bfury" : !Me.GetItemByName("item_mask_of_madness") ? "item_mask_of_madness" : null;
            if (item) {
                // @ts-ignore
                Me.PurchaseItem(item);
                Sleeper.Sleep(3000, "buy");
            }
        }

        // Движение (Интервал 1 сек для баланса)
        if (now - lastBotTick >= 1000) {
            lastBotTick = now;
            const isRadiant = LocalPlayer.Team === 2;
            const ancient = EntityManager.GetEntitiesByClass("npc_dota_fortress").find(e => e.IsMyTeam);
            // @ts-ignore
            if (ancient && ancient.HealthPercent < 100) {
                // @ts-ignore
                Me.MoveTo(ancient.Position);
                return;
            }

            let target = (Me.Level < 2) ? (isRadiant ? RAD_XP[0] : DIRE_XP[0]) : (Me.Level < 6) ? (isRadiant ? RAD_XP[1] : DIRE_XP[1]) : (Me.Level < 10) ? (isRadiant ? RAD_XP[2] : DIRE_XP[2]) : (isRadiant ? RAD_XP[3] : DIRE_XP[3]);
            target = target.Clone();
            target.x += (Math.random() * 400 - 200);
            target.y += (Math.random() * 400 - 200);

            // Используем В ПЕРЕМЕШКУ методы, чтобы Дота не игнорила
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
