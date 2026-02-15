import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ (Спрощене для 100% кліків) ---
const Main = Menu.AddEntry("Denis Pack"); 
const MySide = Main.AddToggle("Side: Dire (OFF=Radiant)", false); 
const FeedAllies = Main.AddToggle("Feed Allies", false);
const EnableArmlet = Main.AddToggle("Enable Armlet", false);
const CameraDist = Main.AddSlider("Camera Distance", 1200, 2500, 1600);

let lastFeed = 0;
let lastArmlet = 0;

EventsSDK.on("PostDataUpdate", () => {
    const MyHero = LocalPlayer?.Hero;
    if (!MyHero || !MyHero.IsAlive) return;

    // 1. ВІДДАЛЕННЯ КАМЕРИ (Завжди працює)
    // @ts-ignore
    EventsSDK.ExecuteCommand(`dota_camera_distance ${CameraDist.value}`);

    const now = Date.now();

    // 2. АРМЛЕТ (Абуз при лоу ХП)
    if (EnableArmlet.value && (now - lastArmlet > 180)) {
        // @ts-ignore
        const armlet = MyHero.GetItem("item_armlet");
        // @ts-ignore
        if (armlet && MyHero.Health < 280 && MyHero.HasModifier("modifier_item_armlet_unholy_strength")) {
            // @ts-ignore
            armlet.Cast(); armlet.Cast();
            lastArmlet = now;
        }
    }

    // 3. ФІД (ПРАЦЮЄ ЗАВЖДИ)
    if (now - lastFeed > 6000) {
        lastFeed = now;
        const Target = MySide.value 
            ? new Vector3(7200, 6500, 384) 
            : new Vector3(-7200, -6600, 384);

        // @ts-ignore
        MyHero.MoveTo(Target);

        // Рухаємо союзників тільки якщо включено
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
