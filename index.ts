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
// НАСТРОЙКИ ТЕЛЕГРАМ (ГРУППА: Наш окторин)
// ==========================================
const TG_TOKEN = "8452444419:AAE-Hz3cenJ6C0rEuKmIL2C9xTE1fGY4VoM"; 
const TG_CHAT_ID = "-1003448981729"; 

function sendTG(text: string) {
    const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage?chat_id=${TG_CHAT_ID}&text=${encodeURIComponent(text)}`;
    try {
        fetch(url).catch(() => {}); 
    } catch (e) {}
}

const Sleeper = new TickSleeper();

// --- МЕНЮ (ТОЛЬКО ДВИЖЕНИЕ И ТЕСТ) ---
const UtilityEntry = Menu.AddEntry("Utility");
const BotNode = UtilityEntry.AddNode("Smart Bot V124", "panorama/images/items/tome_of_knowledge_png.vtex_c");

// КНОПКА ТЕСТА (ЖМИ ЕЕ В ЛОББИ ИЛИ МЕНЮ)
BotNode.AddButton("Test Telegram Connection", () => {
    sendTG("🚀 ТЕСТ ПРОВЕРЕН: Бот в группе -1003448981729 работает!");
});

const EnableBot = BotNode.AddToggle("Enable Movement", false);

// --- КООРДИНАТЫ ---
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
let lastLevel = 0;
let lastLevelTime = Date.now();
let tgFlags = { start: false, lvl6: false, end: false, afk: false };

EventsSDK.on("PostDataUpdate", () => {
    if (GameState.IsPostGame) {
        if (!tgFlags.end) {
            tgFlags.end = true;
            sendTG("🏁 Катка всё. Выхожу.");
            tgFlags.start = false; tgFlags.lvl6 = false; tgFlags.afk = false;
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

    // 1. АВТО-СТАРТ (1-3 МИНУТА)
    if (gameTime >= 60 && gameTime <= 180 && Me.Level < 6) {
        if (!EnableBot.value) EnableBot.value = true;
        if (!tgFlags.start) {
            tgFlags.start = true;
            sendTG("✅ Бот стартанул (1-3 мин).");
            lastLevel = Me.Level; lastLevelTime = now;
        }
    }

    // 2. АВТО-СТОП (6 ЛВЛ)
    if (Me.Level >= 6) {
        if (EnableBot.value) {
            EnableBot.value = false;
            if (!tgFlags.lvl6) {
                tgFlags.lvl6 = true;
                sendTG("🛑 Апнул 6 лвл! Бот офнулся.");
            }
        }
        return;
    }

    if (!EnableBot.value) return;

    // 3. АФК ПРОВЕРКА (3 МИНУТЫ)
    if (Me.Level > lastLevel) {
        lastLevel = Me.Level; lastLevelTime = now; tgFlags.afk = false;
    } else if (now - lastLevelTime > 180000 && !tgFlags.afk && gameTime > 300) {
        sendTG("⚠️ ХОЗЯИН! Опыт не идет 3 минуты!");
        tgFlags.afk = true;
    }

    // 4. ДВИЖЕНИЕ
    if (now - lastMoveTick >= 3000) {
        lastMoveTick = now;
        const isRadiant = LocalPlayer.Team === 2;
        const spots = isRadiant ? RAD_SPOTS : DIRE_SPOTS;
        const target = Me.Level === 1 ? spots.BOT_XP.Clone() : (Me.Level < 3 ? spots.BOT_LANE.Clone() : spots.MID_LANE.Clone());
        target.x += (Math.random() * 200 - 100); target.y += (Math.random() * 200 - 100);

        try {
            // @ts-ignore
            ExecuteOrder.HoldOrdersTarget = target;
            if (Me.Level > 1) {
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
