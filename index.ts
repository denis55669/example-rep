import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Render,
    Input,
    EntityManager
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ TECHIES AUTO-MINER ---
const Main = Menu.AddEntry("Denis_Techies_V1");
const Enable = Main.AddToggle("1. Включить скрипт", false);
const DrawingMode = Main.AddKeybind("2. Режим рисования (F10)", 0x79); // F10
const MineDistance = Main.AddSlider("3. Дистанция между минами", 300, 500, 400);

let points: Vector3[] = [];
let isDrawing = false;
let lastCastTime = 0;

// Логика рисования (как в видео)
EventsSDK.on("OnWndProc", (msg, hwnd, wparam, lparam) => {
    if (!Enable.value || !DrawingMode.value) return;

    if (wparam === 0x01) { // Левая кнопка мыши
        const mousePos = Input.GetCursorPosWorld();
        if (mousePos) {
            points.push(mousePos);
            console.log("Точка добавлена: " + points.length);
        }
    }
});

EventsSDK.on("PostDataUpdate", () => {
    if (!Enable.value) return;
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive || Me.UnitName !== "npc_dota_hero_techies") return;

    const now = Date.now();
    if (now - lastCastTime < 1000) return; // Задержка для Xeon [cite: 2025-10-12]

    // Если мы не рисуем, начинаем минирование точек
    if (!DrawingMode.value && points.length > 0) {
        const target = points[0];
        
        // Проверяем, нет ли уже мины рядом
        const nearbyMines = EntityManager.GetEntitiesByClass("npc_dota_techies_proximity_mine");
        const isOccupied = nearbyMines.some(m => m.DistanceTo(target) < MineDistance.value);

        if (!isOccupied) {
            // @ts-ignore
            const mineAbility = Me.GetAbility("techies_land_mines");
            if (mineAbility && mineAbility.CanBeCasted()) {
                // @ts-ignore
                Me.CastAbilityPosition(mineAbility, target);
                lastCastTime = now;
                console.log("Ставлю мину в точку!");
            }
        } else {
            // Если точка занята, переходим к следующей
            points.shift();
        }
    }
});

// Визуализация (как в видео)
EventsSDK.on("OnDraw", () => {
    if (!Enable.value || points.length === 0) return;

    for (let i = 0; i < points.length; i++) {
        const screenPos = Render.WorldToScreen(points[i]);
        if (screenPos) {
            Render.DrawCircle(screenPos, 10, [255, 255, 255, 255], 2);
            if (i > 0) {
                const prevScreen = Render.WorldToScreen(points[i-1]);
                if (prevScreen) Render.DrawLine(prevScreen, screenPos, [255, 255, 0, 255], 1);
            }
        }
    }
});

console.log("Techies Auto-Miner V1 Loaded. Нажми F10 для рисования!");