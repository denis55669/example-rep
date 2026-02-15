import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ ---
const FeedMenu = Menu.AddEntry("Auto Feed");
const EnableFeed = FeedMenu.AddToggle("УВІМКНУТИ ФІД", false); // Головний перемикач
const FeedMyHero = FeedMenu.AddToggle("Фідити моїм героєм", true);
const FeedAllies = FeedMenu.AddToggle("Фідити союзниками (Shared/Leavers)", true);
const FeedCouriers = FeedMenu.AddToggle("Фідити кур'єрами", true);

// Координати фонтанів (приблизні центри)
const RadiantFountain = new Vector3(-7200, -6600, 384);
const DireFountain = new Vector3(7200, 6500, 384);

EventsSDK.on("PostDataUpdate", () => {
    // Якщо головний перемикач вимкнений - нічого не робимо
    if (!EnableFeed.value) return;

    const MyHero = LocalPlayer?.Hero;
    if (!MyHero) return;

    // Визначаємо куди бігти (якщо ми Radiant (2) -> біжимо на Dire, і навпаки)
    const TargetPosition = MyHero.TeamNum === 2 ? DireFountain : RadiantFountain;

    // 1. Фід основним героєм
    if (FeedMyHero.value && MyHero.IsAlive) {
        // @ts-ignore
        MyHero.MoveTo(TargetPosition);
    }

    // 2. Фід кур'єрами
    if (FeedCouriers.value) {
        // Шукаємо всіх кур'єрів
        const couriers = EntityManager.GetEntitiesByClass("CDOTA_Unit_Courier");
        for (const courier of couriers) {
            // Якщо кур'єр наш, живий і ми можемо ним керувати
            if (courier.TeamNum === MyHero.TeamNum && courier.IsAlive && courier.IsControllable) {
                // @ts-ignore
                courier.MoveTo(TargetPosition);
            }
        }
    }

    // 3. Фід союзниками (Лівнутими або тими, хто дав контроль)
    if (FeedAllies.value) {
        // Шукаємо всіх героїв
        const heroes = EntityManager.GetEntitiesByClass("CDOTA_BaseNPC_Hero");
        for (const hero of heroes) {
            // Пропускаємо себе, щоб не дублювати команду
            if (hero === MyHero) continue;

            // Перевірка: чи це союзник, чи він живий і чи є у нас контроль
            if (hero.TeamNum === MyHero.TeamNum && hero.IsAlive && hero.IsControllable) {
                // @ts-ignore
                hero.MoveTo(TargetPosition);
            }
        }
    }
});

console.log("Auto Feed завантажено. Обережно з перемикачем!");
