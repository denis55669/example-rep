import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ ---
const Main = Menu.AddEntry("Denis_Ultimate_V13");
const FeedOn = Main.AddToggle("1. ФІД ЗА DIRE (ТЬМА)", false);
const TechOn = Main.AddToggle("2. ТЕЧІС (АВТО-МІНЕР)", false);
const TechKey = Main.AddKeybind("3. Кнопка малювання (Затиснути)", 0x46); // Клавіша F

let lastFTime = 0;
let lastTTime = 0;
let tPoints: Vector3[] = [];

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // --- 1. ФІД ЗА DIRE (ТЬМА) ---
    // Ти граєш за Dire, отже біжиш на фонтан Radiant (Світла)
    if (FeedOn.value && now - lastFTime > 4000) {
        lastFTime = now;
        // Координати ворожого фонтану (Radiant)
        const target = new Vector3(-7200, -6600, 384);
        // @ts-ignore
        Me.MoveTo(target);
    }

    // --- 2. ТЕЧІС (ВИПРАВЛЕНО) ---
    if (TechOn.value && Me.UnitName === "npc_dota_hero_techies") {
        
        // Малювання (коли затиснута клавіша F)
        if (TechKey.value) {
            // @ts-ignore (Беремо позицію миші напряму через SDK)
            const mPos = EventsSDK.GetMousePosWorld(); 
            if (mPos) {
                if (tPoints.length === 0 || mPos.Distance(tPoints[tPoints.length - 1]) > 300) {
                    tPoints.push(mPos);
                }
            }
        }

        // Авто-установка мін (якщо не малюємо в цей момент)
        if (!TechKey.value && tPoints.length > 0 && now - lastTTime > 1000) {
            // Шукаємо здібність міни по назві
            // @ts-ignore
            const mine = Me.GetAbility("techies_land_mines");
            
            if (mine && mine.CanBeCasted()) {
                // @ts-ignore
                Me.CastAbilityPosition(mine, tPoints[0]);
                tPoints.shift(); // Видаляємо точку, куди поїхали ставити
                lastTTime = now;
            }
        }
    }
});

console.log("Denis V13: Dire Feed & Techies Fixed!");
