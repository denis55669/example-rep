import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Unit,
    ExecuteOrder,
    TickSleeper,
    GameState,
    EntityManager
} from "github.com/octarine-public/wrapper/index"

const Sleeper = new TickSleeper();

// --- МЕНЮ ---
const UtilityEntry = Menu.AddEntry("Utility");
const BotNode = UtilityEntry.AddNode("Smart Bot V105", "panorama/images/items/tome_of_knowledge_png.vtex_c");

// Увімкнено за замовчуванням (true)
const EnableBot = BotNode.AddToggle("Enable Movement", true);
const AutoSkill = BotNode.AddToggle("Auto Level Skills (Sven 2nd)", true);
const AutoItems = BotNode.AddToggle("Auto Buy Items", true);

// --- ГЛИБОКІ КООРДИНАТИ ---
const RAD_SPOTS = {
    BOT_XP: new Vector3(6600, -6600, 256),  
    BOT_LANE: new Vector3(6200, -5800, 256), 
    MID_XP: new Vector3(-1100, -1100, 256), 
    MID_LANE: new Vector3(-500, -500, 256),
    TOP_XP: new Vector3(-6600, 5200, 256), 
    TOP_LANE: new Vector3(-5800, 5200, 256),
    JUNGLE: new Vector3(1000, -4000, 256)
};

const DIRE_SPOTS = {
    BOT_XP: new Vector3(6600, -4800, 256), 
    BOT_LANE: new Vector3(6000, -5200, 256),
    MID_XP: new Vector3(1100, 1100, 256),
    MID_LANE: new Vector3(500, 500, 256),
    TOP_XP: new Vector3(-4800, 6600, 256), 
    TOP_LANE: new Vector3(-5200, 6000, 256),
    JUNGLE: new Vector3(4000, 3000, 256)
};

let lastMoveTick = 0;

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    // ==========================================
    // 1. ВИМИКАННЯ НА 6 РІВНІ (STOP LEVEL 6)
    // ==========================================
    if (Me.Level >= 6) {
        if (EnableBot.value) {
            EnableBot.value = false; // Вимикаємо галку
        }
        return; // Більше нічого не робимо
    }

    // ==========================================
    // 2. ПРИМУСОВЕ ВКЛЮЧЕННЯ (FORCE ON < 6)
    // ==========================================
    // Якщо рівень менше 6, а бот вимкнений — вмикаємо назад
    if (Me.Level < 6 && !EnableBot.value) {
        EnableBot.value = true;
    }

    // Якщо раптом не увімкнулось - виходимо
    if (!EnableBot.value) return;
    
    const now = Date.now();

    // 3. ПРОКАЧКА СВЕНА (Твій код)
    if (AutoSkill.value && Me.AbilityPoints > 0 && !Sleeper.Sleeping("skill_up")) {
        const cleave = Me.GetAbilityByName("sven_great_cleave");
        const hammer = Me.GetAbilityByName("sven_storm_bolt");
        const targetAbility = (cleave && cleave.CanLevelUp) ? cleave : hammer;
        if (targetAbility) {
            // @ts-ignore
            Me.UpgradeAbility(targetAbility);
            Sleeper.Sleep(2000, "skill_up");
        }
    }

    // 4. ЗАКУП (Твій код)
    if (AutoItems.value && !Sleeper.Sleeping("buy_logic")) {
        const items = ["item_power_treads", "item_bfury", "item_mask_of_madness"];
        for (const itemName of items) {
            if (!Me.GetItemByName(itemName)) {
                // @ts-ignore
                Me.PurchaseItem(itemName);
                Sleeper.Sleep(5000, "buy_logic");
                break;
            }
        }
    }

    // 5. ЛОГІКА РУХУ (Твій код)
    if (now - lastMoveTick >= 3000) {
        lastMoveTick = now;
        const isRadiant = LocalPlayer.Team === 2;
        const spots = isRadiant ? RAD_SPOTS : DIRE_SPOTS;
        
        let target: Vector3;
        const isHideLevel = (Me.Level % 2 !== 0); // 1, 3, 5 - Ховаємось

        if (Me.Level < 2) {
            target = isHideLevel ? spots.BOT_XP.Clone() : spots.BOT_LANE.Clone();
        } else if (Me.Level < 6) {
            target = isHideLevel ? spots.MID_XP.Clone() : spots.MID_LANE.Clone();
        } else if (Me.Level < 10) {
            target = isHideLevel ? spots.TOP_XP.Clone() : spots.TOP_LANE.Clone();
        } else {
            target = spots.JUNGLE.Clone();
            target.x += (Math.random() * 1000 - 500);
            target.y += (Math.random() * 1000 - 500);
        }

        target.x += (Math.random() * 200 - 100);
        target.y += (Math.random() * 200 - 100);

        try {
            if (!isHideLevel && Me.Level < 10) {
                // @ts-ignore
                ExecuteOrder.HoldOrdersTarget = target;
                // @ts-ignore
                Me.Attack(target); 
            } else {
                // @ts-ignore
                ExecuteOrder.HoldOrdersTarget = target;
                // @ts-ignore
                Me.MoveTo(target, false, true); 
            }
        } catch (e) {
            // @ts-ignore
            Me.MoveTo(target);
        }
    }
});
