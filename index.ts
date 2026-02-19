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
    GameRules
} from "github.com/octarine-public/wrapper/index"

// ==========================================
// НАЛАШТУВАННЯ TELEGRAM (УЖЕ ГОТОВО)
// ==========================================
const TG_TOKEN = "8452444419:AAE-Hz3cenJ6C0rEuKmIL2C9xTE1fGY4VoM"; 
const TG_CHAT_ID = "-1002421119924"; 

function sendTG(text: string) {
    try {
        const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage?chat_id=${TG_CHAT_ID}&text=${encodeURIComponent(text)}`;
        if (typeof fetch !== "undefined") {
            fetch(url).catch(() => {}); 
        }
    } catch (e) {}
}

const Sleeper = new TickSleeper();

// --- МЕНЮ ---
const UtilityEntry = Menu.AddEntry("Utility");
const BotNode = UtilityEntry.AddNode("Smart Bot V118", "panorama/images/items/tome_of_knowledge_png.vtex_c");

const EnableBot = BotNode.AddToggle("Enable Movement", false);
const AutoSkill = BotNode.AddToggle("Auto Level Skills (Sven 2nd)", true);
const AutoItems = BotNode.AddToggle("Auto Buy Items", true);

// --- КООРДИНАТИ ---
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
let lastLevel = 0;
let lastLevelTime = Date.now();
let tgFlags = { start: false, lvl6: false, end: false, afk: false };

EventsSDK.on("PostDataUpdate", () => {
    // 0. КІНЕЦЬ ГРИ
    if (GameState.IsPostGame) {
        if (!tgFlags.end) {
            tgFlags.end = true;
            const mins = Math.floor((GameRules?.GameTime || 0) / 60);
            sendTG(`🏁 Гра закінчена! Тривалість: ${mins} хв. Виходжу.`);
            tgFlags.start = false; tgFlags.lvl6 = false; tgFlags.afk = false; EnableBot.value = false;
            if (!Sleeper.Sleeping("disconnect")) {
                EventsSDK.ExecuteCommand("disconnect");
                Sleeper.Sleep(5000, "disconnect");
            }
        }
        return;
    }

    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();
    const gameTime = GameRules?.GameTime || 0;

    // 1. АВТО-СТАРТ (З 1-ї ХВИЛИНИ ГРИ)
    if (gameTime >= 60 && gameTime <= 180 && Me.Level < 6) {
        if (!EnableBot.value) {
            EnableBot.value = true;
            if (!tgFlags.start) {
                tgFlags.start = true;
                sendTG("✅ Бот увімкнувся! Починаю фарм.");
                lastLevel = Me.Level; lastLevelTime = now;
            }
        }
    }

    // 2. АВТО-СТОП (6 РІВЕНЬ)
    if (Me.Level >= 6) {
        if (EnableBot.value) {
            EnableBot.value = false;
            if (!tgFlags.lvl6) {
                tgFlags.lvl6 = true;
                sendTG("🛑 Апнув 6 рівень! Бот вимкнений.");
            }
        }
        return;
    }

    if (!EnableBot.value) return;

    // 3. ПЕРЕВІРКА НА АФК (3 ХВИЛИНИ)
    if (Me.Level > lastLevel) {
        lastLevel = Me.Level; lastLevelTime = now; tgFlags.afk = false;
    } else if (now - lastLevelTime > 180000 && !tgFlags.afk && gameTime > 300) {
        sendTG("⚠️ УВАГА: Немає досвіду вже 3 хвилини!");
        tgFlags.afk = true;
    }

    // 4. ПРОКАЧКА СВЕНА (ТВІЙ КОД)
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

    // 5. ЗАКУП (ТВІЙ КОД)
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

    // 6. РУХ (ТВІЙ КОД)
    if (now - lastMoveTick >= 3000) {
        lastMoveTick = now;
        const isRadiant = LocalPlayer.Team === 2;
        const spots = isRadiant ? RAD_SPOTS : DIRE_SPOTS;
        
        let target: Vector3;
        const isHideLevel = (Me.Level % 2 !== 0);

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
