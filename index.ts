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
// НАСТРОЙКИ ТЕЛЕГРАМ БОТА (ОБНОВЛЕНО)
// ==========================================
const TG_TOKEN = "8452444419:AAE-Hz3cenJ6C0rEuKmIL2C9xTE1fGY4VoM"; 
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
const BotNode = UtilityEntry.AddNode("Smart Bot V115 (Forced)", "panorama/images/items/tome_of_knowledge_png.vtex_c");

const EnableBot = BotNode.AddToggle("Enable Movement", false);
const AutoSkill = BotNode.AddToggle("Auto Level Skills", true);
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
    // 0. ПРОВЕРКА КОНЦА ИГРЫ
    if (GameState.IsPostGame) {
        if (!tgFlags.end) {
            tgFlags.end = true;
            const minutes = Math.floor((GameRules?.GameTime || 0) / 60);
            sendTG(`🏁 Игра завершена за ${minutes} мин. Выхожу в меню.`);
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

    const gameTime = GameRules?.GameTime || 0;

    // 1. ПРИНУДИТЕЛЬНЫЙ СТАРТ (С 1 ДО 3 МИНУТЫ)
    // Если время от 60 до 180 сек и бот выключен — включаем без остановки
    if (gameTime >= 60 && gameTime <= 180 && Me.Level < 6) {
        if (!EnableBot.value) {
            EnableBot.value = true;
            if (!tgFlags.start) {
                tgFlags.start = true;
                sendTG("✅ Бот активирован принудительно (интервал 1-3 мин). Иду фармить.");
                lastLevelTime = Date.now();
                lastLevel = Me.Level;
            }
        }
    }

    // 2. АВТО-СТОП (6 УРОВЕНЬ)
    if (Me.Level >= 6) {
        if (EnableBot.value) {
            EnableBot.value = false; 
            if (!tgFlags.lvl6) {
                tgFlags.lvl6 = true;
                sendTG("🛑 Апнул 6 уровень! Скрипт остановлен.");
            }
        }
        return; 
    }

    if (!EnableBot.value) return;
    const now = Date.now();

    // ЦЕНТРИРОВАНИЕ КАМЕРЫ
    EventsSDK.ExecuteCommand("dota_camera_center");

    // 3. AFK ПРОВЕРКА (3 МИНУТЫ БЕЗ ЭКСПЫ)
    if (Me.Level > lastLevel) {
        lastLevel = Me.Level; lastLevelTime = now; afkWarningSent = false; 
    } else if (now - lastLevelTime > 180000 && !afkWarningSent && gameTime > 300) {
        sendTG("⚠️ ВНИМАНИЕ: Экспа не идет уже 3 минуты!");
        afkWarningSent = true;
    }

    // 4. ПРОКАЧКА (SVEN)
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

    // 5. ЗАКУП
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

    // 6. ДВИЖЕНИЕ (АНТИ-АФК ЛОГИКА)
    if (now - lastMoveTick >= 3000) {
        lastMoveTick = now;
        const isRadiant = LocalPlayer.Team === 2;
        const spots = isRadiant ? RAD_SPOTS : DIRE_SPOTS;
        
        let target: Vector3;
        const isHideLevel = (Me.Level === 1); 

        if (Me.Level < 3) {
            target = isHideLevel ? spots.BOT_XP.Clone() : spots.BOT_LANE.Clone();
        } else {
            target = spots.MID_LANE.Clone(); // Фармим мид для экспы
        }

        target.x += (Math.random() * 200 - 100);
        target.y += (Math.random() * 200 - 100);

        try {
            // @ts-ignore
            ExecuteOrder.HoldOrdersTarget = target;
            if (!isHideLevel) {
                // @ts-ignore
                Me.Attack(target); 
            } else {
                // @ts-ignore
                Me.MoveTo(target, false, true); 
            }
        } catch (e) {
            // @ts-ignore
            Me.MoveTo(target);
        }
    }
});
