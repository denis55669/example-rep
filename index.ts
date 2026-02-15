import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Render
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ ---
const Main = Menu.AddEntry("Denis_Scripts_V14");

// Фідер
const EnableFeed = Main.AddToggle("1. УВІМКНУТИ ФІД", false);
const FeedSide = Main.AddList("2. Твій бок (Команда)", ["Я за RADIANT", "Я за DIRE"], 1);

// Течіс
const EnableTechies = Main.AddToggle("3. ТЕЧІС (АВТО-МІНЕР)", false);
const TechKey = Main.AddKeybind("4. Малювання (Затиснути)", 0x46); // Кнопка F

let lastFTime = 0;
let lastTTime = 0;
let tPoints: Vector3[] = [];

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // --- ЛОГІКА ФІДУ ---
    if (EnableFeed.value && now - lastFTime > 4000) {
        lastFTime = now;
        
        let targetPos: Vector3;
        if (FeedSide.value === 1) { 
            // ТИ ЗА DIRE (ТЬМА) -> Біжиш на фонтан Світлих
            targetPos = new Vector3(-7200, -6600, 384);
        } else {
            // ТИ ЗА RADIANT (СВІТЛО) -> Біжиш на фонтан Тьми
            targetPos = new Vector3(7200, 6500, 384);
        }
        
        // Додаємо трохи рандому, щоб не палитися
        const finalTarget = new Vector3(
            targetPos.x + (Math.random() * 400 - 200),
            targetPos.y + (Math.random() * 400 - 200),
            targetPos.z
        );

        // @ts-ignore
        Me.MoveTo(finalTarget);
    }

    // --- ЛОГІКА ТЕЧІСА ---
    if (EnableTechies.value && Me.UnitName === "npc_dota_hero_techies") {
        
        // Малювання точок
        if (TechKey.value) {
            // @ts-ignore
            const mPos = EventsSDK.GetCursorPosWorld(); 
            if (mPos) {
                if (tPoints.length === 0 || mPos.Distance(tPoints[tPoints.length - 1]) > 300) {
                    tPoints.push(mPos);
                }
            }
        }

        // Встановлення мін
        if (!TechKey.value && tPoints.length > 0 && now - lastTTime > 1100) {
            // @ts-ignore
            const mine = Me.GetAbility("techies_land_mines");
            if (mine && mine.CanBeCasted()) {
                // @ts-ignore
                Me.CastAbilityPosition(mine, tPoints[0]);
                tPoints.shift();
                lastTTime = now;
            }
        }
    }
});

// Візуалізація точок (щоб ти бачив, що малювання працює!)
EventsSDK.on("OnDraw", () => {
    if (EnableTechies.value && tPoints.length > 0) {
        tPoints.forEach(p => {
            const sPos = Render.WorldToScreen(p);
            if (sPos) {
                Render.DrawCircle(sPos, 6, [0, 255, 0, 255], 2); // Зелені точки
            }
        });
    }
});

console.log("Denis V14 Loaded: Feed & Techies drawing fixed!");
