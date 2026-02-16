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
    ["feed_node", "Feed (Legendary)"],
    ["run_radiant", "1. Feed RADIANT (Down)"],
    ["run_dire", "2. Feed DIRE (Up)"],
    ["fast_feed", "3. Fast Feed (Blinks & Skills)"],
    ["boost_node", "Hour Booster (Smart)"],
    ["enable_smart", "Enable Smart XP Farm"],
    ["auto_accept", "Auto Accept Match"],
    ["auto_pt", "Auto Buy Power Treads"],
    ["auto_skill", "Auto Level Up Skills"]
]));

Menu.Localization.AddLocalizationUnit("russian", new Map([
    ["feed_node", "Фид (Легендарный)"],
    ["run_radiant", "1. Фид RADIANT (Вниз)"],
    ["run_dire", "2. Фид DIRE (Вверх)"],
    ["fast_feed", "3. Быстрый фид (Блинки и Скиллы)"],
    ["boost_node", "Буст Часов (Умный)"],
    ["enable_smart", "Включить Умный Фарм (XP)"],
    ["auto_accept", "Авто-принятие игры"],
    ["auto_pt", "Авто-покупка ПТ"],
    ["auto_skill", "Авто-прокачка скиллов"]
]));

// --- МЕНЮ ---
const UtilityEntry = Menu.AddEntry("Utility");

// 1. BAD GUY (ФИДЕР - ПРАЙМ ВЕРСИЯ)
const BadGuyNode = UtilityEntry.AddNode("Bad Guy", "panorama/images/items/shadow_amulet_png.vtex_c");
const FeedNode = BadGuyNode.AddNode("feed_node", "panorama/images/spellicons/skeleton_king_reincarnation_png.vtex_c");
const RunToRadiant = FeedNode.AddToggle("run_radiant", false);
const RunToDire = FeedNode.AddToggle("run_dire", false);
const FastFeed = FeedNode.AddToggle("fast_feed", true);

// 2. SMART BOOSTER (БОТ ПО ТВОЕМУ ГАЙДУ)
const BoostNode = UtilityEntry.AddNode("boost_node", "panorama/images/items/tome_of_knowledge_png.vtex_c");
const EnableSmart = BoostNode.AddToggle("enable_smart", false);
const AutoAccept = BoostNode.AddToggle("auto_accept", true);
const AutoPT = BoostNode.AddToggle("auto_pt", true);
const AutoSkill = BoostNode.AddToggle("auto_skill", true);

// --- КООРДИНАТЫ БАЗ (ФИД) ---
const BASE_RADIANT = new Vector3(-7200, -6600, 384);
const BASE_DIRE = new Vector3(7200, 6500, 384);

// --- КООРДИНАТЫ ЛИНИЙ (БОТ) ---
// Radiant
const RAD_BOT = new Vector3(6200, -6200, 256); // Низ
const RAD_MID = new Vector3(-650, -350, 256);  // Мид
const RAD_TOP = new Vector3(-6200, 5500, 256); // Верх
const RAD_JUNGLE = new Vector3(1000, -4000, 256); // Лес

// Dire
const DIRE_BOT = new Vector3(6200, -5500, 256);
const DIRE_MID = new Vector3(650, 350, 256);
const DIRE_TOP = new Vector3(-4500, 5800, 256);
const DIRE_JUNGLE = new Vector3(4000, 3000, 256);

let lastTick = 0;
let lastMove = 0;

EventsSDK.on("PostDataUpdate", () => {
    // АВТО-ПРИНЯТИЕ
    if (AutoAccept.value && GameState.IsMatchFound && !GameState.HasAccepted) {
        EventsSDK.ExecuteCommand("dota_accept_match");
        return;
    }

    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    // ==========================================
    // 1. ФИДЕР (LEGENDARY V53 LOGIC)
    // ==========================================
    if (RunToRadiant.value || RunToDire.value) {
        let target = RunToRadiant.value ? BASE_RADIANT.Clone() : BASE_DIRE.Clone();

        // Блинки (Скиллы + Предметы)
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
                Sleeper.Sleep(350, "blink"); 
            }
        }

        // Движение с байпасом (V36 Base)
        if (Date.now() - lastTick >= 100) {
            lastTick = Date.now();
            target.x += (Math.random() * 800 - 400);
            target.y += (Math.random() * 800 - 400);
            try {
                // @ts-ignore
                ExecuteOrder.HoldOrdersTarget = target;
                // @ts-ignore
                Me.MoveTo(target, false, true); // ВАЖНО: false, true
            } catch (e) {
                // @ts-ignore
                Me.MoveTo(target);
            }
        }
        return; // Если фидим - бот не работает
    }

    // ==========================================
    // 2. БОТ (SMART BOOSTER)
    // ==========================================
    if (EnableSmart.value) {
        // Авто-скиллы
        if (AutoSkill.value && Me.AbilityPoints > 0 && !Sleeper.Sleeping("skill")) {
            const abilities = Me.Abilities.filter(a => a.CanLevelUp);
            if (abilities.length > 0) {
                // @ts-ignore
                Me.UpgradeAbility(abilities[Math.floor(Math.random() * abilities.length)]);
                Sleeper.Sleep(1000, "skill");
            }
        }
        // Авто-ПТ
        if (AutoPT.value && !Sleeper.Sleeping("buy_pt")) {
            if (!Me.GetItemByName("item_power_treads")) {
                // @ts-ignore
                Me.PurchaseItem("item_power_treads");
                Sleeper.Sleep(5000, "buy_pt");
            }
        }

        // Логика движения
        if (Date.now() - lastMove >= 3000) {
            lastMove = Date.now();
            const isRadiant = LocalPlayer.Team === 2;
            
            // 1. Защита трона (приоритет)
            const ancient = EntityManager.GetEntitiesByClass("npc_dota_fortress").find(e => e.IsMyTeam);
            // @ts-ignore
            if (ancient && ancient.HealthPercent < 100) {
                // @ts-ignore
                Me.MoveTo(ancient.Position);
                return;
            }

            // 2. Выбор линии по твоему гайду
            let target = new Vector3(0,0,0);

            if (Me.Level < 2) {
                // Уровень 1 -> НИЗ
                target = isRadiant ? RAD_BOT.Clone() : DIRE_BOT.Clone();
            } else if (Me.Level >= 2 && Me.Level < 6) {
                // Уровень 2-5 -> МИД
                target = isRadiant ? RAD_MID.Clone() : DIRE_MID.Clone();
            } else if (Me.Level >= 6 && Me.Level < 10) {
                // Уровень 6-9 -> ВЕРХ
                target = isRadiant ? RAD_TOP.Clone() : DIRE_TOP.Clone();
            } else {
                // Уровень 10+ -> ЛЕС
                target = isRadiant ? RAD_JUNGLE.Clone() : DIRE_JUNGLE.Clone();
                // В лесу больше рандома
                target.x += (Math.random() * 1000 - 500);
                target.y += (Math.random() * 1000 - 500);
            }

            // Рандом в деревьях (чтобы не стоять на месте)
            if (Me.Level < 10) {
                target.x += (Math.random() * 300 - 150);
                target.y += (Math.random() * 300 - 150);
            }

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
