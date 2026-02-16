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
    ["run_radiant", "1. Feed RADIANT (Down)"],
    ["run_dire", "2. Feed DIRE (Up)"],
    ["fast_feed", "3. Fast Feed (Blinks & Skills)"],
    ["boost_node", "Smart Bot (The Working One)"],
    ["enable_smart", "Enable Smart Farm"],
    ["auto_accept", "Auto Accept Match"],
    ["auto_queue", "Auto Find Match (Press Button)"],
    ["auto_items", "Auto Buy (PT -> BF -> MoM)"],
    ["auto_skill", "Auto Level Up Skills"]
]));

Menu.Localization.AddLocalizationUnit("russian", new Map([
    ["feed_node", "Фид (Bad Guy)"],
    ["run_radiant", "1. Фид RADIANT (Вниз)"],
    ["run_dire", "2. Фид DIRE (Вверх)"],
    ["fast_feed", "3. Быстрый фид (Блинки и Скиллы)"],
    ["boost_node", "Смарт Бот (Рабочий)"],
    ["enable_smart", "Включить Умный Фарм"],
    ["auto_accept", "Авто-принятие игры"],
    ["auto_queue", "Авто-Поиск (Жмет кнопку)"],
    ["auto_items", "Авто-закуп (ПТ -> БФ -> МОМ)"],
    ["auto_skill", "Авто-прокачка скиллов"]
]));

// --- МЕНЮ ---
const UtilityEntry = Menu.AddEntry("Utility");

// 1. BAD GUY (ФИДЕР - ТОТ САМЫЙ)
const BadGuyNode = UtilityEntry.AddNode("Bad Guy", "panorama/images/items/shadow_amulet_png.vtex_c");
const FeedNode = BadGuyNode.AddNode("feed_node", "panorama/images/spellicons/skeleton_king_reincarnation_png.vtex_c");
const RunToRadiant = FeedNode.AddToggle("run_radiant", false);
const RunToDire = FeedNode.AddToggle("run_dire", false);
const FastFeed = FeedNode.AddToggle("fast_feed", true);

// 2. SMART BOOSTER (БОТ - ПО ТВОЕМУ КОДУ)
const BoostNode = UtilityEntry.AddNode("boost_node", "panorama/images/items/tome_of_knowledge_png.vtex_c");
const EnableSmart = BoostNode.AddToggle("enable_smart", false);
const AutoAccept = BoostNode.AddToggle("auto_accept", true);
const AutoQueue = BoostNode.AddToggle("auto_queue", true);
const AutoItems = BoostNode.AddToggle("auto_items", true);
const AutoSkill = BoostNode.AddToggle("auto_skill", true);

// --- КООРДИНАТЫ БАЗ (ФИД) ---
const BASE_RADIANT = new Vector3(-7200, -6600, 384);
const BASE_DIRE = new Vector3(7200, 6500, 384);

// --- КООРДИНАТЫ ЛИНИЙ (БОТ - ДЕРЕВЬЯ) ---
// Radiant Safe(Bot) / Mid / Hard(Top) / Jungle
const RAD_BOT_TREE = new Vector3(6200, -6200, 256); 
const RAD_MID_TREE = new Vector3(-650, -350, 256);
const RAD_TOP_TREE = new Vector3(-6200, 5500, 256);
const RAD_JUNGLE = new Vector3(1000, -4000, 256);

// Dire Hard(Bot) / Mid / Safe(Top) / Jungle
const DIRE_BOT_TREE = new Vector3(6200, -5500, 256);
const DIRE_MID_TREE = new Vector3(650, 350, 256);
const DIRE_TOP_TREE = new Vector3(-4500, 5800, 256);
const DIRE_JUNGLE = new Vector3(4000, 3000, 256);

let lastTick = 0;
let lastMove = 0;

EventsSDK.on("PostDataUpdate", () => {
    // 1. АВТО-ПРИНЯТИЕ
    if (AutoAccept.value && GameState.IsMatchFound && !GameState.HasAccepted) {
        EventsSDK.ExecuteCommand("dota_accept_match");
        return;
    }

    // 2. АВТО-ПОИСК (ПРОСТО ЖМЕМ КНОПКУ, ЕСЛИ НЕ В ИГРЕ)
    if (EnableSmart.value && AutoQueue.value) {
        if (!GameState.IsInGame && !GameState.IsSearching && !GameState.IsMatchFound) {
            if (!Sleeper.Sleeping("queue_spam")) {
                EventsSDK.ExecuteCommand("dota_match_find_match");
                Sleeper.Sleep(5000, "queue_spam"); // Жмем раз в 5 сек
            }
        }
    }

    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    // ==========================================
    // ЛОГИКА 1: ФИДЕР (LEGENDARY)
    // ==========================================
    if (RunToRadiant.value || RunToDire.value) {
        let target = RunToRadiant.value ? BASE_RADIANT.Clone() : BASE_DIRE.Clone();

        if (FastFeed.value && !Sleeper.Sleeping("blink") && Me.Distance(target) > 800) {
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
                // @ts-ignore
                Me.CastPosition(activeBlink, Me.Position.Extend(target, 1150));
                Sleeper.Sleep(400, "blink"); 
            }
        }

        if (Date.now() - lastTick >= 100) {
            lastTick = Date.now();
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
    // ЛОГИКА 2: УМНЫЙ ФАРМ (BOT)
    // ==========================================
    if (EnableSmart.value) {
        // АВТО-СКИЛЛЫ (РАНДОМ)
        if (AutoSkill.value && Me.AbilityPoints > 0 && !Sleeper.Sleeping("skill")) {
            const abilities = Me.Abilities.filter(a => a.CanLevelUp);
            if (abilities.length > 0) {
                // @ts-ignore
                Me.UpgradeAbility(abilities[Math.floor(Math.random() * abilities.length)]);
                Sleeper.Sleep(1000, "skill");
            }
        }

        // АВТО-ЗАКУП (PT -> BF -> MOM)
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

        // ДВИЖЕНИЕ (ВОЗВРАТ К РАБОЧЕЙ ЛОГИКЕ)
        if (Date.now() - lastMove >= 1000) { // Интервал 1 секунда
            lastMove = Date.now();
            const isRadiant = LocalPlayer.Team === 2;
            
            // 1. ЗАЩИТА ТРОНА
            const ancient = EntityManager.GetEntitiesByClass("npc_dota_fortress").find(e => e.IsMyTeam);
            // @ts-ignore
            if (ancient && ancient.HealthPercent < 100) {
                // @ts-ignore
                Me.MoveTo(ancient.Position);
                return;
            }

            // 2. ЦИКЛ ЛИНИЙ (ТВОЯ СХЕМА)
            let target = new Vector3(0,0,0);

            if (Me.Level < 2) { 
                // 1 Уровень -> НИЗ
                target = isRadiant ? RAD_BOT_TREE.Clone() : DIRE_BOT_TREE.Clone();
            } else if (Me.Level >= 2 && Me.Level < 6) { 
                // 2-5 Уровень -> МИД
                target = isRadiant ? RAD_MID_TREE.Clone() : DIRE_MID_TREE.Clone();
            } else if (Me.Level >= 6 && Me.Level < 10) { 
                // 6-9 Уровень -> ВЕРХ
                target = isRadiant ? RAD_TOP_TREE.Clone() : DIRE_TOP_TREE.Clone();
            } else { 
                // 10+ Уровень -> ЛЕС
                target = isRadiant ? RAD_JUNGLE.Clone() : DIRE_JUNGLE.Clone();
                // В лесу рандом больше
                target.x += (Math.random() * 1000 - 500);
                target.y += (Math.random() * 1000 - 500);
            }

            // Рандом в точке (чтобы не кикнуло)
            if (Me.Level < 10) {
                target.x += (Math.random() * 300 - 150);
                target.y += (Math.random() * 300 - 150);
            }

            try {
                // ТА ЖЕ МАГИЯ ДВИЖЕНИЯ, ЧТО И В КОДЕ, КОТОРЫЙ ТЫ СКИНУЛ
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
