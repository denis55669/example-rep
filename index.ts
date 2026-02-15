import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager
} from "github.com/octarine-public/wrapper/index"

// --- ЕДИНОЕ МЕНЮ (Чтобы не прыгало) ---
const MainMenu = Menu.AddEntry("Denis Ultimate Pack");

// Настройки Фида
const FeedSettings = MainMenu.AddEntry("Auto Feed (Всегда активен)");
const MySide = FeedSettings.AddToggle("Я за ТЬМУ (Dire)", false); 
const FeedAllies = FeedSettings.AddToggle("Фидить союзниками", true);

// Настройки Армлета
const ArmletSettings = MainMenu.AddEntry("Armlet God");
const EnableArmlet = ArmletSettings.AddToggle("Включить Абуз", false);
const MinHP = ArmletSettings.AddSlider("Мин. ХП для абуза", 100, 1000, 250);

// Координаты и таймеры
const RadiantFountain = new Vector3(-7200, -6600, 384);
const DireFountain = new Vector3(7200, 6500, 384);

let lastFeedTime = 0;
let lastArmletTime = 0;

EventsSDK.on("PostDataUpdate", () => {
    const MyHero = LocalPlayer?.Hero;
    if (!MyHero || !MyHero.IsAlive) return;

    const now = Date.now();

    // --- 1. ЛОГИКА АРМЛЕТА (Если включен) ---
    if (EnableArmlet.value && (now - lastArmletTime > 150)) {
        // @ts-ignore
        const armlet = MyHero.GetItem("item_armlet");
        // @ts-ignore
        const isActive = MyHero.HasModifier("modifier_item_armlet_unholy_strength");

        if (armlet && isActive && MyHero.Health < MinHP.value) {
            // @ts-ignore
            armlet.Cast(); // Выкл
            // @ts-ignore
            armlet.Cast(); // Вкл
            lastArmletTime = now;
        }
    }

    // --- 2. ЛОГИКА ФИДА (РАБОТАЕТ ВСЕГДА) ---
    // Каждые 6 секунд отправляем всех на фонтан
    if (now - lastFeedTime > 6000) {
        lastFeedTime = now;
        const Target = MySide.value ? RadiantFountain : DireFountain;

        // Функция для рандомного клика (защита от бана)
        const getOffsetPos = (base: Vector3) => {
            return new Vector3(
                base.x + (Math.random() * 400 - 200),
                base.y + (Math.random() * 400 - 200),
                base.z
            );
        };

        // Твой герой бежит всегда
        // @ts-ignore
        MyHero.MoveTo(getOffsetPos(Target));

        // Союзники (если включено)
        if (FeedAllies.value) {
            const heroes = EntityManager.GetEntitiesByClass("CDOTA_BaseNPC_Hero");
            for (const hero of heroes) {
                // @ts-ignore
                if (hero && hero !== MyHero && hero.IsAlive && hero.IsControllable) {
                    // @ts-ignore
                    hero.MoveTo(getOffsetPos(Target));
                }
            }
        }
    }
});

console.log("Denis Ultimate Pack: Фид всегда включен, Армлет ждет активации.");
