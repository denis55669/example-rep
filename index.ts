import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Unit,
    ExecuteOrder,
    TickSleeper,
    GameState,
    GameRules
} from "github.com/octarine-public/wrapper/index"

const Sleeper = new TickSleeper();

// --- ЛОКАЛИЗАЦИЯ (RU/EN) ---
Menu.Localization.AddLocalizationUnit("english", new Map([
    // Feed
    ["feed_node", "Feed"],
    ["run_radiant", "1. Feed RADIANT (Down)"],
    ["run_dire", "2. Feed DIRE (Up)"],
    ["fast_feed", "3. Fast Feed (Blinks & Skills)"],
    // Boost
    ["boost_node", "Smart Hour Booster"],
    ["enable_smart", "Enable Smart XP Farm"],
    ["auto_accept", "Auto Accept Match"],
    ["auto_pick", "Auto Pick (Bounty/Riki/Sniper)"]
]));

Menu.Localization.AddLocalizationUnit("russian", new Map([
    // Фид
    ["feed_node", "Фид"],
    ["run_radiant", "1. Фид RADIANT (Вниз)"],
    ["run_dire", "2. Фид DIRE (Вверх)"],
    ["fast_feed", "3. Быстрый фид (Блинки и Скиллы)"],
    // Буст
    ["boost_node", "Умный Буст Часов"],
    ["enable_smart", "Включить Умный Фарм (XP)"],
    ["auto_accept", "Авто-принятие игры"],
    ["auto_pick", "Авто-пик (BH/Riki/Sniper)"]
]));

// --- ГЛАВНОЕ МЕНЮ (UTILITY) ---
const UtilityEntry = Menu.AddEntry("Utility");

// ==========================================
// МОДУЛЬ 1: BAD GUY (FEED)
// ==========================================
const BadGuyNode = UtilityEntry.AddNode("Bad Guy", "panorama/images/items/shadow_amulet_png.vtex_c");
const FeedNode = BadGuyNode.AddNode("feed_node", "panorama/images/spellicons/skeleton_king_reincarnation_png.vtex_c");

const RunToRadiant = FeedNode.AddToggle("run_radiant", false);
const RunToDire = FeedNode.AddToggle("run_dire", false);
const FastFeed = FeedNode.AddToggle("fast_feed", true);

// ==========================================
// МОДУЛЬ 2: HOUR BOOSTER (FARM)
// ==========================================
const BoostNode = UtilityEntry.AddNode("boost_node", "panorama/images/items/tome_of_knowledge_png.vtex_c");

const EnableSmart = BoostNode.AddToggle("enable_smart", false);
const AutoAccept = BoostNode.AddToggle("auto_accept", true);
const AutoPick = BoostNode.AddToggle("auto_pick", true);

// --- КООРДИНАТЫ ---
const BASE_RADIANT = new Vector3(-7200, -6600, 384);
const BASE_DIRE = new Vector3(7200, 6500, 384);

// XP Spots
const RAD_BOT_XP = new Vector3(5800, -5200, 256);
const RAD_MID_XP = new Vector3(-600, -400, 256);
const RAD_TOP_XP = new Vector3(-5800, 5000, 256);
const RAD_JUNGLE = new Vector3(1000, -4000, 256);

const DIRE_BOT_XP = new Vector3(6000, -4500, 256);
const DIRE_MID_XP = new Vector3(400, 200, 256);
const DIRE_TOP_XP = new Vector3(-4500, 5800, 256);
const DIRE_JUNGLE = new Vector3(4000, 3000, 256);

let lastFeedTick = 0;
let lastFarmTick = 0;

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    const now = Date.now();

    // --- ЛОГИКА БУСТА (ВНЕ ИГРЫ) ---
    if (EnableSmart.value) {
        if (AutoAccept.value && GameState.IsMatchFound && !GameState.HasAccepted) {
            EventsSDK.ExecuteCommand("dota_accept_match");
        }
        if (AutoPick.value && GameRules && GameRules.GameState === 20) { 
            if (!Sleeper.Sleeping("pick_hero")) {
                EventsSDK.ExecuteCommand("dota_select_hero npc_dota_hero_bounty_hunter");
                EventsSDK.ExecuteCommand("dota_select_hero npc_dota_hero_riki");
                EventsSDK.ExecuteCommand("dota_select_hero npc_dota_hero_sniper");
                Sleeper.Sleep(3000, "pick_hero");
            }
        }
    }

    if (!Me || !Me.IsAlive) return;

    // ==========================================
    // ЛОГИКА 1: ФИДЕР (BAD GUY)
    // ==========================================
    if (RunToRadiant.value || RunToDire.value) {
        let target = RunToRadiant.value ? BASE_RADIANT.Clone() : BASE_DIRE.Clone();

        // Fast Feed (Blinks)
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

        // Move Logic
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
        return; // Если работает фид, фарм не запускаем
    }

    // ==========================================
    // ЛОГИКА 2: УМНЫЙ ФАРМ (HOUR BOOSTER)
    // ==========================================
    if (EnableSmart.value && now - lastFarmTick >= 3000) {
        lastFarmTick = now;
        
        const isRadiant = LocalPlayer.Team === 2;
        let target = new Vector3(0, 0, 0);

        if (Me.Level < 2) target = isRadiant ? RAD_BOT_XP.Clone() : DIRE_BOT_XP.Clone();
        else if (Me.Level < 6) target = isRadiant ? RAD_MID_XP.Clone() : DIRE_MID_XP.Clone();
        else if (Me.Level < 10) target = isRadiant ? RAD_TOP_XP.Clone() : DIRE_TOP_XP.Clone();
        else {
            target = isRadiant ? RAD_JUNGLE.Clone() : DIRE_JUNGLE.Clone();
            target.x += (Math.random() * 2000 - 1000);
            target.y += (Math.random() * 2000 - 1000);
        }

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
});
