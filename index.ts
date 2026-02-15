import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ (Только ФИД) ---
const Main = Menu.AddEntry("Denis_Feed_Only");
const FeedDire = Main.AddToggle("1. ФИД ЗА DIRE (ТЬМА)", false);
const FeedRadiant = Main.AddToggle("2. ФИД ЗА RADIANT (СВЕТ)", false);

let lastF = 0;
let fDelay = 5000;

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // Логика фида
    if (now - lastF > fDelay) {
        lastF = now;
        fDelay = Math.floor(Math.random() * 3000 + 4000); // Рандом 4-7 сек

        if (FeedDire.value) {
            // Ты за Тьму -> Бежишь на фонтан Света (левый нижний угол)
            const target = new Vector3(-7200 + (Math.random()*400-200), -6600 + (Math.random()*400-200), 384);
            // @ts-ignore
            Me.MoveTo(target);
        } 
        else if (FeedRadiant.value) {
            // Ты за Свет -> Бежишь на фонтан Тьмы (правый верхний угол)
            const target = new Vector3(7200 + (Math.random()*400-200), 6500 + (Math.random()*400-200), 384);
            // @ts-ignore
            Me.MoveTo(target);
        }
    }
});

console.log("Denis Feed Loaded!");
