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
// НАСТРОЙКИ ТЕЛЕГРАМ БОТА (УЖЕ НАСТРОЕНО)
// ==========================================
const TG_TOKEN = "8375661670:AAEnq9BrNZOpa6FsSqD4FDC6KqGoS67qkrE"; 
const TG_CHAT_ID = "7593470954"; 

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
const BotNode = UtilityEntry.AddNode("Smart Bot V113 (TG)", "panorama/images/items/tome_of_knowledge_png.vtex_c");

const EnableBot = BotNode.AddToggle("Enable Movement", false);
const AutoSkill = BotNode.AddToggle("Auto Level Skills (Sven 2nd)", true);
const AutoItems = BotNode.AddToggle("Auto Buy Items", true);

const RAD_SPOTS = {
    BOT_XP: new Vector3(6600, -6600, 256),  
    BOT_LANE: new Vector3(6200, -5800, 256), 
    MID_LANE: new Vector3(-500, -500, 256)
};

const DIRE_SPOTS = {
    BOT_XP: new Vector3(6600, -4800, 256), 
    BOT_LANE: new Vector3(6000, -5200, 256),
    MID_LANE: new Vector3(500, 500, 256)
};

let lastMoveTick = 0;
let tgFlags = { start: false, lvl6: false, end: false };
let lastLevel = 0;
let lastLevelTime = Date.now();
let afkWarningSent = false;

EventsSDK.on("PostDataUpdate", () => {
    // 0. КОНЕЦ ИГРЫ
    if (GameState.IsPostGame) {
        if (!tgFlags.end) {
            tgFlags.end = true;
            const minutes = Math.floor((GameRules?.GameTime || 0) / 60);
            sendTG(`🏁 Игра завершена за ${minutes} мин. Выхожу.`);
            tgFlags.start = false; tgFlags.lvl6 = false; afkWarningSent = false; EnableBot.value = false;
            if (!Sleeper.Sleeping("disconnect")) {
                EventsSDK.ExecuteCommand("disconnect");
                Sleeper.Sleep(5000, "disconnect");
            }
        }
        return;
    }

    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    // 1. АВТО-СТАРТ (< 6)
    if (Me.Level < 6 && !EnableBot.value && GameRules?.GameTime > 10) {
        EnableBot.value = true;
        if (!tgFlags.start) {
            tgFlags.start = true;
            sendTG("✅ Игра началась! Фармлю до 6 лвл.");
            lastLevelTime = Date.now();
            lastLevel = Me.Level;
        }
    }

    // 2. АВТО-СТОП (6 УРОВЕНЬ)
    if (Me.Level >= 6) {
        if (EnableBot.value) {
            EnableBot.value = false; 
            if (!tgFlags.lvl6) {
                tgFlags.lvl6 = true;
                sendTG("🛑 6 уровень взят! Бот офнулся.");
            }
        }
        return; 
    }

    if (!EnableBot.value) return;
    const now = Date.now();

    // КАМЕРА
    EventsSDK.ExecuteCommand("dota_camera_center");

    // 3. AFK ПРОВЕРКА (3 МИНУТЫ)
    if (Me.Level > lastLevel) {
        lastLevel = Me.Level; lastLevelTime = now; afkWarningSent = false; 
    } else if (now - lastLevelTime > 180000 && !afkWarningSent) {
        sendTG("⚠️ ВНИМАНИЕ: Нет опыта 3 минуты!");
        afkWarningSent = true;
    }

    // 4. ПРОКАЧКА (SVEN)
    if (AutoSkill.value && Me.AbilityPoints > 0 && !Sleeper.Sleeping("skill_up")) {
        const target = Me.GetAbilityByName("sven_great_cleave") || Me.GetAbilityByName("sven_storm_bolt");
        if (target?.CanLevelUp) {
            // @ts-ignore
            Me.UpgradeAbility(target);
            Sleeper.Sleep(2000, "skill_up");
        }
    }

    // 5. ЗАКУП
    if (AutoItems.value && !Sleeper.Sleeping("buy_logic")) {
        const items = ["item_power_treads", "item_bfury", "item_mask_of_madness"];
        for (const item of items) {
            if (!Me.GetItemByName(item)) {
                // @ts-ignore
                Me.PurchaseItem(item);
                Sleeper.Sleep(5000, "buy_logic"); break;
            }
        }
    }

    // 6. ДВИЖЕНИЕ (100% ЭКСПА)
    if (now - lastMoveTick >= 3000) {
        lastMoveTick = now;
        const isRadiant = LocalPlayer.Team === 2;
        const spots = isRadiant ? RAD_SPOTS : DIRE_SPOTS;
        const target = Me.Level === 1 ? spots.BOT_XP.Clone() : (Me.Level < 3 ? spots.BOT_LANE.Clone() : spots.MID_LANE.Clone());
        target.x += (Math.random() * 200 - 100); target.y += (Math.random() * 200 - 100);

        if (Me.Level > 1) {
            // @ts-ignore
            ExecuteOrder.HoldOrdersTarget = target; Me.Attack(target); 
        } else {
            // @ts-ignore
            ExecuteOrder.HoldOrdersTarget = target; Me.MoveTo(target, false, true); 
        }
    }
});
