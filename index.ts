import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Input
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ ---
const Main = Menu.AddEntry("Denis_V12");
const FeedOn = Main.AddToggle("1. ФИД (За Тьму)", false);
const TechOn = Main.AddToggle("2. ТЕЧИС (Авто-минер)", false);
const DrawKey = Main.AddKeybind("3. Клавиша малювання (Зажать)", 0x46); // Кнопка F

let lastFTime = 0;
let lastTTime = 0;
let tPoints: Vector3[] = [];

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // --- 1. ФИД ЗА DIRE (ТЬМА) ---
    if (FeedOn.value && now - lastFTime > 5000) {
        lastFTime = now;
        // Координаты фонтана Radiant (Света), куда бежим фидить за Dire
        const target = new Vector3(-7200, -6600, 384);
        // @ts-ignore
        Me.MoveTo(target);
    }

    // --- 2. ТЕЧИС (ИСПРАВЛЕННЫЙ) ---
    if (TechOn.value && Me.UnitName === "npc_dota_hero_techies") {
        
        // Запись точек (пока зажата кнопка F)
        if (DrawKey.value) {
            const mPos = Input.GetCursorPosWorld();
            if (mPos) {
                // Добавляем точку, если она далеко от предыдущей
                if (tPoints.length === 0 || mPos.Distance(tPoints[tPoints.length - 1]) > 250) {
                    tPoints.push(mPos);
                }
            }
        }

        // Авто-установка мин
        if (!DrawKey.value && tPoints.length > 0 && now - lastTTime > 900) {
            // Ищем способность по индексу или имени (силовой метод)
            // @ts-ignore
            const mineAbility = Me.GetAbilities().find(a => a.Name === "techies_land_mines");
            
            if (mineAbility && mineAbility.CanBeCasted()) {
                // @ts-ignore
                Me.CastAbilityPosition(mineAbility, tPoints[0]);
                tPoints.shift(); // Удаляем точку после каста
                lastTTime = now;
            }
        }
    }
});

console.log("Denis V12 Loaded!");
