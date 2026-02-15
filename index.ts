import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Render,
    Input,
    EntityManager
} from "github.com/octarine-public/wrapper/index"

// --- ГОЛОВНЕ МЕНЮ (Спрощене) ---
const MainMenu = Menu.AddEntry("Denis_Scripts"); // Жодних іконок, тільки текст

// Фідер
const EnableFeed = MainMenu.AddToggle("1. УВІМКНУТИ ФІД", false);
const MySide = MainMenu.AddToggle("2. Фід за DIRE (ТЬМА)", false);

// Течіс
const EnableTechies = MainMenu.AddToggle("3. ТЕЧІС АВТО-МІНЕР", false);
const DrawingKey = MainMenu.AddKeybind("4. Кнопка малювання", 0x46); // Клавіша F

// --- Змінні ---
let lastFeed = 0;
let feedDelay = 5000;
let tPoints: Vector3[] = [];
let lastTClick = 0;

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // --- ЛОГІКА ФІДЕРА (Твоя робоча версія) ---
    if (EnableFeed.value) {
        if (now - lastFeed >= feedDelay) {
            lastFeed = now;
            feedDelay = Math.floor(Math.random() * (8000 - 4000) + 4000);
            const base = MySide.value ? {x: 7200, y: 6500, z: 384} : {x: -7200, y: -6600, z: 384};
            const target = new Vector3(base.x + (Math.random()*600-300), base.y + (Math.random()*600-300), base.z);
            // @ts-ignore
            Me.MoveTo(target);
        }
    }

    // --- ЛОГІКА ТЕЧІСА (Спрощена) ---
    if (EnableTechies.value && Me.UnitName === "npc_dota_hero_techies") {
        if (!DrawingKey.value && tPoints.length > 0 && now - lastTClick > 800) {
            const point = tPoints[0];
            // @ts-ignore
            const mine = Me.GetAbility("techies_land_mines");
            if (mine && mine.CanBeCasted()) {
                // @ts-ignore
                Me.CastAbilityPosition(mine, point);
                lastTClick = now;
                tPoints.shift(); // Видаляємо точку після касту
            }
        }
    }
});

// Малювання точок для Течіса
EventsSDK.on("OnWndProc", (msg, hwnd, wparam, lparam) => {
    if (EnableTechies.value && DrawingKey.value && wparam === 0x01) {
        const mouse = Input.GetCursorPosWorld();
        if (mouse) tPoints.push(mouse);
    }
});

// Візуалізація точок
EventsSDK.on("OnDraw", () => {
    if (EnableTechies.value && tPoints.length > 0) {
        tPoints.forEach(p => {
            const sPos = Render.WorldToScreen(p);
            if (sPos) Render.DrawCircle(sPos, 8, [0, 255, 0, 255], 2); // Зелені кружки
        });
    }
});

console.log("Denis Scripts Loaded!");
