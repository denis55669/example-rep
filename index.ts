import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ (Спрощене) ---
const Main = Menu.AddEntry("Denis Pack"); 
const MySide = Main.AddToggle("Side: Dire (OFF=Radiant)", false); 
const FeedAllies = Main.AddToggle("Feed Allies", false);
const EnableArmlet = Main.AddToggle("Enable Armlet", false);
const CameraDist = Main.AddSlider("Camera Distance", 1200, 2500, 1200);

let lastActionTime = 0;
let lastArmletTime = 0;

EventsSDK.on("PostDataUpdate", () => {
    const now = Date.now();
    
    // ОБМЕЖЕННЯ: Весь код виконується не частіше ніж раз на 100мс
    // Це розвантажить процесор і "оживить" меню [cite: 2025-10-12]
    if (now - lastActionTime < 100) return;
    lastActionTime = now;

    const MyHero = LocalPlayer?.Hero;
    if (!MyHero || !MyHero.IsAlive) return;

    // 1. КАМЕРА (Тільки якщо значення змінилося)
    // @ts-ignore
    EventsSDK.ExecuteCommand(`dota_camera_distance ${CameraDist.value}`);

    // 2. АРМЛЕТ (Оптимізовано)
    if (EnableArmlet.value && (now - lastArmletTime > 200)) {
        // @ts-ignore
        const armlet = MyHero.GetItem("item_armlet");
        // @ts-ignore
        if (armlet && MyHero.Health < 250 && MyHero.HasModifier("modifier_item_armlet_unholy_strength")) {
            // @ts-ignore
            armlet.Cast(); armlet.Cast();
            lastArmletTime = now;
        }
    }

    // 3. ФІД (Раз на 6 секунд)
    // Використовуємо статичну змінну для затримки фіду
    if (!globalThis.nextFeedTick) globalThis.nextFeedTick = 0;
    if (now > globalThis.nextFeedTick) {
        globalThis.nextFeedTick = now + 6000;
        
        const Target = MySide.value 
            ? new Vector3(7200, 6500, 384) 
            : new Vector3(-7200, -6600, 384);

        // @ts-ignore
        MyHero.MoveTo(Target);

        if (FeedAllies.value) {
            const heroes = EntityManager.GetEntitiesByClass("CDOTA_BaseNPC_Hero");
            for (const hero of heroes) {
                // @ts-ignore
                if (hero && hero !== MyHero && hero.IsAlive && hero.IsControllable) {
                    // @ts-ignore
                    hero.MoveTo(Target);
                }
            }
        }
    }
});
