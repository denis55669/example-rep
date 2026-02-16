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
    ["feed_node", "Feed (Do Not Touch)"],
    ["run_radiant", "1. Feed RADIANT (Down)"],
    ["run_dire", "2. Feed DIRE (Up)"],
    ["fast_feed", "3. Fast Feed (Blinks & Skills)"],
    ["boost_node", "Smart Bot (Fixed)"],
    ["enable_smart", "Enable Smart Farm"],
    ["auto_accept", "Auto Accept Match"],
    ["auto_items", "Auto Buy (PT -> BF -> MoM)"],
    ["auto_skill", "Auto Level Up Skills"]
]));

Menu.Localization.AddLocalizationUnit("russian", new Map([
    ["feed_node", "Фид (Не трогать)"],
    ["run_radiant", "1. Фид RADIANT (Вниз)"],
    ["run_dire", "2. Фид DIRE (Вверх)"],
    ["fast_feed", "3. Быстрый фид (Блинки и Скиллы)"],
    ["boost_node", "Смарт Бот (Фикс)"],
    ["enable_smart", "Включить Умный Фарм"],
    ["auto_accept", "Авто-принятие игры"],
    ["auto_items", "Авто-закуп (ПТ -> БФ -> МОМ)"],
    ["auto_skill", "Авто-прокачка скиллов"]
]));

// --- МЕНЮ ---
const UtilityEntry = Menu.AddEntry("Utility");

// 1. BAD GUY (ФИДЕР - КОПИЯ РАБОЧЕГО)
const BadGuyNode = UtilityEntry.AddNode("Bad Guy", "panorama/images/items/shadow_amulet_png.vtex_c");
const FeedNode = BadGuyNode.AddNode("feed_node", "panorama/images/spellicons/skeleton_king_reincarnation_png.vtex_c");
const RunToRadiant = FeedNode.AddToggle("run_radiant", false);
const RunToDire = FeedNode.AddToggle("run_dire", false);
const FastFeed = FeedNode.AddToggle("fast_feed", true);

// 2. SMART BOOSTER (БОТ - ОБНОВЛЕННЫЙ)
const BoostNode = UtilityEntry.AddNode("boost_node", "panorama/images/items/tome_of_knowledge_png.vtex_c");
const EnableSmart = BoostNode.AddToggle("enable_smart", false);
const AutoAccept = BoostNode.AddToggle("auto_accept", true);
const AutoItems = BoostNode.AddToggle("auto_items", true); // Теперь покупает 3 предмета
const AutoSkill = BoostNode.AddToggle("auto_skill", true);

// --- КООРДИНАТЫ БАЗ (ФИД) ---
const BASE_RADIANT = new Vector3(-7200, -6600, 384);
const BASE_DIRE = new Vector3(7200, 6500, 384);

// --- КООРДИНАТЫ ЛИНИЙ (БОТ) ---
const RAD_BOT = new Vector3(6200, -6200, 256); 
const RAD_MID = new Vector3(-650, -350, 256);  
const RAD_TOP = new Vector3(-6200, 5500, 256); 
const RAD_JUNGLE = new Vector3(1000, -4000, 256); 

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
    // 1. ФИДЕР (НЕ ТРОГАЛ, РАБОТАЕТ КАК ЧАСЫ)
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
                Sleeper.Sleep(350, "blink"); 
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
    // 2. БОТ (FIXED MOVEMENT & ITEMS)
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

        // АВТО-ЗАКУП (PT -> BF -> MOM)
        if (AutoItems.value && !Sleeper.Sleeping("buy_items")) {
            // 1. Power Treads
            if (!Me.GetItemByName("item_power_treads")) {
                // @ts-ignore
                Me.PurchaseItem("item_power_treads");
                Sleeper.Sleep(2000, "buy_items");
            } 
            // 2. Battle Fury
            else if (!Me.GetItemByName("item_bfury")) {
                // @ts-ignore
                Me.PurchaseItem("item_bfury");
                Sleeper.Sleep(2000, "buy_items");
            }
            // 3. Mask of Madness
            else if (!Me.GetItemByName("item_mask_of_madness")) {
                // @ts-ignore
                Me.PurchaseItem("item_mask_of_madness");
                Sleeper.Sleep(2000, "buy_items");
            }
        }

        // ЛОГИКА ДВИЖЕНИЯ (УСКОРЕННАЯ - 500мс)
        if (Date.now() - lastMove >= 500) { // Было 3000, стало 500 - будет бегать бодрее
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

            // 2. ВЫБОР ЦЕЛИ ПО УРОВНЮ
            let target = new Vector3(0,0,0);

            if (Me.Level < 2) {
                // 1 Уровень -> НИЗ (Деревья)
                target = isRadiant ? RAD_BOT.Clone() : DIRE_BOT.Clone();
            } else if (Me.Level >= 2 && Me.Level < 6) {
                // 2-5 Уровень -> МИД (Деревья)
                target = isRadiant ? RAD_MID.Clone() : DIRE_MID.Clone();
            } else if (Me.Level >= 6 && Me.Level < 10) {
                // 6-9 Уровень -> ВЕРХ (Деревья)
                target = isRadiant ? RAD_TOP.Clone() : DIRE_TOP.Clone();
            } else {
                // 10+ Уровень -> ЛЕС
                target = isRadiant ? RAD_JUNGLE.Clone() : DIRE_JUNGLE.Clone();
                // В лесу бегаем широко
                target.x += (Math.random() * 1500 - 750);
                target.y += (Math.random() * 1500 - 750);
            }

            // Микро-рандом для деревьев (чтобы не кикнуло за AFK)
            if (Me.Level < 10) {
                target.x += (Math.random() * 300 - 150);
                target.y += (Math.random() * 300 - 150);
            }

            try {
                // Используем ту же магию движения, что и в фидере
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
