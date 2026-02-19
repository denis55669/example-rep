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

const Sleeper = new TickSleeper();

// --- МЕНЮ (ЧИСТОЕ) ---
const UtilityEntry = Menu.AddEntry("Utility");
const BotNode = UtilityEntry.AddNode("Smart AFK Bot V130", "panorama/images/items/tome_of_knowledge_png.vtex_c");
const EnableBot = BotNode.AddToggle("Enable AFK Bot", false);

// --- КООРДИНАТЫ ---
const RAD_SPOTS = {
    BOT_XP: new Vector3(6600, -6600, 256),   // Кусты (прячемся)
    BOT_LANE: new Vector3(6200, -5800, 256), // Низ линия
    MID_LANE: new Vector3(-500, -500, 256)   // МИД линия
};

const DIRE_SPOTS = {
    BOT_XP: new Vector3(6600, -4800, 256),
    BOT_LANE: new Vector3(6000, -5200, 256),
    MID_LANE: new Vector3(500, 500, 256)
};

let lastMoveTick = 0;

EventsSDK.on("PostDataUpdate", () => {
    // 0. АВТО-ВЫХОД ИЗ ИГРЫ ПОСЛЕ КАТКИ
    if (GameState.IsPostGame) {
        EnableBot.value = false;
        if (!Sleeper.Sleeping("disconnect")) {
            EventsSDK.ExecuteCommand("disconnect");
            Sleeper.Sleep(5000, "disconnect");
        }
        return;
    }

    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    
    const now = Date.now();
    const gameTime = GameRules?.GameTime || 0;

    // 1. АВТО-СТАРТ (С 1 ПО 3 МИНУТУ)
    // Если ты забыл нажать галочку, бот сам себя включит
    if (gameTime >= 60 && gameTime <= 180 && Me.Level < 6) {
        if (!EnableBot.value) EnableBot.value = true;
    }

    // 2. АВТО-СТОП (НА 6 ЛВЛ)
    // Как только апаем 6 уровень, бот полностью останавливается
    if (Me.Level >= 6) {
        if (EnableBot.value) EnableBot.value = false;
        return;
    }

    // Если бот выключен руками (или еще не время) - ничего не делаем
    if (!EnableBot.value) return;

    // 3. ЛОГИКА АНТИ-АФК ДВИЖЕНИЯ (КАЖДЫЕ 3 СЕКУНДЫ)
    if (now - lastMoveTick >= 3000) {
        lastMoveTick = now;
        const isRadiant = LocalPlayer.Team === 2;
        const spots = isRadiant ? RAD_SPOTS : DIRE_SPOTS;
        
        let target: Vector3;

        // На 1 лвл идем в кусты. На 2 лвл идем на бот. На 3+ идем в МИД за экспой.
        if (Me.Level === 1) {
            target = spots.BOT_XP.Clone();
        } else if (Me.Level === 2) {
            target = spots.BOT_LANE.Clone();
        } else {
            target = spots.MID_LANE.Clone();
        }
        
        // Рандомизация координат (чтобы клики не были в один пиксель)
        target.x += (Math.random() * 200 - 100); 
        target.y += (Math.random() * 200 - 100);

        try {
            // @ts-ignore
            ExecuteOrder.HoldOrdersTarget = target;
            if (Me.Level > 1) {
                // @ts-ignore
                Me.Attack(target); // На 2+ лвл бьем всё на пути через "Атаку"
            } else {
                // @ts-ignore
                Me.MoveTo(target, false, true); // На 1 лвл просто бежим в кусты
            }
        } catch (e) {
            // @ts-ignore
            Me.MoveTo(target); // Запасной вариант движения
        }
    }
});
