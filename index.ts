import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ (Теперь с кнопкой выключения и списком) ---
const Main = Menu.AddEntry("Denis Pack"); 

// 1. Кнопка ВКЛ/ВЫКЛ фида (теперь он не будет бежать сам по себе)
const EnableFeed = Main.AddToggle("Enable Auto Feed", false);
const MySide = Main.AddToggle("Side: Dire (OFF=Radiant)", false); 
const FeedAllies = Main.AddToggle("Feed Allies", true);

// 2. Армлет
const EnableArmlet = Main.AddToggle("Enable Armlet", false);
// Заменили слайдер на Список, чтобы не "прыгало"
const ArmletHPList = Main.AddList("Armlet HP Threshold", ["150", "200", "250", "300", "350", "400"], 2);

let lastFeed = 0;
let lastArmlet = 0;

EventsSDK.on("PostDataUpdate", () => {
    const MyHero = LocalPlayer?.Hero;
    if (!MyHero || !MyHero.IsAlive) return;

    const now = Date.now();

    // --- ЛОГИКА АРМЛЕТА ---
    if (EnableArmlet.value && (now - lastArmlet > 150)) {
        // Получаем число из списка (индекс 2 = 250 по умолчанию)
        const threshold = parseInt(ArmletHPList.value);
        
        // @ts-ignore
        const armlet = MyHero.GetItem("item_armlet");
        // @ts-ignore
        const isActive = MyHero.HasModifier("modifier_item_armlet_unholy_strength");

        if (armlet && isActive && MyHero.Health < threshold) {
            // @ts-ignore
            armlet.Cast(); armlet.Cast(); // Абуз
            lastArmlet = now;
        }
    }

    // --- ЛОГИКА ФИДА (Только если включена кнопка!) ---
    if (EnableFeed.value && (now - lastFeed > 3500)) {
        lastFeed = now;
        
        const Target = MySide.value 
            ? new Vector3(7200, 6500, 384) 
            : new Vector3(-7200, -6600, 384);

        // Свой герой
        // @ts-ignore
        MyHero.MoveTo(Target);

        // Тиммейты
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

console.log("Denis Pack: Feed toggle and List Menu fixed!");
