import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Unit,
    ExecuteOrder,
    TickSleeper,
    GameState,
    GameRules,
    PlayerCustomData
} from "github.com/octarine-public/wrapper/index"

const Sleeper = new TickSleeper();

// --- ЛОКАЛИЗАЦИЯ ---
Menu.Localization.AddLocalizationUnit("english", new Map([
    ["boost_node", "Smart Hour Booster"],
    ["enable_smart", "Enable Smart XP Farm"],
    ["auto_accept", "Auto Accept Match"],
    ["auto_pick", "Auto Pick (Bounty Hunter/Riki)"]
]));

Menu.Localization.AddLocalizationUnit("russian", new Map([
    ["boost_node", "Умный Буст Часов"],
    ["enable_smart", "Включить Умный Фарм (XP)"],
    ["auto_accept", "Авто-принятие игры"],
    ["auto_pick", "Авто-пик (BH/Riki/Sniper)"]
]));

const UtilityEntry = Menu.AddEntry("Utility");
const BoostNode = UtilityEntry.AddNode("boost_node", "panorama/images/items/tome_of_knowledge_png.vtex_c");

const EnableSmart = BoostNode.AddToggle("enable_smart", false);
const AutoAccept = BoostNode.AddToggle("auto_accept", true);
const AutoPick = BoostNode.AddToggle("auto_pick", true);

// Координати "нычек" в деревьях (примерные, безопасные зоны)
// Radiant
const RAD_BOT_XP = new Vector3(5800, -5200, 256); // Radiant Safe Lane Trees
const RAD_MID_XP = new Vector3(-600, -400, 256);  // Radiant Mid Trees
const RAD_TOP_XP = new Vector3(-5800, 5000, 256); // Radiant Offlane Trees
const RAD_JUNGLE = new Vector3(1000, -4000, 256); // Radiant Triangle/Jungle

// Dire
const DIRE_BOT_XP = new Vector3(6000, -4500, 256); // Dire Offlane Trees
const DIRE_MID_XP = new Vector3(400, 200, 256);    // Dire Mid Trees
const DIRE_TOP_XP = new Vector3(-4500, 5800, 256); // Dire Safe Lane Trees
const DIRE_JUNGLE = new Vector3(4000, 3000, 256);  // Dire Jungle

let lastMoveTick = 0;

EventsSDK.on("PostDataUpdate", () => {
    if (!EnableSmart.value) return;
    const now = Date.now();

    // 1. АВТО-ПРИНЯТИЕ
    if (AutoAccept.value && GameState.IsMatchFound && !GameState.HasAccepted) {
        EventsSDK.ExecuteCommand("dota_accept_match");
    }

    // 2. АВТО-ПИК (Лучше всего Bounty Hunter или Riki для инвиза, но ставим Sniper как базу)
    if (AutoPick.value && GameRules && GameRules.GameState === 20) { 
        if (!Sleeper.Sleeping("pick_hero")) {
            // Пытаемся пикнуть Рики или БХ для инвиза (чтобы не умирать)
            EventsSDK.ExecuteCommand("dota_select_hero npc_dota_hero_riki"); 
            EventsSDK.ExecuteCommand("dota_select_hero npc_dota_hero_bounty_hunter");
            EventsSDK.ExecuteCommand("dota_select_hero npc_dota_hero_sniper"); // Резерв
            Sleeper.Sleep(3000, "pick_hero");
        }
    }

    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    // Двигаемся раз в 3 секунды, чтобы имитировать активность
    if (now - lastMoveTick >= 3000) {
        lastMoveTick = now;
        
        const isRadiant = LocalPlayer.Team === 2;
        let target = new Vector3(0, 0, 0);

        // --- ЛОГИКА УРОВНЕЙ ---
        
        // 1. Уровень 1 (Идем Низ)
        if (Me.Level < 2) {
            target = isRadiant ? RAD_BOT_XP.Clone() : DIRE_BOT_XP.Clone();
        } 
        // 2. Уровень 2-5 (Идем Мид)
        else if (Me.Level >= 2 && Me.Level < 6) {
            target = isRadiant ? RAD_MID_XP.Clone() : DIRE_MID_XP.Clone();
        }
        // 3. Уровень 6-9 (Идем Верх)
        else if (Me.Level >= 6 && Me.Level < 10) {
            target = isRadiant ? RAD_TOP_XP.Clone() : DIRE_TOP_XP.Clone();
        }
        // 4. Уровень 10+ (Идем в Лес гулять)
        else {
            target = isRadiant ? RAD_JUNGLE.Clone() : DIRE_JUNGLE.Clone();
            // В лесу бегаем рандомно сильнее
            target.x += (Math.random() * 2000 - 1000);
            target.y += (Math.random() * 2000 - 1000);
        }

        // Небольшой рандом для лайнинга, чтобы не стоять АФК в одной точке
        if (Me.Level < 10) {
            target.x += (Math.random() * 300 - 150);
            target.y += (Math.random() * 300 - 150);
        }

        try {
            // Используем твой "Прайм" мувмент с байпасом
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

console.log("best cheat octorine: Smart Hour Booster V59 Loaded");
