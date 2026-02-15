import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3
} from "github.com/octarine-public/wrapper/index"

// --- МАКСИМАЛЬНО ПРОСТЕ МЕНЮ (Без іконок і списків) ---
const Main = Menu.AddEntry("Denis_V15");
const FeedRadiant = Main.AddToggle("1. ФІД ЗА RADIANT", false); // Бігти вгору (Dire)
const FeedDire = Main.AddToggle("2. ФІД ЗА DIRE", false);       // Бігти вниз (Radiant)
const TechiesOn = Main.AddToggle("3. ТЕЧІС (На кнопку F)", false);

let lastF = 0;
let tPoints: Vector3[] = [];

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // --- ЛОГІКА ФІДУ ---
    if (now - lastF > 5000) {
        if (FeedRadiant.value) {
            // Ти за світло -> біжиш до темних (вгору-вправо)
            // @ts-ignore
            Me.MoveTo(new Vector3(7200, 6500, 384));
            lastF = now;
        } else if (FeedDire.value) {
            // Ти за тьму -> біжиш до світлих (вниз-вліво)
            // @ts-ignore
            Me.MoveTo(new Vector3(-7200, -6600, 384));
            lastF = now;
        }
    }

    // --- ЛОГІКА ТЕЧІСА (БЕЗ МАЛЮВАННЯ, ТІЛЬКИ КНОПКА F) ---
    if (TechiesOn.value && Me.UnitName === "npc_dota_hero_techies") {
        // Якщо затиснута клавіша F (0x46)
        // @ts-ignore
        if (EventsSDK.IsKeyDown(0x46)) {
            // @ts-ignore
            const m = EventsSDK.GetMousePosWorld();
            if (m && (tPoints.length === 0 || m.Distance(tPoints[tPoints.length - 1]) > 200)) {
                tPoints.push(m);
            }
        }

        // Авто-каст мін
        if (tPoints.length > 0 && now - lastF > 1000) {
            // @ts-ignore
            const ability = Me.GetAbility("techies_land_mines");
            if (ability && ability.CanBeCasted()) {
                // @ts-ignore
                Me.CastAbilityPosition(ability, tPoints[0]);
                tPoints.shift();
                lastF = now;
            }
        }
    }
});

console.log("Denis V15 Ready!");
