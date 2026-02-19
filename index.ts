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
// НАСТРОЙКИ ТЕЛЕГРАМ (ТОЛЬКО ТВОИ ДАННЫЕ)
// ==========================================
const TG_TOKEN = "8452444419:AAE-Hz3cenJ6C0rEuKmIL2C9xTE1fGY4VoM"; 
const TG_CHAT_ID = "-1002421119924"; 

function sendTG(text: string) {
    const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage?chat_id=${TG_CHAT_ID}&text=${encodeURIComponent(text)}`;
    try {
        // Прямой fetch без лишних оберток
        fetch(url).catch(() => {}); 
    } catch (e) {}
}

const Sleeper = new TickSleeper();

// --- МЕНЮ (УБРАЛ ЛИШНЕЕ) ---
const UtilityEntry = Menu.AddEntry("Utility");
const BotNode = UtilityEntry.AddNode("Smart Bot V119", "panorama/images/items/tome_of_knowledge_png.vtex_c");
const EnableBot = BotNode.AddToggle("Enable Movement", false);

// --- КООРДИНАТЫ ---
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
let tgFlags = { start: false, lvl6: false, end: false, afk: false, debug: false };

EventsSDK.on("PostDataUpdate", () => {
    // ДЕБАГ: Отправить сообщение сразу при включении в меню
    if (EnableBot.value && !tgFlags.debug) {
        sendTG("🚀 Скрипт V119 загружен и готов! Проверка связи с группой.");
        tgFlags.debug = true;
    }

    // 0. КИНЕЦЬ ГРИ
    if (GameState.IsPostGame) {
        if (!tgFlags.end) {
            tgFlags.end = true;
            sendTG("🏁 Игра окончена. Выхожу.");
            tgFlags.start = false; tgFlags.lvl6 = false; tgFlags.afk = false; tgFlags.debug = false;
            EnableBot.value = false;
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

    // 1. ПРИНУДИТЕЛЬНЫЙ СТАРТ (1-3 МИНУТА) - КАК ТЫ ПРОСИЛ
    if (gameTime >= 60 && gameTime <= 180 && Me.Level < 6) {
        if (!EnableBot.value) {
            EnableBot.value = true;
        }
        if (!tgFlags.start) {
            tgFlags.start = true;
            sendTG("✅ Бот запущен (интервал 1-3 мин). Пошел фармить.");
            lastLevel = Me.Level; lastLevelTime = now;
        }
    }

    // 2. АВТО-СТОП (6 РІВЕНЬ)
    if (Me.Level >= 6) {
        if (EnableBot.value) {
            EnableBot.value = false;
            if (!tgFlags.lvl6) {
                tgFlags.lvl6 = true;
                sendTG("🛑 Апнул 6 уровень! Бот отключен.");
            }
        }
        return;
    }

    if (!EnableBot.value) return;

    // 3. АНТИ-АФК ПРОВЕРКА (3 МИНУТЫ)
    if (Me.Level > lastLevel) {
        lastLevel = Me.Level; lastLevelTime = now; tgFlags.afk = false;
    } else if (now - lastLevelTime > 180000 && !tgFlags.afk && gameTime > 300) {
        sendTG("⚠️ ВНИМАНИЕ: Нет экспы уже 3 минуты!");
        tgFlags.afk = true;
    }

    // 4. ДВИЖЕНИЕ
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
        } else {
            target = spots.TOP_LANE.Clone();
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
