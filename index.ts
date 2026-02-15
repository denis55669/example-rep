import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ (Минимум нагрузки) ---
const Main = Menu.AddEntry("Denis Pack"); 
const MySide = Main.AddToggle("Side: Dire (OFF=Radiant)", false); 
const FeedAllies = Main.AddToggle("Feed Allies", true);
const EnableArmlet = Main.AddToggle("Enable Armlet", false);
// Изменил диапазон, чтобы слайдер перестал прыгать
const ArmletHP = Main.AddSlider("Armlet HP Threshold", 150, 500, 250);

let lastFeed = 0;
let lastArmlet = 0;

EventsSDK.on("PostDataUpdate", () => {
    const MyHero = LocalPlayer?.Hero;
    if (!MyHero || !MyHero.IsAlive) return;

    const now = Date.now();

    // 1. АРМЛЕТ (Проверка на каждом тике для выживания)
    if (EnableArmlet.value && (now - lastArmlet > 150)) {
        // @ts-ignore
        const armlet = MyHero.GetItem("item_armlet");
        // @ts-ignore
        const isActive = MyHero.HasModifier("modifier_item_armlet_unholy_strength");

        if (armlet && isActive && MyHero.Health < ArmletHP.value) {
            // Двойной каст для абуза
            // @ts-ignore
            armlet.Cast(); 
            // @ts-ignore
            armlet.Cast();
            lastArmlet = now;
        }
    }

    // 2. АВТО-ФИД (Работает всегда)
    if (now - lastFeed > 3000) { // Каждые 3 сек для обхода Humanizer
        lastFeed = now;
        
        const Target = MySide.value 
            ? new Vector3(7200, 6500, 384)  // Dire
            : new Vector3(-7200, -6600, 384); // Radiant

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

console.log("Denis Pack Updated: Slider and Feed fixed.");
