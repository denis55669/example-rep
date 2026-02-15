import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ ---
const FeedMenu = Menu.AddEntry("Auto Feed");
const EnableFeed = FeedMenu.AddToggle("УВІМКНУТИ ФІД", false);
const MySide = FeedMenu.AddToggle("Я за ТЬМУ (Dire)", false); // Якщо біжить не туди - клацни це
const FeedMyHero = FeedMenu.AddToggle("Фідити моїм героєм", true);
const FeedAllies = FeedMenu.AddToggle("Фідити союзниками", true);
const FeedCouriers = FeedMenu.AddToggle("Фідити кур'єрами", true);

// Координати фонтанів
const RadiantFountain = new Vector3(-7200, -6600, 384);
const DireFountain = new Vector3(7200, 6500, 384);

EventsSDK.on("PostDataUpdate", () => {
    if (!EnableFeed.value) return;

    const MyHero = LocalPlayer?.Hero;
    if (!MyHero) return;

    // ВИЗНАЧЕННЯ ЦІЛІ:
    // Якщо галочка "Я за Dire" ВИМКНЕНА (ти Radiant) -> біжимо на Dire (ворог)
    // Якщо галочка "Я за Dire" УВІМКНЕНА -> біжимо на Radiant (ворог)
    const TargetPosition = MySide.value ? RadiantFountain : DireFountain;

    // 1. Мій герой
    if (FeedMyHero.value && MyHero.IsAlive) {
        // @ts-ignore
        MyHero.MoveTo(TargetPosition);
    }

    // 2. Кур'єри
    if (FeedCouriers.value) {
        const couriers = EntityManager.GetEntitiesByClass("CDOTA_Unit_Courier");
        for (const courier of couriers) {
            // @ts-ignore
            if (courier.IsAlive && courier.IsControllable) {
                // @ts-ignore
                courier.MoveTo(TargetPosition);
            }
        }
    }

    // 3. Союзники (Shared/Leavers)
    if (FeedAllies.value) {
        const heroes = EntityManager.GetEntitiesByClass("CDOTA_BaseNPC_Hero");
        for (const hero of heroes) {
            if (hero === MyHero) continue;
            // @ts-ignore
            if (hero.IsAlive && hero.IsControllable) {
                // @ts-ignore
                hero.MoveTo(TargetPosition);
            }
        }
    }
});

console.log("Auto Feed виправлено. Якщо біжить не туди - зміни сторону в меню!");
