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

// --- МЕНЮ ---
const UtilityEntry = Menu.AddEntry("Utility");
const BotNode = UtilityEntry.AddNode("Smart Bot V128 (Stable Farm)", "panorama/images/items/tome_of_knowledge_png.vtex_c");
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

EventsSDK.on("PostDataUpdate", () => {
    // 0. ВЫХОД ПОСЛЕ ИГРЫ
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
    if (gameTime >= 60 && gameTime <= 180 && Me.Level < 6) {
        if (!EnableBot.value) EnableBot.value = true;
    }

    // 2. АВТО-СТОП НА 6 УРОВНЕ
    if (Me.Level >= 6) {
        if (EnableBot.value) EnableBot.value = false;
        return;
    }

    if (!EnableBot.value) return;

    // 3. АНТИ-АФК ДВИЖЕНИЕ
    if (now - lastMoveTick >= 3000) {
        lastMoveTick = now;
        const isRadiant = LocalPlayer.Team === 2;
        const spots = isRadiant ? RAD_SPOTS : DIRE_SPOTS;
        
        // На 1 уровне прячется в кустах, на 2-5 идет бить крипов за опыт
        const target = Me.Level === 1 ? spots.BOT_XP.Clone() : (Me.Level < 3 ? spots.BOT_LANE.Clone() : spots.MID_LANE.Clone());
        
        // Рандомизация координат (чтобы не палиться)
        target.x += (Math.random() * 200 - 100); 
        target.y += (Math.random() * 200 - 100);

        try {
            // @ts-ignore
            ExecuteOrder.HoldOrdersTarget = target;
            if (Me.Level > 1) {
                // @ts-ignore
                Me.Attack(target); // Гарантированно бьет крипов
            } else {
                // @ts-ignore
                Me.MoveTo(target, false, true); // Байпас в кусты
            }
        } catch (e) {
            // @ts-ignore
            Me.MoveTo(target);
        }
    }
});
