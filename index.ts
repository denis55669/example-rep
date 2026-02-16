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
    Ability
} from "github.com/octarine-public/wrapper/index"

const Sleeper = new TickSleeper();

// --- МЕНЮ ---
const UtilityEntry = Menu.AddEntry("Utility");
const BotNode = UtilityEntry.AddNode("Smart Bot V102", "panorama/images/items/tome_of_knowledge_png.vtex_c");

const EnableBot = BotNode.AddToggle("Enable Movement", true);
const AutoSkill = BotNode.AddToggle("Auto Skills (Spam)", true);
const AutoQueue = BotNode.AddToggle("Auto Find (All Pick)", true);

// --- КООРДИНАТИ ---
const RAD_SPOTS = {
    BOT_XP: new Vector3(6600, -6600, 256),  
    BOT_LANE: new Vector3(6200, -5800, 256), 
    MID_XP: new Vector3(-1100, -1100, 256), 
    MID_LANE: new Vector3(-500, -500, 256),
    TOP_XP: new Vector3(-6600, 5200, 256), 
    TOP_LANE: new Vector3(-5800, 5200, 256)
};

const DIRE_SPOTS = {
    BOT_XP: new Vector3(6600, -4800, 256), 
    BOT_LANE: new Vector3(6000, -5200, 256),
    MID_XP: new Vector3(1100, 1100, 256),
    MID_LANE: new Vector3(500, 500, 256),
    TOP_XP: new Vector3(-4800, 6600, 256), 
    TOP_LANE: new Vector3(-5200, 6000, 256)
};

let lastMoveTick = 0;
let quickbuyDone = false; // Прапор, що ми додали шмотки

EventsSDK.on("PostDataUpdate", () => {
    // 1. АВТО-ПОШУК ТА ПРИЙНЯТТЯ (Тільки в меню)
    if (AutoQueue.value) {
        if (GameState.IsMatchFound && !GameState.HasAccepted) {
            EventsSDK.ExecuteCommand("dota_accept_match");
        }
        // Якщо ми в МЕНЮ (не в грі, не шукаємо)
        if (!GameState.IsInGame && !GameState.IsSearching && !GameState.IsMatchFound) {
            if (!Sleeper.Sleeping("queue")) {
                EventsSDK.ExecuteCommand("dota_match_game_modes 1"); // All Pick
                EventsSDK.ExecuteCommand("dota_match_find_match");
                Sleeper.Sleep(5000, "queue");
                
                // Скидаємо налаштування для нової гри
                quickbuyDone = false; 
                if (!EnableBot.value) EnableBot.value = true;
            }
        }
    }

    // Якщо ми не в матчі - стоп
    if (!GameState.IsInGame) return;

    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    // 2. АВТО-СТАРТ (0:00)
    // Якщо бот вимкнений на старті - вмикаємо
    if (Me.Level < 2 && GameRules && GameRules.GameTime < 60) {
        if (!EnableBot.value) EnableBot.value = true;
    }

    // 3. СТОП НА 6 РІВНІ (Щоб не банили)
    if (Me.Level >= 6) {
        if (EnableBot.value) {
            EnableBot.value = false; // Вимикаємо галку
            console.log("Level 6 reached. Bot OFF.");
            // Можна додати disconnect тут, якщо хочеш
            // EventsSDK.ExecuteCommand("disconnect");
        }
        return; 
    }

    if (!EnableBot.value) return;

    // 4. QUICKBUY (Один раз на старті)
    if (!quickbuyDone) {
        // Додаємо ПТ, БФ, МОМ у швидку покупку
        EventsSDK.ExecuteCommand("dota_shop_force_assign_quickbuy item_power_treads");
        EventsSDK.ExecuteCommand("dota_shop_item_add_to_quickbuy item_bfury");
        EventsSDK.ExecuteCommand("dota_shop_item_add_to_quickbuy item_mask_of_madness");
        
        quickbuyDone = true;
        console.log("Quickbuy set!");
    }

    // 5. ПРОКАЧКА (SPAM MODE)
    // Качаємо що завгодно, аби не стояти АФК
    if (AutoSkill.value && Me.AbilityPoints > 0 && !Sleeper.Sleeping("skill")) {
        // Шукаємо будь-який доступний скіл
        const ability = Me.Abilities.find(a => a.CanLevelUp && !a.IsHidden && a.Name !== "attribute_bonus");
        const stats = Me.Abilities.find(a => a.CanLevelUp && a.Name === "attribute_bonus");
        
        if (ability) {
            // @ts-ignore
            Me.UpgradeAbility(ability);
        } else if (stats) {
            // @ts-ignore
            Me.UpgradeAbility(stats);
        }
        Sleeper.Sleep(500, "skill");
    }

    // 6. РУХ (СТАБІЛЬНИЙ V99)
    const now = Date.now();
    if (now - lastMoveTick >= 3000) {
        lastMoveTick = now;
        const isRadiant = LocalPlayer.Team === 2;
        const spots = isRadiant ? RAD_SPOTS : DIRE_SPOTS;
        
        // Цикл ліній: 1-2(Bot), 3-4(Mid), 5-6(Top)
        const cycle = Math.floor((Me.Level - 1) / 2) % 3;
        
        // ХОВАЄМОСЯ ТІЛЬКИ НА 1 РІВНІ (Щоб не злили ФБ і дали досвід)
        const isHide = (Me.Level === 1); 

        let target: Vector3;
        if (cycle === 0) target = isHide ? spots.BOT_XP.Clone() : spots.BOT_LANE.Clone(); // Bot
        else if (cycle === 1) target = isHide ? spots.MID_XP.Clone() : spots.MID_LANE.Clone(); // Mid
        else target = isHide ? spots.TOP_XP.Clone() : spots.TOP_LANE.Clone(); // Top

        target.x += (Math.random() * 200 - 100);
        target.y += (Math.random() * 200 - 100);

        try {
            // @ts-ignore
            ExecuteOrder.HoldOrdersTarget = target;
            
            if (!isHide) {
                // АГРЕСІЯ (Рівні 2, 3, 4, 5) - йдемо бити кріпів
                // @ts-ignore
                Me.Attack(target); 
            } else {
                // КУЩІ (Рівень 1) - йдемо ховатися
                // @ts-ignore
                Me.MoveTo(target, false, true); 
            }
        } catch (e) {
            // @ts-ignore
            Me.MoveTo(target);
        }
    }
});
