import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ З ІКОНКОЮ ---
const Main = Menu.AddEntry("Auto Feed Ultra", "panorama/images/items/travel_boots_png.vtex_c");
const FeedDire = Main.AddToggle("ФІД ЗА DIRE (ТЬМА)", false);
const FeedRadiant = Main.AddToggle("ФІД ЗА RADIANT (СВІТЛО)", false);

let lastF = 0;
let fDelay = 5000;

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // Перевірка затримки (4-7 секунд рандому)
    if (now - lastF > fDelay) {
        lastF = now;
        fDelay = Math.floor(Math.random() * 3000 + 4000);

        // ЛОГІКА ДЛЯ DIRE (Біжимо на ворожий фонтан Radiant)
        if (FeedDire.value) {
            const target = new Vector3(
                -7200 + (Math.random() * 400 - 200), 
                -6600 + (Math.random() * 400 - 200), 
                384
            );
            // @ts-ignore
            Me.MoveTo(target);
        } 
        // ЛОГІКА ДЛЯ RADIANT (Біжимо на ворожий фонтан Dire)
        else if (FeedRadiant.value) {
            const target = new Vector3(
                7200 + (Math.random() * 400 - 200), 
                6500 + (Math.random() * 400 - 200), 
                384
            );
            // @ts-ignore
            Me.MoveTo(target);
        }
    }
});

console.log("Denis Ultra Feed with Icon Loaded!");
