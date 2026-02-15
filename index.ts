import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ (Тільки те, що ти просив) ---
const Main = Menu.AddEntry("Denis Pack"); 
const MySide = Main.AddToggle("Side: Dire (OFF=Radiant)", false); 
const FeedAllies = Main.AddToggle("Feed Allies", true);
const EnableArmlet = Main.AddToggle("Enable Armlet", false);
// ПОРІГ АБУЗА (Slider), який ти просив повернути
const ArmletThreshold = Main.AddSlider("Armlet HP Threshold", 100, 600, 250);

let lastFeedTime = 0;
let lastArmletTime = 0;

EventsSDK.on("PostDataUpdate", () => {
    const MyHero = LocalPlayer?.Hero;
    if (!MyHero || !MyHero.IsAlive) return;

    const now = Date.now();

    // 1. АРМЛЕТ АБУЗ (За порогом HP)
    if (EnableArmlet.value && (now - lastArmletTime > 150)) {
        // @ts-ignore
        const armlet = MyHero.GetItem("item_armlet");
        // @ts-ignore
        const hasBuff = MyHero.HasModifier("modifier_item_armlet_unholy_strength");

        // Якщо ХП нижче виставленого в меню порогу
        if (armlet && hasBuff && MyHero.Health < ArmletThreshold.value) {
            // @ts-ignore
            armlet.Cast(); // Вимкнути
            // @ts-ignore
            armlet.Cast(); // Увімкнути
            lastArmletTime = now;
        }
    }

    // 2. АВТО-ФІД (Працює завжди)
    if (now - lastFeedTime > 4000) { // Перевірка кожні 4 сек
        lastFeedTime = now;
        
        const TargetPos = MySide.value 
            ? new Vector3(7200, 6500, 384)  // Dire
            : new Vector3(-7200, -6600, 384); // Radiant

        // Відправляємо твого героя
        // @ts-ignore
        MyHero.MoveTo(TargetPos);

        // Відправляємо союзників (якщо включено)
        if (FeedAllies.value) {
            const heroes = EntityManager.GetEntitiesByClass("CDOTA_BaseNPC_Hero");
            for (const hero of heroes) {
                // @ts-ignore
                if (hero && hero !== MyHero && hero.IsAlive && hero.IsControllable) {
                    // @ts-ignore
                    hero.MoveTo(TargetPos);
                }
            }
        }
    }
});
