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
const MySide = FeedMenu.AddToggle("Я за ТЬМУ (Dire)", false); // Зміни, якщо біжать додому
const FeedMyHero = FeedMenu.AddToggle("Фідити моїм героєм", true);
const FeedOthers = FeedMenu.AddToggle("Фідити всіма підконтрольними", true);

// Координати фонтанів
const RadiantFountain = new Vector3(-7200, -6600, 384);
const DireFountain = new Vector3(7200, 6500, 384);

EventsSDK.on("PostDataUpdate", () => {
    // Якщо фід вимкнений - виходимо
    if (!EnableFeed.value) return;

    const MyHero = LocalPlayer?.Hero;
    if (!MyHero) return;

    // Визначаємо ціль (Ворожий фонтан)
    const TargetPosition = MySide.value ? RadiantFountain : DireFountain;

    // 1. Отримуємо ВСІХ NPC (Герої, Кур'єри, Крипи)
    // "CDOTA_BaseNPC" - це базовий клас для всього живого в Доті
    const allUnits = EntityManager.GetEntitiesByClass("CDOTA_BaseNPC");

    for (const unit of allUnits) {
        // Перевірки:
        // 1. Живий?
        // 2. Наш? (TeamNum збігається)
        // 3. Чи можемо ми керувати? (IsControllable - ключова перевірка для лівнутих/курьерів)
        // @ts-ignore
        if (!unit || !unit.IsAlive || unit.TeamNum !== MyHero.TeamNum || !unit.IsControllable) {
            continue;
        }

        // Логіка для МЕНЕ
        if (unit === MyHero) {
            if (FeedMyHero.value) {
                // @ts-ignore
                unit.MoveTo(TargetPosition);
            }
            continue;
        }

        // Логіка для ВСІХ ІНШИХ (Кур'єри, Союзники, Крипи)
        if (FeedOthers.value) {
            // @ts-ignore
            unit.MoveTo(TargetPosition);
        }
    }
});

console.log("Total Feed завантажено. Тепер побіжать усі!");
