import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3
} from "github.com/octarine-public/wrapper/index"

// --- ОБ'ЄДНАНЕ МЕНЮ ---
const MainMenu = Menu.AddEntry("Denis Ultimate");

// Секція Фіду (твій робочий код)
const FeedTab = MainMenu.AddEntry("Auto Feed Ultra");
const EnableFeed = FeedTab.AddToggle("УВІМКНУТИ ФІД", false);
const MySide = FeedTab.AddToggle("Я за ТЬМУ (Dire)", false); 

// Секція Армлета (тепер без "стрибків")
const ArmletTab = MainMenu.AddEntry("Armlet God");
const EnableArmlet = ArmletTab.AddToggle("Увімкнути Абуз", false);
// Використовуємо список, щоб значення не "стрибали"
const ArmletHP = ArmletTab.AddList("Поріг ХП для абуза", ["200", "250", "300", "350", "400"], 1);

// Базові координати
const RadiantFountain = { x: -7200, y: -6600, z: 384 };
const DireFountain = { x: 7200, y: 6500, z: 384 };

let lastActionTime = 0;
let nextRandomDelay = 5000;
let lastArmletTime = 0;

EventsSDK.on("PostDataUpdate", () => {
    const MyHero = LocalPlayer?.Hero;
    if (!MyHero || !MyHero.IsAlive) return;

    const currentTime = Date.now();

    // --- 1. ЛОГІКА АРМЛЕТА (Високий пріоритет) ---
    if (EnableArmlet.value && (currentTime - lastArmletTime > 150)) {
        // Отримуємо значення зі списку (індекс 1 = 250 за замовчуванням)
        const thresholds = [200, 250, 300, 350, 400];
        const currentThreshold = thresholds[ArmletHP.value];

        // @ts-ignore
        const armlet = MyHero.GetItem("item_armlet");
        // @ts-ignore
        const isArmletActive = MyHero.HasModifier("modifier_item_armlet_unholy_strength");

        if (armlet && isArmletActive && MyHero.Health < currentThreshold) {
            // @ts-ignore
            armlet.Cast(); // Вимкнути
            // @ts-ignore
            armlet.Cast(); // Увімкнути
            lastArmletTime = currentTime;
        }
    }

    // --- 2. ЛОГІКА ФІДУ (Твій робочий код) ---
    if (EnableFeed.value) {
        if (currentTime - lastActionTime >= nextRandomDelay) {
            lastActionTime = currentTime;
            
            // Рандомна затримка 4-8 сек
            nextRandomDelay = Math.floor(Math.random() * (8000 - 4000) + 4000);

            const basePos = MySide.value ? RadiantFountain : DireFountain;
            const randomX = basePos.x + (Math.random() * 600 - 300);
            const randomY = basePos.y + (Math.random() * 600 - 300);
            const TargetPos = new Vector3(randomX, randomY, basePos.z);

            // @ts-ignore
            MyHero.MoveTo(TargetPos);
        }
    }
});

console.log("Denis Ultimate: Фідер та Армлет готові до роботи!");
