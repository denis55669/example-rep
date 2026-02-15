import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager
} from "github.com/octarine-public/wrapper/index"

// Малюємо меню з іконкою
const FeedMenu = Menu.AddEntry("Auto Feed Ultra", "panorama/images/items/travel_boots_png.vtex_c");
const EnableFeed = FeedMenu.AddToggle("УВІМКНУТИ ФІД", false);
const MySide = FeedMenu.AddToggle("Я за ТЬМУ (Dire)", false); 

const RadiantFountain = new Vector3(-7200, -6600, 384);
const DireFountain = new Vector3(7200, 6500, 384);

let lastActionTime = 0;

EventsSDK.on("PostDataUpdate", () => {
    if (!EnableFeed.value) return;

    const currentTime = Date.now();
    // Стабільна затримка 5 секунд
    if (currentTime - lastActionTime < 5000) return;
    lastActionTime = currentTime;

    const MyHero = LocalPlayer?.Hero;
    if (!MyHero) return;

    const TargetPos = MySide.value ? RadiantFountain : DireFountain;

    // 1. Рухаємо свого героя (Оригінальний метод, що працював)
    if (MyHero.IsAlive) {
        // @ts-ignore
        MyHero.MoveTo(TargetPos);
    }

    // 2. Рухаємо союзників (Найпростіший метод через EntityManager)
    const allEntities = EntityManager.GetEntitiesByClass("CDOTA_BaseNPC_Hero");
    for (const ent of allEntities) {
        // Якщо це герой, він живий і ТИ можеш ним керувати
        // @ts-ignore
        if (ent && ent.IsAlive && ent.IsControllable) {
            // @ts-ignore
            ent.MoveTo(TargetPos);
        }
    }
});

console.log("Back to Basics: Фід активовано.");
