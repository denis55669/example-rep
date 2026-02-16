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
    Ability
} from "github.com/octarine-public/wrapper/index"

const Sleeper = new TickSleeper();

// --- ЛОКАЛІЗАЦІЯ ---
Menu.Localization.AddLocalizationUnit("english", new Map([
    ["feed_node", "Feed (User Original)"],
    ["run_radiant", "1. Feed RADIANT (Down)"],
    ["run_dire", "2. Feed DIRE (Up)"],
    ["fast_feed", "3. Fast Feed (Blinks & Skills)"],
    ["boost_node", "Smart Bot (Feed Engine)"],
    ["enable_smart", "Enable Smart Farm"],
    ["auto_accept", "Auto Accept Match"],
    ["auto_queue", "Auto Find (Button Press)"],
    ["auto_items", "Auto Buy (PT -> BF -> MoM)"],
    ["auto_skill", "Auto Level Up Skills"]
]));

Menu.Localization.AddLocalizationUnit("russian", new Map([
    ["feed_node", "Фид (Твой Оригинал)"],
    ["run_radiant", "1. Фид RADIANT (Вниз)"],
    ["run_dire", "2. Фид DIRE (Вверх)"],
    ["fast_feed", "3. Быстрый фид (Блинки и Скиллы)"],
    ["boost_node", "Смарт Бот (Движок Фида)"],
    ["enable_smart", "Включить Умный Фарм"],
    ["auto_accept", "Авто-принятие игры"],
    ["auto_queue", "Авто-Поиск (Жмет кнопку)"],
    ["auto_items", "Авто-закуп (ПТ -> БФ -> МОМ)"],
    ["auto_skill", "Авто-прокачка скиллов"]
]));

// --- МЕНЮ ---
const UtilityEntry = Menu.AddEntry("Utility");

// 1. BAD GUY (ТВОЙ ФИДЕР)
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

// --- КООРДИНАТЫ ---
const BASE_RADIANT = new Vector3(-7200, -6600, 384);
const BASE_DIRE = new Vector3(7200, 6500, 384);

// Точки для Бота (Деревья/Лес)
const RAD_BOT_TREE = new Vector3(6200, -6200, 256); 
const RAD_MID_TREE = new Vector3(-650, -350, 256);
const RAD_TOP_TREE = new Vector3(-6200, 5500, 256);
const RAD_JUNGLE = new Vector3(1000, -4000, 256);

const DIRE_BOT_TREE = new Vector3(6200, -5500, 256);
const DIRE_MID_TREE = new Vector3(650, 350, 256);
const DIRE_TOP_TREE = new Vector3(-4500, 5800, 256);
const DIRE_JUNGLE = new Vector3(4000, 3000, 256);

let lastFeedTick = 0;
let lastBotTick = 0;

EventsSDK.on("PostDataUpdate", () => {
    // ГЛОБАЛЬНО: АВТО-ПРИНЯТИЕ
    if (AutoAccept.value && GameState.IsMatchFound && !GameState.HasAccepted) {
        EventsSDK.ExecuteCommand("dota_accept_match");
        return;
    }

    // ГЛОБАЛЬНО: АВТО-ПОИСК
    if (EnableSmart.value && AutoQueue.value) {
        if (!GameState.IsInGame && !GameState.IsSearching && !GameState.IsMatchFound) {
            if (!Sleeper.Sleeping("queue_spam")) {
                EventsSDK.ExecuteCommand("dota_match_find_match");
                Sleeper.Sleep(5000, "queue_spam");
            }
        }
    }

    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // ==========================================
    // 1. ФИДЕР (ТВОЙ КОД - БЕЗ ИЗМЕНЕНИЙ)
    // ==========================================
    if (RunToRadiant.value || RunToDire.value) {
        let target = RunToRadiant.value ? BASE_RADIANT.Clone() : BASE_DIRE.Clone();

        // Fast Feed (Blinks & Abilities)
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
                // @ts-ignore
                Me.CastPosition(activeBlink, Me.Position.Extend(target, 1150));
                Sleeper.Sleep(400); 
            }
        }

        // ЛОГІКА РУХУ (ПРАЙМ БАЗА V36)
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
        return; // Если фидим - бот не работает
    }

    // ==========================================
    // 2. СМАРТ БОТ (НА ДВИЖКЕ ФИДЕРА)
    // ==========================================
    if (EnableSmart.value) {
        // --- АВТОМАТИЗАЦИЯ (СКИЛЛЫ/ПРЕДМЕТЫ) ---
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

        // --- ДВИЖЕНИЕ (КОПИПАСТ С ФИДЕРА) ---
        if (now - lastBotTick >= 200) { // Чуть медленнее фида (200мс), но все равно очень быстро
            lastBotTick = now;
            const isRadiant = LocalPlayer.Team === 2;
            
            // 1. ЗАЩИТА ТРОНА (Приоритет)
            const ancient = EntityManager.GetEntitiesByClass("npc_dota_fortress").find(e => e.IsMyTeam);
            // @ts-ignore
            if (ancient && ancient.HealthPercent < 100) {
                // @ts-ignore
                ExecuteOrder.HoldOrdersTarget = ancient.Position;
                // @ts-ignore
                Me.MoveTo(ancient.Position, false, true); // BYPASS
                return;
            }

            // 2. ВЫБОР ТОЧКИ (ТВОЙ СЦЕНАРИЙ)
            let target = new Vector3(0,0,0);

            if (Me.Level < 2) { 
                target = isRadiant ? RAD_BOT_TREE.Clone() : DIRE_BOT_TREE.Clone();
            } else if (Me.Level >= 2 && Me.Level < 6) { 
                target = isRadiant ? RAD_MID_TREE.Clone() : DIRE_MID_TREE.Clone();
            } else if (Me.Level >= 6 && Me.Level < 10) { 
                target = isRadiant ? RAD_TOP_TREE.Clone() : DIRE_TOP_TREE.Clone();
            } else { 
                target = isRadiant ? RAD_JUNGLE.Clone() : DIRE_JUNGLE.Clone();
                // В лесу больше рандома
                target.x += (Math.random() * 1000 - 500);
                target.y += (Math.random() * 1000 - 500);
            }

            // Добавляем микро-рандом как в фидере (чтобы движение не стопилось)
            if (Me.Level < 10) {
                target.x += (Math.random() * 200 - 100);
                target.y += (Math.random() * 200 - 100);
            }

            // 3. ИСПОЛНЕНИЕ (МЕТОД ФИДЕРА)
            try {
                // @ts-ignore
                ExecuteOrder.HoldOrdersTarget = target;
                // @ts-ignore
                Me.MoveTo(target, false, true); // ВОТ ОНО - БАЙПАС
            } catch (e) {
                // @ts-ignore
                Me.MoveTo(target);
            }
        }
    }
});
