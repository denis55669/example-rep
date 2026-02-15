import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Render,
    Input
} from "github.com/octarine-public/wrapper/index"

// --- МАКСИМАЛЬНО ПРОСТЕ МЕНЮ ---
const Main = Menu.AddEntry("Denis_Final"); 
const FeedToggle = Main.AddToggle("1. FEED ON", false);
const TechiesToggle = Main.AddToggle("2. TECHIES ON", false);
const DrawKey = Main.AddKeybind("3. Draw Key (Hold)", 0x46); // Клавіша F

let lastF = 0;
let fDelay = 5000;
let points: Vector3[] = [];

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // ФІДЕР (Твій робочий варіант)
    if (FeedToggle.value && now - lastF > fDelay) {
        lastF = now;
        fDelay = Math.floor(Math.random() * 4000 + 4000);
        const pos = new Vector3(7200, 6500, 384); // Спрощено для тесту
        // @ts-ignore
        Me.MoveTo(pos);
    }

    // ТЕЧІС (Авто-каст на точки)
    if (TechiesToggle.value && !DrawKey.value && points.length > 0) {
        // @ts-ignore
        const mine = Me.GetAbility("techies_land_mines");
        if (mine && mine.CanBeCasted()) {
            // @ts-ignore
            Me.CastAbilityPosition(mine, points[0]);
            points.shift();
        }
    }
});

// МАЛЮВАННЯ (Тільки коли затиснута клавіша)
EventsSDK.on("OnWndProc", (msg, hwnd, wparam, lparam) => {
    if (TechiesToggle.value && DrawKey.value && wparam === 0x01) {
        const m = Input.GetCursorPosWorld();
        if (m) points.push(m);
    }
});

// МАЛЮВАННЯ КРУЖКІВ
EventsSDK.on("OnDraw", () => {
    if (TechiesToggle.value && points.length > 0) {
        points.forEach(p => {
            const s = Render.WorldToScreen(p);
            if (s) Render.DrawCircle(s, 5, [255, 0, 0, 255], 2); // Червоні точки
        });
    }
});

console.log("LOADED");
