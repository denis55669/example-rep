import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    ExecuteOrder,
    TickSleeper,
    GameState
} from "github.com/octarine-public/wrapper/index"

const Sleeper = new TickSleeper();

// --- МЕНЮ ---
const UtilityEntry = Menu.AddEntry("Utility");
const BoostNode = UtilityEntry.AddNode("Smart Bot", "panorama/images/items/tome_of_knowledge_png.vtex_c");

const EnableBot = BoostNode.AddToggle("Enable Movement", false);
const AutoAccept = BoostNode.AddToggle("Auto Accept Match", true);

// --- КООРДИНАТЫ (ТВОИ ИЗ V59) ---
const RAD_SPOTS = [
    new Vector3(5800, -5200, 256),  // BOT
    new Vector3(-600, -400, 256),   // MID
    new Vector3(-5800, 5000, 256),  // TOP
    new Vector3(1000, -4000, 256)   // JUNGLE
];

const DIRE_SPOTS = [
    new Vector3(6000, -4500, 256),  // BOT
    new Vector3(400, 200, 256),     // MID
    new Vector3(-4500, 5800, 256),  // TOP
    new Vector3(4000, 3000, 256)    // JUNGLE
];

let lastMoveTick = 0;

EventsSDK.on("PostDataUpdate", () => {
    // 1. АВТО-ПРИНЯТИЕ
    if (AutoAccept.value && GameState.IsMatchFound && !GameState.HasAccepted) {
        EventsSDK.ExecuteCommand("dota_accept_match");
        return;
    }

    if (!EnableBot.value) return;

    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    const now = Date.now();

    // 2. ЛОГИКА ДВИЖЕНИЯ (Раз в 3 секунды, как в V59)
    if (now - lastMoveTick >= 3000) {
        lastMoveTick = now;

        const isRadiant = LocalPlayer.Team === 2;
        const spots = isRadiant ? RAD_SPOTS : DIRE_SPOTS;
        let target: Vector3;

        // Выбор точки по уровню (Логика V59)
        if (Me.Level < 2) target = spots[0].Clone();
        else if (Me.Level < 6) target = spots[1].Clone();
        else if (Me.Level < 10) target = spots[2].Clone();
        else target = spots[3].Clone();

        // Рандомизация позиции (чтобы не стоять как вкопанный)
        target.x += (Math.random() * 400 - 200);
        target.y += (Math.random() * 400 - 200);

        const dist = Me.Distance(target);

        try {
            if (dist > 1500) {
                // Если далеко (на базе) — используем обычный путь, чтобы обойти стены
                // @ts-ignore
                Me.MoveTo(target);
            } else {
                // Если уже в зоне — используем твой метод с байпасом
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

console.log("Smart Bot V87 (Movement Only) Loaded");
