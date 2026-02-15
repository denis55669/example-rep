import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ ---
const Entry = Menu.AddEntry("Auto Feed Ultra");
const EnableFeed = Entry.AddToggle("УВІМКНУТИ ФІД", false);
const MySide = Entry.AddToggle("Я за ТЬМУ (Dire)", false); 
const SlowMode = Entry.AddSlider("Затримка кліків (мс)", 1000, 10000, 3000); // 3 секунди за замовчуванням

const RadiantFountain = new Vector3(-7200, -6600, 384);
const DireFountain = new Vector3(7200, 6500, 384);

let lastClickTime = 0;

EventsSDK.on("PostDataUpdate", () => {
    if (!EnableFeed.value) return;

    // Дуже повільні кліки
    const currentTime = Date.now();
    if (currentTime - lastClickTime < SlowMode.value) return;
    lastClickTime = currentTime;

    const MyHero = LocalPlayer?.Hero;
    if (!MyHero) return;

    const TargetPos = MySide.value ? RadiantFountain : DireFountain;

    // БЕРЕМО ВЗАГАЛІ ВСІХ СОЮЗНИКІВ НА КАРТІ
    // Це включає: тебе, тіммейтів, кур'єрів, саммонів
    const myTeamUnits = EntityManager.GetEntitiesByTeam(MyHero.TeamNum);

    for (const unit of myTeamUnits) {
        // Перевірка: чи живий юніт і чи можемо ми ним КЕРУВАТИ
        // IsControllable - це головний фільтр для кур'єрів та лівнутих
        // @ts-ignore
        if (unit && unit.IsAlive && unit.IsControllable) {
            
            // @ts-ignore
            const unitName = unit.UnitName || "Unknown";
            
            // Якщо це не ворог і не будівля - біжимо!
            // @ts-ignore
            unit.MoveTo(TargetPos);
            
            // Вивід у консоль для тесту (потім можна видалити)
            console.log("Фідимо юнітом: " + unitName);
        }
    }
});
