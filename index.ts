import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager
} from "github.com/octarine-public/wrapper/index"

// --- ПРOСТЕ МЕНЮ (100% клікабельне) ---
const Main = Menu.AddEntry("Denis Pack"); 

// Використовуємо прості типи для меню
const MySide = Main.AddToggle("Side: Dire (OFF=Radiant)", false); 
const FeedAllies = Main.AddToggle("Feed Allies", true);
const EnableArmlet = Main.AddToggle("Enable Armlet", false);
const MinHP = Main.AddSlider("Armlet HP", 100, 500, 250);

let lastFeed = 0;
let lastArmlet = 0;

EventsSDK.on("PostDataUpdate", () => {
    const MyHero = LocalPlayer?.Hero;
    if (!MyHero || !MyHero.IsAlive) return;

    const now = Date.now();

    // 1. АРМЛЕТ (якщо увімкнено в меню)
    if (EnableArmlet.value && (now - lastArmlet > 150)) {
        // @ts-ignore
        const armlet = MyHero.GetItem("item_armlet");
        // @ts-ignore
        const isActive = MyHero.HasModifier("modifier_item_armlet_unholy_strength");

        if (armlet && isActive && MyHero.Health < MinHP.value) {
            // @ts-ignore
            armlet.Cast(); 
            // @ts-ignore
            armlet.Cast();
            lastArmlet = now;
        }
    }

    // 2. ФІД (ПРАЦЮЄ ЗАВЖДИ)
    if (now - lastFeed > 6000) {
        lastFeed = now;
        
        // Координати прямо в коді, щоб не вантажити пам'ять
        const Target = MySide.value 
            ? new Vector3(7200, 6500, 384)  // Dire Fountain
            : new Vector3(-7200, -6600, 384); // Radiant Fountain

        // Твій герой
        // @ts-ignore
        MyHero.MoveTo(Target);

        // Союзники
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

console.log("Denis Pack: Menu Fixed!");
