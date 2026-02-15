import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3
} from "github.com/octarine-public/wrapper/index"

// Створюємо меню без зайвих наворотів
const Main = Menu.AddEntry("Denis_V19");
const FeedD = Main.AddToggle("1. ФІД ЗА DIRE", false);
const FeedR = Main.AddToggle("2. ФІД ЗА RADIANT", false);
const Roll = Main.AddToggle("3. СПАМ ROLL", false);

let lastF = 0;
let lastR = 0;

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // СПАМ /roll
    if (Roll.value && now - lastR > 2500) {
        lastR = now;
        // @ts-ignore
        EventsSDK.ExecuteCommand("say /roll");
    }

    // ФІДЕР (простий метод)
    if (now - lastF > 5000) {
        if (FeedD.value) {
            // Біжимо на фонтан Radiant
            const target = new Vector3(-7200, -6600, 384);
            // @ts-ignore
            Me.MoveTo(target);
            lastF = now;
        } else if (FeedR.value) {
            // Біжимо на фонтан Dire
            const target = new Vector3(7200, 6500, 384);
            // @ts-ignore
            Me.MoveTo(target);
            lastF = now;
        }
    }
});

console.log("READY");
