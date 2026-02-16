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

Menu.Localization.AddLocalizationUnit("english", new Map([
    ["feed_node", "Feed"],
    ["run_radiant", "1. Feed RADIANT (Down)"],
    ["run_dire", "2. Feed DIRE (Up)"],
    ["fast_feed", "3. Fast Feed (Blinks & Skills)"],
    ["boost_node", "Smart Hour Booster"],
    ["enable_smart", "Enable Smart XP Farm"],
    ["auto_queue", "Auto Queue (Press Find Match)"],
    ["auto_pt", "Auto Buy Power Treads"],
    ["auto_skill", "Auto Level Up Skills"]
]));

Menu.Localization.AddLocalizationUnit("russian", new Map([
    ["feed_node", "Фид"],
    ["run_radiant", "1. Фид RADIANT (Вниз)"],
    ["run_dire", "2. Фид DIRE (Вверх)"],
    ["fast_feed", "3. Быстрый фид (Блинки и Скиллы)"],
    ["boost_node", "Умный Буст Часов"],
    ["enable_smart", "Включить Умный Фарм (XP)"],
    ["auto_queue", "Авто-Поиск (Нажимает 'Искать')"],
    ["auto_pt", "Авто-покупка ПТ"],
    ["auto_skill", "Авто-прокачка скиллов"]
]));

const UtilityEntry = Menu.AddEntry("Utility");
const BadGuyNode = UtilityEntry.AddNode("Bad Guy", "panorama/images/items/shadow_amulet_png.vtex_c");
const FeedNode = BadGuyNode.AddNode("feed_node", "panorama/images/spellicons/skeleton_king_reincarnation_png.vtex_c");

const RunToRadiant = FeedNode.AddToggle("run_radiant", false);
const RunToDire = FeedNode.AddToggle("run_dire", false);
const FastFeed = FeedNode.AddToggle("fast_feed", true);

const BoostNode = UtilityEntry.AddNode("boost_node", "panorama/images/items/tome_of_knowledge_png.vtex_c");
const EnableSmart = BoostNode.AddToggle("enable_smart", false);
const AutoQueue = BoostNode.AddToggle("auto_queue", true);
const AutoPT = BoostNode.AddToggle("auto_pt", true);
const AutoSkill = BoostNode.AddToggle("auto_skill", true);

const BASE_RADIANT = new Vector3(-7200, -6600, 384);
const BASE_DIRE = new Vector3(7200, 6500, 384);

const RAD_BOT = new Vector3(6200, -6200, 256);
const RAD_MID = new Vector3(-650, -350, 256);
const RAD_TOP = new Vector3(-6200, 5500, 256);

const DIRE_BOT = new Vector3(6200, -5500, 256);
const DIRE_MID = new Vector3(650, 350, 256);
const DIRE_TOP = new Vector3(-4500, 5800, 256);

let lastTick = 0;
let lastMove = 0;

EventsSDK.on("PostDataUpdate", () => {
    // 1. АВТО-ПОИСК (РАБОТАЕТ В МЕНЮ)
    if (EnableSmart.value && AutoQueue.value) {
        // Проверяем, что мы НЕ в игре и НЕ ищем игру
        if (!GameState.IsInGame && !GameState.IsSearching) {
            if (!Sleeper.Sleeping("queue")) {
                // Просто нажимаем кнопку поиска (использует твои последние настройки региона и мода)
                EventsSDK.ExecuteCommand("dota_match_find_match");
                // Ставим задержку 10 секунд, чтобы не спамить
                Sleeper.Sleep(10000, "queue");
            }
        }
        // Если игра нашлась - принимаем
        if (GameState.IsMatchFound && !GameState.HasAccepted) {
            EventsSDK.ExecuteCommand("dota_accept_match");
        }
    }

    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    // 2. УМНЫЙ ФАРМ (В ИГРЕ)
    if (EnableSmart.value) {
        if (AutoSkill.value && Me.AbilityPoints > 0 && !Sleeper.Sleeping("skill")) {
            const abilities = Me.Abilities.filter(a => a.CanLevelUp);
            if (abilities.length > 0) {
                // @ts-ignore
                Me.UpgradeAbility(abilities[Math.floor(Math.random() * abilities.length)]);
                Sleeper.Sleep(1000, "skill");
            }
        }
        if (AutoPT.value && !Sleeper.Sleeping("buy_pt")) {
            if (!Me.GetItemByName("item_power_treads")) {
                // @ts-ignore
                Me.PurchaseItem("item_power_treads");
                Sleeper.Sleep(5000, "buy_pt");
            }
        }
    }

    // 3. ФИДЕР (BAD GUY)
    if (RunToRadiant.value || RunToDire.value) {
        let target = RunToRadiant.value ? BASE_RADIANT.Clone() : BASE_DIRE.Clone();
        if (FastFeed.value && !Sleeper.Sleeping && Me.Distance(target) > 800) {
            const blinkSkill = Me.GetAbilityByName("antimage_blink") || Me.GetAbilityByName("queenofpain_blink") || Me.GetAbilityByName("faceless_void_time_walk");
            const blinkItem = Me.GetItemByName("item_blink");
            const activeBlink = (blinkSkill && blinkSkill.CanBeCasted()) ? blinkSkill : (blinkItem && blinkItem.CanBeCasted()) ? blinkItem : null;
            if (activeBlink) {
                // @ts-ignore
                Me.CastPosition(activeBlink, Me.Position.Extend(target, 1150));
                Sleeper.Sleep(400); 
            }
        }
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
        return;
    }

    // 4. ДВИЖЕНИЕ ПО ЛИНИЯМ (SMART FARM)
    if (EnableSmart.value && now - lastMove >= 3000) {
        lastMove = now;
        const isRadiant = LocalPlayer.Team === 2;
        const ancient = EntityManager.GetEntitiesByClass("npc_dota_fortress").find(e => e.IsMyTeam);
        
        // @ts-ignore
        if (ancient && ancient.HealthPercent < 100) {
            // @ts-ignore
            Me.MoveTo(ancient.Position);
            return;
        }

        const cycle = Math.floor((Me.Level - 1) / 2) % 3;
        let target = (cycle === 0) ? (isRadiant ? RAD_BOT.Clone() : DIRE_BOT.Clone()) : 
                     (cycle === 1) ? (isRadiant ? RAD_MID.Clone() : DIRE_MID.Clone()) : 
                                    (isRadiant ? RAD_TOP.Clone() : DIRE_TOP.Clone());

        target.x += (Math.random() * 300 - 150);
        target.y += (Math.random() * 300 - 150);

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
