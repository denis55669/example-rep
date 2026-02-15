import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Render,
    Input,
    EntityManager
} from "github.com/octarine-public/wrapper/index"

// --- ОБЩЕЕ МЕНЮ (Denis All-in-One) ---
const MainMenu = Menu.AddEntry("Denis_Mega_Pack", "panorama/images/items/travel_boots_png.vtex_c");

// --- СЕКЦИЯ ФИДЕРА ---
const FeedTab = MainMenu.AddEntry("Auto Feed Ultra");
const EnableFeed = FeedTab.AddToggle("УВІМКНУТИ ФІД", false);
const MySide = FeedTab.AddToggle("Я за ТЬМУ (Dire)", false);

// --- СЕКЦИЯ ТЕЧИСА ---
const TechiesTab = MainMenu.AddEntry("Techies Miner");
const EnableTechies = TechiesTab.AddToggle("Включить Течиса", false);
const DrawingMode = TechiesTab.AddKeybind("Режим рисования (F10)", 0x79); // F10
const MineDistance = TechiesTab.AddSlider("Дистанция мин", 300, 500, 400);

// Переменные для фида
let lastFeedTime = 0;
let nextFeedDelay = 5000;
const RadiantFountain = { x: -7200, y: -6600, z: 384 };
const DireFountain = { x: 7200, y: 6500, z: 384 };

// Переменные для Течиса
let techiesPoints: Vector3[] = [];
let lastTechiesCast = 0;

// Логика кликов для рисования Течиса
EventsSDK.on("OnWndProc", (msg, hwnd, wparam, lparam) => {
    if (!EnableTechies.value || !DrawingMode.value) return;
    if (wparam === 0x01) { // Левая кнопка мыши
        const mousePos = Input.GetCursorPosWorld();
        if (mousePos) techiesPoints.push(mousePos);
    }
});

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // --- ЛОГИКА ТЕЧИСА ---
    if (EnableTechies.value && Me.UnitName === "npc_dota_hero_techies") {
        if (!DrawingMode.value && techiesPoints.length > 0 && now - lastTechiesCast > 1000) {
            const target = techiesPoints[0];
            const mines = EntityManager.GetEntitiesByClass("npc_dota_techies_proximity_mine");
            const isOccupied = mines.some(m => m.DistanceTo(target) < MineDistance.value);

            if (!isOccupied) {
                // @ts-ignore
                const ability = Me.GetAbility("techies_land_mines");
                if (ability && ability.CanBeCasted()) {
                    // @ts-ignore
                    Me.CastAbilityPosition(ability, target);
                    lastTechiesCast = now;
                }
            } else {
                techiesPoints.shift(); // Убираем точку, если там уже стоит мина
            }
        }
    }

    // --- ЛОГИКА ФИДЕРА ---
    if (EnableFeed.value) {
        if (now - lastFeedTime >= nextFeedDelay) {
            lastFeedTime = now;
            nextFeedDelay = Math.floor(Math.random() * (8000 - 4000) + 4000);

            const basePos = MySide.value ? RadiantFountain : DireFountain;
            const target = new Vector3(
                basePos.x + (Math.random() * 600 - 300),
                basePos.y + (Math.random() * 600 - 300),
                basePos.z
            );
            // @ts-ignore
            Me.MoveTo(target);
        }
    }
});

// Отрисовка точек Течиса
EventsSDK.on("OnDraw", () => {
    if (!EnableTechies.value || techiesPoints.length === 0) return;
    for (let i = 0; i < techiesPoints.length; i++) {
        const screenPos = Render.WorldToScreen(techiesPoints[i]);
        if (screenPos) {
            Render.DrawCircle(screenPos, 10, [255, 255, 255, 255], 2);
            if (i > 0) {
                const prev = Render.WorldToScreen(techiesPoints[i-1]);
                if (prev) Render.DrawLine(prev, screenPos, [255, 255, 0, 255], 1);
            }
        }
    }
});

console.log("Denis Pack: Feed + Techies loaded!");
