import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3
} from "github.com/octarine-public/wrapper/index"

// Создаем меню БЕЗ иконок и БЕЗ подменю
const Main = Menu.AddEntry("Denis_V11");
const FeedOn = Main.AddToggle("1. FEED (Fountain)", false);
const TechOn = Main.AddToggle("2. TECHIES (Auto)", false);

let lastF = 0;
let points: Vector3[] = [];

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // 1. ФИДЕР (Твой старый добрый код)
    if (FeedOn.value && now - lastF > 5000) {
        lastF = now;
        const target = new Vector3(-7200, -6600, 384); // Идет на фонтан света
        // @ts-ignore
        Me.MoveTo(target);
    }

    // 2. ТЕЧИС (Авто-минирование при нажатии на F)
    // Если нажат бинд 'F' (0x46), добавляем точку под курсор
    // @ts-ignore
    if (TechOn.value && Me.UnitName === "npc_dota_hero_techies" && EventsSDK.IsKeyDown(0x46)) {
        // @ts-ignore
        const mouse = EventsSDK.GetMousePosWorld();
        if (mouse && (points.length === 0 || mouse.Distance(points[points.length-1]) > 200)) {
            points.push(mouse);
        }
    }

    // Если точки есть - ставим мины
    if (TechOn.value && points.length > 0 && now - lastF > 1000) {
        // @ts-ignore
        const mine = Me.GetAbility("techies_land_mines");
        if (mine && mine.CanBeCasted()) {
            // @ts-ignore
            Me.CastAbilityPosition(mine, points[0]);
            points.shift();
            lastF = now;
        }
    }
});

console.log("READY");
