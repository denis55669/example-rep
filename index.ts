import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3
} from "github.com/octarine-public/wrapper/index"

// --- ГОЛОВНА ПАПКА (Denis Scripts) ---
const Root = Menu.AddEntry("Denis_Scripts", "panorama/images/items/travel_boots_png.vtex_c");

// --- ВКЛАДКА 1: ФІДЕР (Окрема папка в меню) ---
const FeedFolder = Root.AddEntry("Auto Feeder");
const FeedDire = FeedFolder.AddToggle("Фід за DIRE (ТЬМА)", false);
const FeedRad = FeedFolder.AddToggle("Фід за RADIANT (СВІТЛО)", false);

// --- ВКЛАДКА 2: ЧАТ (Окрема папка в меню) ---
const ChatFolder = Root.AddEntry("Chat Spam");
const RollSpam = ChatFolder.AddToggle("Спам /roll", false);
const RollDelay = ChatFolder.AddSlider("Затримка (мс)", 500, 5000, 2000);

let lastF = 0;
let lastR = 0;

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // 1. ЛОГІКА ЧАТУ (Спам /roll)
    if (RollSpam.value && now - lastR > RollDelay.value) {
        lastR = now;
        // @ts-ignore
        EventsSDK.ExecuteCommand("say /roll");
    }

    // 2. ЛОГІКА ФІДУ (Твоя перевірена версія)
    if (now - lastF > 5000) {
        if (FeedDire.value) {
            // Біжимо на фонтан Світлих
            const target = new Vector3(-7200, -6600, 384);
            // @ts-ignore
            Me.MoveTo(target);
            lastF = now;
        } else if (FeedRad.value) {
            // Біжимо на фонтан Тьми
            const target = new Vector3(7200, 6500, 384);
            // @ts-ignore
            Me.MoveTo(target);
            lastF = now;
        }
    }
});

console.log("Denis V17: Modular Menu Loaded!");
