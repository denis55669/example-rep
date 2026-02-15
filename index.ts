import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Player,
    Enum
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ ---
const Root = Menu.AddEntry("Denis_Scripts_V18", "panorama/images/items/travel_boots_png.vtex_c");

const FeedFolder = Root.AddEntry("Auto Feeder");
const FeedDire = FeedFolder.AddToggle("Фід за DIRE (ТЬМА)", false);
const FeedRad = FeedFolder.AddToggle("Фід за RADIANT (СВІТЛО)", false);

const ChatFolder = Root.AddEntry("Chat Spam");
const RollSpam = ChatFolder.AddToggle("Спам /roll", false);

let lastF = 0;
let lastR = 0;

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // 1. СИЛОВИЙ ФІД (Через PrepareOrder)
    if (now - lastF > 3000) {
        let targetPos: Vector3 | null = null;

        if (FeedDire.value) {
            targetPos = new Vector3(-7200, -6600, 384); // На фонтан Світлих
        } else if (FeedRad.value) {
            targetPos = new Vector3(7200, 6500, 384);   // На фонтан Тьми
        }

        if (targetPos) {
            // Використовуємо прямий наказ гравця, який неможливо заблокувати
            Player.PrepareOrder(LocalPlayer.RawPlayer, Enum.UnitOrder.DOTA_UNIT_ORDER_MOVE_TO_POSITION, 0, targetPos, 0, Me, false, true);
            lastF = now;
        }
    }

    // 2. СПАМ /roll
    if (RollSpam.value && now - lastR > 2500) {
        lastR = now;
        // Спробуємо через інший метод виконання команди
        // @ts-ignore
        EventsSDK.ExecuteCommand("say /roll");
    }
});

console.log("Denis V18: Force Order Loaded!");
