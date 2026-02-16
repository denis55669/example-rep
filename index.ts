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
    GameRules,
    DOTA_GAMERULES_STATE
} from "github.com/octarine-public/wrapper/index"

const Sleeper = new TickSleeper();

// --- ЛОКАЛИЗАЦИЯ ---
Menu.Localization.AddLocalizationUnit("english", new Map([
    ["night_mode", "NIGHT AFK MODE"],
    ["enable_loop", "Enable Full AFK Loop"],
    ["feed_node", "Feed Mode (Bad Guy)"],
    ["run_radiant", "1. Feed RADIANT"],
    ["run_dire", "2. Feed DIRE"],
    ["boost_node", "Farm Mode (Smart Booster)"],
    ["enable_smart", "Enable XP Farm"],
    ["auto_pt", "Auto Buy Power Treads"],
    ["auto_skill", "Auto Level Up Skills"]
]));

Menu.Localization.AddLocalizationUnit("russian", new Map([
    ["night_mode", "НОЧНОЙ AFK РЕЖИМ"],
    ["enable_loop", "Включить Полный Цикл (Поиск/Пик/Игра)"],
    ["feed_node", "Режим Фида (Bad Guy)"],
    ["run_radiant", "1. Фид RADIANT"],
    ["run_dire", "2. Фид DIRE"],
    ["boost_node", "Режим Фарма (Smart Booster)"],
    ["enable_smart", "Включить Фарм XP"],
    ["auto_pt", "Авто-покупка ПТ"],
    ["auto_skill", "Авто-прокачка скиллов"]
]));

// --- МЕНЮ ---
const UtilityEntry = Menu.AddEntry("Utility");
const NightNode = UtilityEntry.AddNode("night_mode", "panorama/images/items/moon_shard_png.vtex_c");

// ГЛАВНЫЙ ТУМБЛЕР НОЧИ
const EnableLoop = NightNode.AddToggle("enable_loop", true); 

// 1. ФИДЕР
const FeedNode = NightNode.AddNode("feed_node", "panorama/images/spellicons/skeleton_king_reincarnation_png.vtex_c");
const RunToRadiant = FeedNode.AddToggle("run_radiant", false);
const RunToDire = FeedNode.AddToggle("run_dire", false);

// 2. ФАРМЕР
const BoostNode = NightNode.AddNode("boost_node", "panorama/images/items/tome_of_knowledge_png.vtex_c");
const EnableSmart = BoostNode.AddToggle("enable_smart", true); // По умолчанию включен фарм (безопаснее для ночи)
const AutoPT = BoostNode.AddToggle("auto_pt", true);
const AutoSkill = BoostNode.AddToggle("auto_skill", true);

// --- КООРДИНАТЫ ---
const BASE_RADIANT = new Vector3(-7200, -6600, 384);
const BASE_DIRE = new Vector3(7200, 6500, 384);
const RAD_SPOTS = [new Vector3(6200, -6200, 256), new Vector3(-650, -350, 256), new Vector3(-6200, 5500, 256)];
const DIRE_SPOTS = [new Vector3(6200, -5500, 256), new Vector3(650, 350, 256), new Vector3(-4500, 5800, 256)];

let lastTick = 0;
let lastMove = 0;

EventsSDK.on("PostDataUpdate", () => {
    if (!EnableLoop.value) return;

    // ==========================================
    // 1. АВТО-ПРИНЯТИЕ
    // ==========================================
    if (GameState.IsMatchFound && !GameState.HasAccepted) {
        EventsSDK.ExecuteCommand("dota_accept_match");
        return;
    }

    // ==========================================
    // 2. АВТО-ПИК (ОБЯЗАТЕЛЬНО ДЛЯ НОЧИ)
    // ==========================================
    // Если стадия пика (GameState == 20 - DOTA_GAMERULES_STATE_HERO_SELECTION)
    if (GameRules && GameRules.GameState === 20) {
        if (!Sleeper.Sleeping("auto_pick")) {
            // Пытаемся пикнуть по очереди
            EventsSDK.ExecuteCommand("dota_select_hero npc_dota_hero_sniper");
            EventsSDK.ExecuteCommand("dota_select_hero npc_dota_hero_riki");
            EventsSDK.ExecuteCommand("dota_select_hero npc_dota_hero_bounty_hunter");
            Sleeper.Sleep(2000, "auto_pick");
        }
        return;
    }

    // ==========================================
    // 3. АВТО-ДИСКОННЕКТ И ПОИСК (ЦИКЛ)
    // ==========================================
    // Если игра закончилась (POST_GAME = 6)
    if (GameRules && (GameRules.GameState === 6 || GameRules.GameState === 7)) {
        if (!Sleeper.Sleeping("disconnect")) {
            EventsSDK.ExecuteCommand("disconnect");
            Sleeper.Sleep(5000, "disconnect");
        }
    }

    // Если мы в меню (не в игре, не ищем) -> НАЖИМАЕМ ПОИСК
    if (!GameState.IsInGame && !GameState.IsSearching && !GameState.IsMatchFound) {
        if (!Sleeper.Sleeping("queue_night")) {
            EventsSDK.ExecuteCommand("dota_match_find_match");
            Sleeper.Sleep(10000, "queue_night");
        }
    }

    // ==========================================
    // 4. ИГРОВОЙ ПРОЦЕСС
    // ==========================================
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    // --- ЛОГИКА ФАРМА/ПРОКАЧКИ (SMART BOOSTER) ---
    if (EnableSmart.value) {
        // Прокачка скиллов
        if (AutoSkill.value && Me.AbilityPoints > 0 && !Sleeper.Sleeping("skill")) {
            const abilities = Me.Abilities.filter(a => a.CanLevelUp);
            if (abilities.length > 0) {
                // @ts-ignore
                Me.UpgradeAbility(abilities[Math.floor(Math.random() * abilities.length)]);
                Sleeper.Sleep(1000, "skill");
            }
        }
        // Покупка ПТ
        if (AutoPT.value && !Sleeper.Sleeping("buy_pt")) {
            if (!Me.GetItemByName("item_power_treads")) {
                // @ts-ignore
                Me.PurchaseItem("item_power_treads");
                Sleeper.Sleep(5000, "buy_pt");
            }
        }
    }

    // --- ЛОГИКА ДВИЖЕНИЯ (ФИД ИЛИ ФАРМ) ---
    // Если включен ФИД (приоритет)
    if (RunToRadiant.value || RunToDire.value) {
        let target = RunToRadiant.value ? BASE_RADIANT.Clone() : BASE_DIRE.Clone();
        
        // Блинки (если есть)
        if (!Sleeper.Sleeping("blink") && Me.Distance(target) > 800) {
            const blinkSkill = Me.GetAbilityByName("antimage_blink") || Me.GetAbilityByName("queenofpain_blink");
            const blinkItem = Me.GetItemByName("item_blink");
            const activeBlink = (blinkSkill && blinkSkill.CanBeCasted()) ? blinkSkill : (blinkItem && blinkItem.CanBeCasted()) ? blinkItem : null;
            if (activeBlink) {
                // @ts-ignore
                Me.CastPosition(activeBlink, Me.Position.Extend(target, 1150));
                Sleeper.Sleep(400, "blink"); 
            }
        }
        // Движение
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

    // Если включен ФАРМ (SMART BOOSTER)
    if (EnableSmart.value && Date.now() - lastMove >= 3000) {
        lastMove = Date.now();
        const isRadiant = LocalPlayer.Team === 2;
        
        // Защита трона
        const ancient = EntityManager.GetEntitiesByClass("npc_dota_fortress").find(e => e.IsMyTeam);
        // @ts-ignore
        if (ancient && ancient.HealthPercent < 100) {
            // @ts-ignore
            Me.MoveTo(ancient.Position);
            return;
        }

        // Выбор линии по уровню (1-2, 3-4, 5-6...)
        const cycle = Math.floor((Me.Level - 1) / 2) % 3;
        let spots = isRadiant ? RAD_SPOTS : DIRE_SPOTS;
        let target = spots[cycle].Clone();

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

console.log("best cheat octorine: V70 NIGHT LOOP LOADED");
